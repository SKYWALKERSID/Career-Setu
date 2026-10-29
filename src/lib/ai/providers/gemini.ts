import { createHash } from 'node:crypto';
import { z } from 'zod';
import { AIErrorCategory, AIProvider, AIResponse } from '../types';

// Basic server-side rate limiting: track last call timestamp per prompt
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 1000;
const MAX_TRANSIENT_RETRIES = 1;
const BASE_RETRY_DELAY_MS = 400;
const MAX_RETRY_DELAY_MS = 1200;
const REQUEST_TIMEOUT_MS = 15000;
const FALLBACK_GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

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

function extractCandidateText(resJson: { candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }> }): string | undefined {
  const parts = resJson.candidates?.[0]?.content?.parts || [];
  const nonThought = parts.filter((part) => !part.thought && typeof part.text === 'string');
  return nonThought[nonThought.length - 1]?.text ?? parts[0]?.text;
}

export class GeminiProvider implements AIProvider {
  name = 'Gemini (Google DeepMind)';
  modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
  }

  private getApiKeyError(): string | null {
    if (!this.apiKey || this.apiKey === 'your-gemini-api-key-here') {
      return 'AI provider not configured: GEMINI_API_KEY is missing or invalid.';
    }
    return null;
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

  private buildRequestBody(prompt: string, systemInstruction?: string, jsonMode = false) {
    const body: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        thinkingConfig: {
          thinkingLevel: process.env.GEMINI_THINKING_LEVEL || 'low',
        },
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };

    // Gemini REST expects the camelCase systemInstruction field.
    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    return body;
  }

  private async requestSingleModel(model: string, body: Record<string, unknown>): Promise<Response> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    for (let attempt = 0; ; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt >= MAX_TRANSIENT_RETRIES) {
          return response;
        }

        const retryAfterSeconds = Number(response.headers.get('retry-after'));
        const retryAfterMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 0;
        const exponentialDelayMs = BASE_RETRY_DELAY_MS * 2 ** attempt;
        const delayMs = Math.min(Math.max(exponentialDelayMs, retryAfterMs), MAX_RETRY_DELAY_MS);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  private async request(body: Record<string, unknown>): Promise<{ response: Response; modelUsed: string }> {
    const candidates = [this.modelName, ...FALLBACK_GEMINI_MODELS.filter((m) => m !== this.modelName)];
    let lastError: unknown = null;
    let lastResponse: Response | null = null;
    let lastModel = this.modelName;

    for (const candidateModel of candidates) {
      lastModel = candidateModel;
      try {
        const response = await this.requestSingleModel(candidateModel, body);
        lastResponse = response;
        if (response.ok || (!RETRYABLE_STATUS_CODES.has(response.status) && response.status !== 404 && response.status !== 400)) {
          return { response, modelUsed: candidateModel };
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (lastResponse) {
      return { response: lastResponse, modelUsed: lastModel };
    }
    throw lastError || new Error('Gemini provider request failed.');
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemInstruction?: string
  ): Promise<AIResponse<T>> {
    const startTime = Date.now();

    const apiKeyError = this.getApiKeyError();
    if (apiKeyError) {
      return this.failure(apiKeyError, 'AI_CONFIG_ERROR', startTime);
    }

    // Basic rate limit check per unique prompt
    const rateLimitError = checkRateLimit(promptKey('structured', prompt));
    if (rateLimitError) {
      return this.failure(rateLimitError, 'AI_RATE_LIMIT_ERROR', startTime);
    }

    try {
      const { response, modelUsed } = await this.request(this.buildRequestBody(prompt, systemInstruction, true));

      if (!response.ok) {
        const errorBody = await response.text();
        let parsedErr = 'Gemini API returned error response';
        try {
          const errJson = JSON.parse(errorBody);
          parsedErr = errJson.error?.message || parsedErr;
        } catch {
          // ignore parsing error
        }
        const category = response.status === 429 ? 'AI_RATE_LIMIT_ERROR' : response.status >= 500 ? 'AI_CAPACITY_ERROR' : 'AI_PROVIDER_ERROR';
        return { ...this.failure(`Gemini Provider Error (HTTP ${response.status}): ${parsedErr}`, category, startTime, undefined, modelUsed), statusCode: response.status };
      }

      const resJson = await response.json();
      const rawText = extractCandidateText(resJson);
      const tokensUsed = resJson.usageMetadata?.totalTokenCount;

      if (!rawText) {
        return this.failure('Gemini Provider returned empty response candidates.', 'AI_EMPTY_RESPONSE', startTime, tokensUsed, modelUsed);
      }

      const cleanedText = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      // Parse JSON
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleanedText);
      } catch (jsonErr: unknown) {
        const firstBrace = cleanedText.indexOf('{');
        const lastBrace = cleanedText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            parsedJson = JSON.parse(cleanedText.slice(firstBrace, lastBrace + 1));
          } catch {
            const message = jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON parsing error';
            return this.failure(`Malformed JSON response from Gemini model: ${message}`, 'AI_PARSE_ERROR', startTime, tokensUsed, modelUsed);
          }
        } else {
          const message = jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON parsing error';
          return this.failure(`Malformed JSON response from Gemini model: ${message}`, 'AI_PARSE_ERROR', startTime, tokensUsed, modelUsed);
        }
      }

      if (parsedJson && typeof parsedJson === 'object' && !Array.isArray(parsedJson)) {
        const obj = parsedJson as Record<string, unknown>;
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (const key of ['evidenced_skill_ids', 'role_required_skill_ids', 'not_evidenced_skill_ids']) {
          if (Array.isArray(obj[key])) {
            obj[key] = (obj[key] as unknown[]).filter((v): v is string => typeof v === 'string' && uuidRe.test(v.trim()));
          }
        }
      }

      // Zod Validation
      const parseResult = schema.safeParse(parsedJson);
      if (!parseResult.success) {
        const zodErrMsg = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return this.failure(`Zod validation failed for model response: ${zodErrMsg}`, 'AI_SCHEMA_ERROR', startTime, tokensUsed, modelUsed);
      }

      return {
        success: true,
        data: parseResult.data,
        provider: this.name,
        model: modelUsed,
        latencyMs: Date.now() - startTime,
        tokensUsed,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return this.failure('Gemini provider request timed out.', 'AI_TIMEOUT_ERROR', startTime);
      }
      const message = err instanceof Error ? err.message : 'Failed to call Gemini provider';
      return this.failure(message, 'AI_NETWORK_ERROR', startTime);
    }
  }

  async generateText(
    prompt: string,
    systemInstruction?: string
  ): Promise<AIResponse<string>> {
    const startTime = Date.now();

    const apiKeyError = this.getApiKeyError();
    if (apiKeyError) {
      return this.failure(apiKeyError, 'AI_CONFIG_ERROR', startTime);
    }

    // Basic rate limit check per unique prompt
    const rateLimitError = checkRateLimit(promptKey('text', prompt));
    if (rateLimitError) {
      return this.failure(rateLimitError, 'AI_RATE_LIMIT_ERROR', startTime);
    }

    try {
      const { response, modelUsed } = await this.request(this.buildRequestBody(prompt, systemInstruction, false));

      if (!response.ok) {
        const errorBody = await response.text();
        let parsedErr = 'Gemini API returned error response';
        try {
          const errJson = JSON.parse(errorBody);
          parsedErr = errJson.error?.message || parsedErr;
        } catch {
          // ignore parsing error
        }
        const category = response.status === 429 ? 'AI_RATE_LIMIT_ERROR' : response.status >= 500 ? 'AI_CAPACITY_ERROR' : 'AI_PROVIDER_ERROR';
        return { ...this.failure(`Gemini Provider Error (HTTP ${response.status}): ${parsedErr}`, category, startTime, undefined, modelUsed), statusCode: response.status };
      }

      const resJson = await response.json();
      const rawText = extractCandidateText(resJson);
      const tokensUsed = resJson.usageMetadata?.totalTokenCount;

      if (!rawText) {
        return this.failure('Gemini Provider returned empty response candidates.', 'AI_EMPTY_RESPONSE', startTime, tokensUsed, modelUsed);
      }

      return {
        success: true,
        data: rawText,
        provider: this.name,
        model: modelUsed,
        latencyMs: Date.now() - startTime,
        tokensUsed,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return this.failure('Gemini provider request timed out.', 'AI_TIMEOUT_ERROR', startTime);
      }
      const message = err instanceof Error ? err.message : 'Failed to call Gemini provider';
      return this.failure(message, 'AI_NETWORK_ERROR', startTime);
    }
  }
}
