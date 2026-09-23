import { AIProvider } from './types';
import { GeminiProvider } from './providers/gemini';

class AIServiceClient {
  private activeProvider: AIProvider;

  constructor() {
    const providerName = process.env.AI_PROVIDER || 'gemini';

    switch (providerName.toLowerCase()) {
      case 'gemini':
        this.activeProvider = new GeminiProvider();
        break;
      case 'unsupported_test':
        // Test class for unsupported provider validation
        this.activeProvider = {
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
        this.activeProvider = new GeminiProvider();
        break;
    }
  }

  public getProvider(): AIProvider {
    return this.activeProvider;
  }

  public setProvider(provider: AIProvider): void {
    this.activeProvider = provider;
  }
}

export const aiClient = new AIServiceClient();
