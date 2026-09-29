import { readFileSync } from 'node:fs';
import { buildDeterministicResume, extractResumeText, parseResumeSections } from './parser';
import { calculateResumeBreakdown, calculateResumeScore } from './scoring';

const fixturePath = process.env.GOLDEN_RESUME_PATH;
if (!fixturePath) {
  console.log('SKIP: set GOLDEN_RESUME_PATH to run the golden resume fixture');
} else {
  const text = extractResumeText(readFileSync(fixturePath), 'application/pdf');
  const sections = parseResumeSections(text);
  const skill = (id: string, name: string) => ({ id, name });
  const ai = skill('11111111-1111-4111-8111-111111111111', 'Machine Learning');
  const python = skill('22222222-2222-4222-8222-222222222222', 'Python');
  const sql = skill('33333333-3333-4333-8333-333333333333', 'Power BI');
  const aiResume = buildDeterministicResume(text, [ai, python, sql], [ai.id, python.id], 'AI/ML Specialist');
  const dataResume = buildDeterministicResume(text, [ai, python, sql], [sql.id], 'Data Analyst');
  const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };

  assert(sections.name?.toLowerCase() === 'siddhesh tiwari', 'candidate name was not recovered');
  assert(aiResume.contact.email === 'siddhesh.jabalpur49697@gmail.com', 'email was not recovered');
  assert(Boolean(aiResume.contact.phone?.replace(/\D/g, '').endsWith('7224860904')), 'phone was not recovered');
  assert(aiResume.location === 'Bhopal, MP, India', 'location was not recovered');
  assert(aiResume.contact.links.some((link) => link.includes('linkedin.com/in/siddhesh-tiwari')), 'LinkedIn link was not normalized');
  assert(Boolean(aiResume.summary?.includes('B.Tech Computer Science')), 'summary was not recovered');
  assert(aiResume.education.some((item) => item.includes('SAGE University Bhopal')), 'education was not recovered');
  assert(Boolean(aiResume.experience.some((item) => item.includes('AI/ML Intern'))), 'work experience was not recovered');
  assert(aiResume.projects.some((item) => item.includes('SignBridge')), 'projects were not recovered');
  assert(aiResume.skills.some((item) => item.includes('Python')), 'technical skills were not recovered');
  assert(aiResume.achievements.some((item) => item.includes('1st Prize')), 'achievements were not recovered');
  assert(aiResume.evidenced_skill_ids.includes(ai.id), 'AI/ML evidence was not mapped');
  assert(aiResume.not_evidenced_skill_ids.length === 0, 'AI/ML role incorrectly reports a missing evidenced skill');
  assert(dataResume.role_required_skill_ids[0] === sql.id && dataResume.not_evidenced_skill_ids.includes(sql.id), 'role switch did not change career-aware gap analysis');
  assert(calculateResumeScore(aiResume) >= 0 && calculateResumeScore(aiResume) <= 100, 'score is out of bounds');
  assert(calculateResumeBreakdown(aiResume).alignment !== calculateResumeBreakdown(dataResume).alignment, 'role switch did not change alignment');
  console.log('PASS: golden resume extraction, canonical evidence mapping, deterministic scoring, and role-switch checks');
}
