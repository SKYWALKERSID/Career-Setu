import { createHash } from 'node:crypto';
import { z } from 'zod';
import { AIErrorCategory, AIProvider, AIResponse } from '../types';

const RATE_LIMIT_COOLDOWN_MS = 1000;
const MAX_TRANSIENT_RETRIES = 1;
const MAX_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 18000;
const FALLBACK_GROQ_MODELS = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

const rateLimitMap = new Map<string, number>();

function promptKey(prefix: string, prompt: string): string {
  return `${prefix}:${createHash('sha256').update(prompt).digest('hex').slice(0, 24)}`;
}

function checkRateLimit(featureKey: string): string | null {
  const now = Date.now();
  const lastCall = rateLimitMap.get(featureKey);
  if (lastCall && now - lastCall < RATE_LIMIT_COOLDOWN_MS) {
    const waitSec = Math.ceil((RATE_LIMIT_COOLDOWN_MS - (now - lastCall)) / 1000);
    return `Rate limited: Please wait ${waitSec}s before retrying.`;
  }
  rateLimitMap.set(featureKey, now);
  return null;
}

export class GroqProvider implements AIProvider {
  name = 'Groq';
  modelName = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
  }

  private failure<T>(
    error: string,
    errorCategory: AIErrorCategory,
    startTime: number,
    tokensUsed?: number,
    model = this.modelName
  ): AIResponse<T> {
    return {
      success: false,
      error,
      errorCategory,
      provider: this.name,
      model,
      latencyMs: Date.now() - startTime,
      tokensUsed,
    };
  }

  private buildRequestBody(prompt: string, systemInstruction?: string, model = this.modelName): Record<string, unknown> {
    const estimatedPromptTokens = Math.ceil((prompt.length + (systemInstruction?.length || 0)) / 3.2);
    const maxCompletionTokens = Math.max(1024, Math.min(2600, 7400 - estimatedPromptTokens));
    return {
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt },
      ],
      model,
      temperature: 0.1,
      max_completion_tokens: maxCompletionTokens,
      ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'medium' } : {}),
      response_format: { type: 'json_object' },
    };
  }

  private async requestWithModel(body: Record<string, unknown>): Promise<Response> {
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    for (let attempt = 0; ; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (![500, 502, 503, 504].includes(response.status) || attempt >= MAX_TRANSIENT_RETRIES) {
          return response;
        }

        const delayMs = Math.min(250 * 2 ** attempt, MAX_RETRY_DELAY_MS);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  private async request(prompt: string, systemInstruction?: string, jsonMode = true): Promise<{ response: Response; modelUsed: string }> {
    const candidates = [this.modelName, ...FALLBACK_GROQ_MODELS.filter((m) => m !== this.modelName)];
    let lastResponse: Response | null = null;
    let lastModel = this.modelName;

    for (const candidateModel of candidates) {
      lastModel = candidateModel;
      const body = this.buildRequestBody(prompt, systemInstruction, candidateModel);
      if (!jsonMode) {
        delete body.response_format;
      }
      const response = await this.requestWithModel(body);
      lastResponse = response;
      if (response.ok || ![429, 500, 502, 503, 504].includes(response.status)) {
        return { response, modelUsed: candidateModel };
      }
    }

    return { response: lastResponse!, modelUsed: lastModel };
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemInstruction?: string
  ): Promise<AIResponse<T>> {
    const startTime = Date.now();

    if (!this.apiKey || this.apiKey === 'your-groq-api-key-here') {
      return this.failure('AI provider not configured: GROQ_API_KEY is missing or invalid.', 'AI_CONFIG_ERROR', startTime);
    }

    // Throttle identical retries, while allowing a sequential interview turn or
    // another distinct product operation to make its own provider request.
    const rateLimitError = checkRateLimit(promptKey('structured', prompt));
    if (rateLimitError) return this.failure(rateLimitError, 'AI_RATE_LIMIT_ERROR', startTime);

    try {
      const { response, modelUsed } = await this.request(prompt, systemInstruction, true);
      const responseBody = await response.text();
      let parsedResponse: { error?: { message?: string }; choices?: Array<{ message?: { content?: string | null } }>; usage?: { total_tokens?: number } } = {};
      try {
        parsedResponse = JSON.parse(responseBody);
      } catch {
        return { ...this.failure(`Groq Provider Error (HTTP ${response.status}): Invalid provider response.`, 'AI_PARSE_ERROR', startTime, undefined, modelUsed), statusCode: response.status };
      }

      const tokensUsed = parsedResponse.usage?.total_tokens;
      if (!response.ok) {
        const status = response.status;
        const category: AIErrorCategory = status === 401 || status === 403
          ? 'AI_AUTH_ERROR'
          : status === 429
            ? 'AI_RATE_LIMIT_ERROR'
            : status >= 500
              ? 'AI_CAPACITY_ERROR'
              : 'AI_PROVIDER_ERROR';
        return { ...this.failure(`Groq Provider Error (HTTP ${status}): ${parsedResponse.error?.message || 'Request failed.'}`, category, startTime, tokensUsed, modelUsed), statusCode: status };
      }

      const rawText = parsedResponse.choices?.[0]?.message?.content;
      if (!rawText) return this.failure('Groq Provider returned an empty response.', 'AI_EMPTY_RESPONSE', startTime, tokensUsed, modelUsed);

      const cleanedText = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleanedText);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown JSON parsing error';
        return this.failure(`Malformed JSON response from Groq model: ${message}`, 'AI_PARSE_ERROR', startTime, tokensUsed, modelUsed);
      }

      const result = schema.safeParse(parsedJson);
      if (!result.success) {
        const message = result.error.errors.map((entry) => `${entry.path.join('.')}: ${entry.message}`).join(', ');
        return this.failure(`Zod validation failed for model response: ${message}`, 'AI_SCHEMA_ERROR', startTime, tokensUsed, modelUsed);
      }

      return { success: true, data: result.data, provider: this.name, model: modelUsed, latencyMs: Date.now() - startTime, tokensUsed };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return this.failure('Groq provider request timed out.', 'AI_TIMEOUT_ERROR', startTime);
      }
      return this.failure(error instanceof Error ? error.message : 'Failed to call Groq provider.', 'AI_NETWORK_ERROR', startTime);
    }
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<AIResponse<string>> {
    const startTime = Date.now();
    if (!this.apiKey || this.apiKey === 'your-groq-api-key-here') {
      return this.failure('AI provider not configured: GROQ_API_KEY is missing or invalid.', 'AI_CONFIG_ERROR', startTime);
    }

    const rateLimitError = checkRateLimit(promptKey('text', prompt));
    if (rateLimitError) return this.failure(rateLimitError, 'AI_RATE_LIMIT_ERROR', startTime);

    try {
      const { response, modelUsed } = await this.request(prompt, systemInstruction, false);
      const responseBody = await response.text();
      let parsedResponse: { error?: { message?: string }; choices?: Array<{ message?: { content?: string | null } }>; usage?: { total_tokens?: number } } = {};
      try {
        parsedResponse = JSON.parse(responseBody);
      } catch {
        return { ...this.failure(`Groq Provider Error (HTTP ${response.status}): Invalid provider response.`, 'AI_PARSE_ERROR', startTime, undefined, modelUsed), statusCode: response.status };
      }

      const tokensUsed = parsedResponse.usage?.total_tokens;
      if (!response.ok) {
        const status = response.status;
        const category: AIErrorCategory = status === 401 || status === 403
          ? 'AI_AUTH_ERROR'
          : status === 429
            ? 'AI_RATE_LIMIT_ERROR'
            : status >= 500
              ? 'AI_CAPACITY_ERROR'
              : 'AI_PROVIDER_ERROR';
        return { ...this.failure(`Groq Provider Error (HTTP ${status}): ${parsedResponse.error?.message || 'Request failed.'}`, category, startTime, tokensUsed, modelUsed), statusCode: status };
      }

      const rawText = parsedResponse.choices?.[0]?.message?.content;
      if (!rawText) return this.failure('Groq Provider returned an empty response.', 'AI_EMPTY_RESPONSE', startTime, tokensUsed, modelUsed);
      return { success: true, data: rawText, provider: this.name, model: modelUsed, latencyMs: Date.now() - startTime, tokensUsed };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return this.failure('Groq provider request timed out.', 'AI_TIMEOUT_ERROR', startTime);
      }
      return this.failure(error instanceof Error ? error.message : 'Failed to call Groq provider.', 'AI_NETWORK_ERROR', startTime);
    }
  }
}
