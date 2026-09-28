import { z } from 'zod';

export type AIErrorCategory =
  | 'AI_CONFIG_ERROR'
  | 'AI_RATE_LIMIT_ERROR'
  | 'AI_CAPACITY_ERROR'
  | 'AI_AUTH_ERROR'
  | 'AI_PROVIDER_ERROR'
  | 'AI_PARSE_ERROR'
  | 'AI_SCHEMA_ERROR'
  | 'AI_EMPTY_RESPONSE'
  | 'AI_NETWORK_ERROR'
  | 'AI_TIMEOUT_ERROR'
  | 'AI_UNKNOWN_ERROR';

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCategory?: AIErrorCategory;
  provider: string;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
}

export interface AIProvider {
  name: string;
  modelName: string;
  generateStructuredOutput<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemInstruction?: string
  ): Promise<AIResponse<T>>;

  generateText(
    prompt: string,
    systemInstruction?: string
  ): Promise<AIResponse<string>>;
}
