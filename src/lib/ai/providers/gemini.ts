import { z } from 'zod';
import { AIProvider, AIResponse } from '../types';

// Basic server-side rate limiting: track last call timestamp per feature
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 3000; // 3 seconds between calls per feature

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
  modelName = 'gemini-2.5-flash';
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

  private buildRequestBody(prompt: string, systemInstruction?: string, jsonMode = false) {
    const body: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };

    // Use Gemini's native system_instruction field for better model behavior
    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    return body;
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemInstruction?: string
  ): Promise<AIResponse<T>> {
    const startTime = Date.now();

    const apiKeyError = this.getApiKeyError();
    if (apiKeyError) {
      return {
        success: false,
        error: apiKeyError,
        provider: this.name,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
      };
    }

    // Basic rate limit check
    const rateLimitError = checkRateLimit('structured');
    if (rateLimitError) {
      return {
        success: false,
        error: rateLimitError,
        provider: this.name,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.buildRequestBody(prompt, systemInstruction, true)),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let parsedErr = 'Gemini API returned error response';
        try {
          const errJson = JSON.parse(errorBody);
          parsedErr = errJson.error?.message || parsedErr;
        } catch {
          // ignore parsing error
        }
        return {
          success: false,
          error: `Gemini Provider Error: ${parsedErr}`,
          provider: this.name,
          model: this.modelName,
          latencyMs: Date.now() - startTime,
        };
      }

      const resJson = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      const tokensUsed = resJson.usageMetadata?.totalTokenCount;

      if (!rawText) {
        return {
          success: false,
          error: 'Gemini Provider returned empty response candidates.',
          provider: this.name,
          model: this.modelName,
          latencyMs: Date.now() - startTime,
          tokensUsed,
        };
      }

      // Parse JSON
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (jsonErr: unknown) {
        const message = jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON parsing error';
        return {
          success: false,
          error: `Malformed JSON response from Gemini model: ${message}`,
          provider: this.name,
          model: this.modelName,
          latencyMs: Date.now() - startTime,
        };
      }

      // Zod Validation
      const parseResult = schema.safeParse(parsedJson);
      if (!parseResult.success) {
        const zodErrMsg = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return {
          success: false,
          error: `Zod validation failed for model response: ${zodErrMsg}`,
          provider: this.name,
          model: this.modelName,
          latencyMs: Date.now() - startTime,
        };
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
      return {
        success: false,
        error: message,
        provider: this.name,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async generateText(
    prompt: string,
    systemInstruction?: string
  ): Promise<AIResponse<string>> {
    const startTime = Date.now();

    const apiKeyError = this.getApiKeyError();
    if (apiKeyError) {
      return {
        success: false,
        error: apiKeyError,
        provider: this.name,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
      };
    }

    // Basic rate limit check
    const rateLimitError = checkRateLimit('text');
    if (rateLimitError) {
      return {
        success: false,
        error: rateLimitError,
        provider: this.name,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.buildRequestBody(prompt, systemInstruction, false)),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let parsedErr = 'Gemini API returned error response';
        try {
          const errJson = JSON.parse(errorBody);
          parsedErr = errJson.error?.message || parsedErr;
        } catch {
          // ignore parsing error
        }
        return {
          success: false,
          error: `Gemini Provider Error: ${parsedErr}`,
          provider: this.name,
          model: this.modelName,
          latencyMs: Date.now() - startTime,
        };
      }

      const resJson = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      const tokensUsed = resJson.usageMetadata?.totalTokenCount;

      if (!rawText) {
        return {
          success: false,
          error: 'Gemini Provider returned empty response candidates.',
          provider: this.name,
          model: this.modelName,
          latencyMs: Date.now() - startTime,
        };
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
      return {
        success: false,
        error: message,
        provider: this.name,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
      };
    }
  }
}
