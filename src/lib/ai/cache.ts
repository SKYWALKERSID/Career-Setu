import { CareerIntelligenceSchema } from './schemas';

export function isReusableCareerIntelligence(inputHash: string, currentInputHash: string, insight: unknown): boolean {
  return inputHash === currentInputHash && CareerIntelligenceSchema.safeParse(insight).success;
}

export function isReusableResumeAnalysis(record: {
  extracted_text?: string | null;
  parsed_json?: { analysis_source?: string; analysis_version?: string; analysis_context_hash?: string } | null;
  score?: number | null;
}, extractedText: string, analysisVersion: string, contextHash: string): boolean {
  const isAi = String(record.parsed_json?.analysis_source ?? 'ai') !== 'deterministic_fallback';
  return record.extracted_text === extractedText
    && isAi
    && record.parsed_json?.analysis_version === analysisVersion
    && record.parsed_json?.analysis_context_hash === contextHash
    && record.score !== null
    && record.score !== undefined;
}
