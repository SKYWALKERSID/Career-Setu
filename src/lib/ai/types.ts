import { z } from 'zod';

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
