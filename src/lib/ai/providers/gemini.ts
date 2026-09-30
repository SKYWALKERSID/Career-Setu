import { z } from 'zod';
import { AIErrorCategory, AIProvider, AIResponse } from '../types';

// Basic server-side rate limiting: track last call timestamp per feature
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 3000; // 3 seconds between calls per feature
const MAX_TRANSIENT_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 2000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

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

export class GeminiProvider implements AIProvider {
  name = 'Gemini (Google DeepMind)';
  modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
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

  private async request(body: Record<string, unknown>): Promise<Response> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.modelName)}:generateContent`;

    for (let attempt = 0; ; attempt += 1) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt >= MAX_TRANSIENT_RETRIES) {
        return response;
      }

      const retryAfterSeconds = Number(response.headers.get('retry-after'));
      const retryAfterMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 0;
      const exponentialDelayMs = BASE_RETRY_DELAY_MS * 2 ** attempt;
      const delayMs = Math.min(Math.max(exponentialDelayMs, retryAfterMs), MAX_RETRY_DELAY_MS);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
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

    // Basic rate limit check
    const rateLimitError = checkRateLimit('structured');
    if (rateLimitError) {
      return this.failure(rateLimitError, 'AI_RATE_LIMIT_ERROR', startTime);
    }

    try {
      const response = await this.request(this.buildRequestBody(prompt, systemInstruction, true));

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
        return { ...this.failure(`Gemini Provider Error (HTTP ${response.status}): ${parsedErr}`, category, startTime), statusCode: response.status };
      }

      const resJson = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      const tokensUsed = resJson.usageMetadata?.totalTokenCount;

      if (!rawText) {
        return this.failure('Gemini Provider returned empty response candidates.', 'AI_EMPTY_RESPONSE', startTime, tokensUsed);
      }

      const cleanedText = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      // Parse JSON
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleanedText);
      } catch (jsonErr: unknown) {
        const message = jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON parsing error';
        return this.failure(`Malformed JSON response from Gemini model: ${message}`, 'AI_PARSE_ERROR', startTime);
      }

      // Zod Validation
      const parseResult = schema.safeParse(parsedJson);
      if (!parseResult.success) {
        const zodErrMsg = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return this.failure(`Zod validation failed for model response: ${zodErrMsg}`, 'AI_SCHEMA_ERROR', startTime);
      }

      return {
        success: true,
        data: parseResult.data,
        provider: this.name,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
        tokensUsed,
      };
    } catch (err: unknown) {
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

    // Basic rate limit check
    const rateLimitError = checkRateLimit('text');
    if (rateLimitError) {
      return this.failure(rateLimitError, 'AI_RATE_LIMIT_ERROR', startTime);
    }

    try {
      const response = await this.request(this.buildRequestBody(prompt, systemInstruction, false));

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
        return { ...this.failure(`Gemini Provider Error (HTTP ${response.status}): ${parsedErr}`, category, startTime), statusCode: response.status };
      }

      const resJson = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      const tokensUsed = resJson.usageMetadata?.totalTokenCount;

      if (!rawText) {
        return this.failure('Gemini Provider returned empty response candidates.', 'AI_EMPTY_RESPONSE', startTime);
      }

      return {
        success: true,
        data: rawText,
        provider: this.name,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
        tokensUsed,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to call Gemini provider';
      return this.failure(message, 'AI_NETWORK_ERROR', startTime);
    }
  }
}
