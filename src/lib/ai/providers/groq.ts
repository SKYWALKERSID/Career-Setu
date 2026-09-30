import { z } from 'zod';
import { AIErrorCategory, AIProvider, AIResponse } from '../types';

const RATE_LIMIT_COOLDOWN_MS = 3000;
const MAX_TRANSIENT_RETRIES = 1;
const MAX_RETRY_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 30000;

const rateLimitMap = new Map<string, number>();

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
    tokensUsed?: number
  ): AIResponse<T> {
    return {
      success: false,
      error,
      errorCategory,
      provider: this.name,
      model: this.modelName,
      latencyMs: Date.now() - startTime,
      tokensUsed,
    };
  }

  private buildRequestBody(prompt: string, systemInstruction?: string): Record<string, unknown> {
    return {
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt },
      ],
      model: this.modelName,
      response_format: { type: 'json_object' },
    };
  }

  private async request(body: Record<string, unknown>): Promise<Response> {
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
    const rateLimitError = checkRateLimit(`structured:${prompt.slice(0, 160)}`);
    if (rateLimitError) return this.failure(rateLimitError, 'AI_RATE_LIMIT_ERROR', startTime);

    try {
      const response = await this.request(this.buildRequestBody(prompt, systemInstruction));
      const responseBody = await response.text();
      let parsedResponse: { error?: { message?: string }; choices?: Array<{ message?: { content?: string | null } }>; usage?: { total_tokens?: number } } = {};
      try {
        parsedResponse = JSON.parse(responseBody);
      } catch {
        return { ...this.failure(`Groq Provider Error (HTTP ${response.status}): Invalid provider response.`, 'AI_PARSE_ERROR', startTime), statusCode: response.status };
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
        return { ...this.failure(`Groq Provider Error (HTTP ${status}): ${parsedResponse.error?.message || 'Request failed.'}`, category, startTime, tokensUsed), statusCode: status };
      }

      const rawText = parsedResponse.choices?.[0]?.message?.content;
      if (!rawText) return this.failure('Groq Provider returned an empty response.', 'AI_EMPTY_RESPONSE', startTime, tokensUsed);

      const cleanedText = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleanedText);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown JSON parsing error';
        return this.failure(`Malformed JSON response from Groq model: ${message}`, 'AI_PARSE_ERROR', startTime, tokensUsed);
      }

      const result = schema.safeParse(parsedJson);
      if (!result.success) {
        const message = result.error.errors.map((entry) => `${entry.path.join('.')}: ${entry.message}`).join(', ');
        return this.failure(`Zod validation failed for model response: ${message}`, 'AI_SCHEMA_ERROR', startTime, tokensUsed);
      }

      return { success: true, data: result.data, provider: this.name, model: this.modelName, latencyMs: Date.now() - startTime, tokensUsed };
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

    const rateLimitError = checkRateLimit(`text:${prompt.slice(0, 160)}`);
    if (rateLimitError) return this.failure(rateLimitError, 'AI_RATE_LIMIT_ERROR', startTime);

    try {
      const body = this.buildRequestBody(prompt, systemInstruction);
      delete body.response_format;
      const response = await this.request(body);
      const responseBody = await response.text();
      let parsedResponse: { error?: { message?: string }; choices?: Array<{ message?: { content?: string | null } }>; usage?: { total_tokens?: number } } = {};
      try {
        parsedResponse = JSON.parse(responseBody);
      } catch {
        return { ...this.failure(`Groq Provider Error (HTTP ${response.status}): Invalid provider response.`, 'AI_PARSE_ERROR', startTime), statusCode: response.status };
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
        return { ...this.failure(`Groq Provider Error (HTTP ${status}): ${parsedResponse.error?.message || 'Request failed.'}`, category, startTime, tokensUsed), statusCode: status };
      }

      const rawText = parsedResponse.choices?.[0]?.message?.content;
      if (!rawText) return this.failure('Groq Provider returned an empty response.', 'AI_EMPTY_RESPONSE', startTime, tokensUsed);
      return { success: true, data: rawText, provider: this.name, model: this.modelName, latencyMs: Date.now() - startTime, tokensUsed };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return this.failure('Groq provider request timed out.', 'AI_TIMEOUT_ERROR', startTime);
      }
      return this.failure(error instanceof Error ? error.message : 'Failed to call Groq provider.', 'AI_NETWORK_ERROR', startTime);
    }
  }
}
