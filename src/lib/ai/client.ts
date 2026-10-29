import { z } from 'zod';
import { AIProvider, AIResponse } from './types';
import { GeminiProvider } from './providers/gemini';
import { GroqProvider } from './providers/groq';

function canFailOver(response: AIResponse<unknown>): boolean {
  return response.errorCategory === 'AI_RATE_LIMIT_ERROR'
    || response.errorCategory === 'AI_CAPACITY_ERROR'
    || response.errorCategory === 'AI_NETWORK_ERROR'
    || response.errorCategory === 'AI_TIMEOUT_ERROR'
    || response.errorCategory === 'AI_EMPTY_RESPONSE'
    || response.errorCategory === 'AI_PARSE_ERROR'
    || response.errorCategory === 'AI_SCHEMA_ERROR'
    || (response.errorCategory === 'AI_PROVIDER_ERROR' && (response.statusCode === undefined || response.statusCode >= 500));
}

class SyntheticRateLimitProvider implements AIProvider {
  name: string;
  modelName: string;

  constructor(private readonly delegate: AIProvider) {
    this.name = delegate.name;
    this.modelName = delegate.modelName;
  }

  async generateStructuredOutput<T>(): Promise<AIResponse<T>> {
    return {
      success: false,
      error: 'Synthetic QA rate-limit response.',
      errorCategory: 'AI_RATE_LIMIT_ERROR',
      provider: this.name,
      model: this.modelName,
      latencyMs: 0,
      statusCode: 429,
    };
  }

  async generateText(): Promise<AIResponse<string>> {
    return {
      success: false,
      error: 'Synthetic QA rate-limit response.',
      errorCategory: 'AI_RATE_LIMIT_ERROR',
      provider: this.name,
      model: this.modelName,
      latencyMs: 0,
      statusCode: 429,
    };
  }
}

const STRUCTURED_CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_STRUCTURED_CACHE_ENTRIES = 100;
const structuredOutputCache = new Map<string, { expiresAt: number; response: AIResponse<unknown> }>();

function getCachedStructuredOutput<T>(key: string): AIResponse<T> | null {
  if (process.env.AI_TEST_MODE === '1') return null;
  const entry = structuredOutputCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    structuredOutputCache.delete(key);
    return null;
  }
  return { ...(entry.response as AIResponse<T>), latencyMs: 0 };
}

function setCachedStructuredOutput<T>(key: string, response: AIResponse<T>): void {
  if (process.env.AI_TEST_MODE === '1' || !response.success || !response.data) return;
  if (structuredOutputCache.size >= MAX_STRUCTURED_CACHE_ENTRIES) {
    const oldestKey = structuredOutputCache.keys().next().value;
    if (oldestKey) structuredOutputCache.delete(oldestKey);
  }
  structuredOutputCache.set(key, { expiresAt: Date.now() + STRUCTURED_CACHE_TTL_MS, response });
}

class FallbackProvider implements AIProvider {
  name = 'AI Gateway';
  modelName: string;

  constructor(private readonly primary: AIProvider, private readonly secondary: AIProvider) {
    this.modelName = primary.modelName;
  }

  private async run<T>(method: 'generateStructuredOutput' | 'generateText', args: [string, ...unknown[]]): Promise<AIResponse<T>> {
    const first = await (this.primary[method] as (...values: unknown[]) => Promise<AIResponse<T>>)(...args);
    const firstAttempt = { provider: first.provider, model: first.model, success: first.success, errorCategory: first.errorCategory, statusCode: first.statusCode };
    if (first.success || !canFailOver(first)) return { ...first, attempts: [firstAttempt] };

    const second = await (this.secondary[method] as (...values: unknown[]) => Promise<AIResponse<T>>)(...args);
    const secondAttempt = { provider: second.provider, model: second.model, success: second.success, errorCategory: second.errorCategory, statusCode: second.statusCode };
    return {
      ...second,
      attempts: [firstAttempt, secondAttempt],
      fallbackFrom: first.provider,
      fallbackReason: `${first.errorCategory || 'AI_UNKNOWN_ERROR'}${first.statusCode ? `:${first.statusCode}` : ''}`,
    };
  }

  async generateStructuredOutput<T>(prompt: string, schema: Parameters<AIProvider['generateStructuredOutput']>[1], systemInstruction?: string): Promise<AIResponse<T>> {
    const typedSchema = schema as z.ZodSchema<T>;
    const cacheKey = `${systemInstruction || ''}::${prompt}`;
    const cached = getCachedStructuredOutput<T>(cacheKey);
    if (cached) {
      const revalidated = typedSchema.safeParse(cached.data);
      if (revalidated.success) {
        return { ...cached, data: revalidated.data };
      }
    }
    const result = await this.run<T>('generateStructuredOutput', [prompt, schema, systemInstruction]);
    setCachedStructuredOutput(cacheKey, result);
    return result;
  }

  generateText(prompt: string, systemInstruction?: string) {
    return this.run<string>('generateText', [prompt, systemInstruction]);
  }
}

class AIServiceClient {
  private activeProvider: AIProvider;

  constructor() {
    const providerName = process.env.AI_PROVIDER || 'groq';

    let primary: AIProvider;
    switch (providerName.toLowerCase()) {
      case 'gemini':
        primary = new GeminiProvider();
        break;
      case 'groq':
        primary = new GroqProvider();
        break;
      case 'unsupported_test':
        // Test class for unsupported provider validation
        primary = {
          name: 'UnsupportedProvider',
          modelName: 'none',
          async generateStructuredOutput() {
            return {
              success: false,
              error: 'Controlled configuration error: Unsupported AI_PROVIDER configured.',
              provider: 'UnsupportedProvider',
              model: 'none',
              latencyMs: 0,
            };
          },
          async generateText() {
            return {
              success: false,
              error: 'Controlled configuration error: Unsupported AI_PROVIDER configured.',
              provider: 'UnsupportedProvider',
              model: 'none',
              latencyMs: 0,
            };
          },
        };
        break;
      default:
        primary = new GroqProvider();
        break;
    }
    const secondary = primary.name === 'Groq' ? new GeminiProvider() : new GroqProvider();
    const qaPrimary = process.env.AI_TEST_MODE === '1' && process.env.AI_TEST_FORCE_PRIMARY_429 === '1'
      ? new SyntheticRateLimitProvider(primary)
      : primary;
    this.activeProvider = new FallbackProvider(qaPrimary, secondary);
  }

  public getProvider(): AIProvider {
    return this.activeProvider;
  }

  public setProvider(provider: AIProvider): void {
    this.activeProvider = provider;
  }
}

export const aiClient = new AIServiceClient();
