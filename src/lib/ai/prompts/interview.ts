export const INTERVIEW_QUESTION_PROMPT_VERSION = 'v1.0-interview-question';
export const INTERVIEW_EVALUATION_PROMPT_VERSION = 'v1.0-interview-evaluation';
export const INTERVIEW_REPORT_PROMPT_VERSION = 'v1.0-interview-report';
export const INTERVIEW_QUESTION_PROMPT = `Return JSON only. Generate one concise mock interview question using only the supplied career role and skill catalog. Do not invent student facts, skills, or qualifications. Use the difficulty and previous turns. Do not reveal the answer.\nCONTEXT:\n{{context}}`;
export const INTERVIEW_EVALUATION_PROMPT = `Return JSON only. Evaluate only the student's supplied answer against the supplied question, role, difficulty, and catalog context. Do not invent facts or penalize missing information as incompetence. Give concise actionable feedback.\nCONTEXT:\n{{context}}`;
export const INTERVIEW_REPORT_PROMPT = `Return JSON only. Summarize the persisted interview evaluations. Do not invent student facts or qualifications. Keep the report concise and actionable.\nCONTEXT:\n{{context}}`;
