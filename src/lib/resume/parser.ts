import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { ResumeParsedData } from './types';

export type ResumeTextSections = {
  name?: string;
  contactLine?: string;
  location?: string;
  summary: string;
  education: string[];
  experience: string[];
  projects: string[];
  skills: string[];
  achievements: string[];
  allText: string;
};

export type ResumeExtractionFailureCode = 'invalid_pdf' | 'encrypted_pdf' | 'scanned_pdf' | 'unreadable_pdf' | 'pdfjs_open_failed';

export class ResumeExtractionError extends Error {
  constructor(public readonly code: ResumeExtractionFailureCode, message: string) {
    super(message);
    this.name = 'ResumeExtractionError';
  }
}

function normalizePageText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\u0000/g, '')
    .replace(/([\p{L}\p{N}])-\s*\n(?=[\p{L}\p{N}])/gu, '$1')
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

export async function extractResumeText(buffer: Buffer, type: string): Promise<string> {
  const hasPdfSignature = buffer.subarray(0, 5).equals(Buffer.from('%PDF-'));
  if (!hasPdfSignature && type === 'text/plain') return buffer.toString('utf8').trim();
  if (!hasPdfSignature) throw new ResumeExtractionError('invalid_pdf', 'The uploaded file is not a valid PDF or plain-text resume.');

  let document: Awaited<ReturnType<typeof getDocument>>['promise'] extends Promise<infer T> ? T : never;
  try {
    document = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: true, verbosity: 0 }).promise;
  } catch (error: unknown) {
    const errorName = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
    const errorMsg = error instanceof Error ? error.message.replace(/[\r\n]+/g, ' ').slice(0, 120) : '';
    if (errorName === 'PasswordException') {
      throw new ResumeExtractionError('encrypted_pdf', 'This PDF is password-protected. Please upload an unencrypted PDF.');
    }
    if (errorName === 'InvalidPDFException' || errorName === 'MissingPDFException') {
      throw new ResumeExtractionError('invalid_pdf', 'This PDF could not be opened. Please upload a valid PDF.');
    }
    const detail = errorName ? ` [${errorName}${errorMsg ? ': ' + errorMsg : ''}]` : '';
    throw new ResumeExtractionError('pdfjs_open_failed', `This PDF could not be processed${detail}. Please try a different text-readable PDF.`);
  }

  const pages: string[] = [];
  let imageOnlyPages = 0;
  let unreadablePages = 0;
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    try {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let currentLine = '';
      const extractedLines: string[] = [];
      for (const item of content.items) {
        if ('str' in item) currentLine += item.str;
        if ('hasEOL' in item && item.hasEOL) {
          if (currentLine) extractedLines.push(currentLine);
          currentLine = '';
        }
      }
      if (currentLine) extractedLines.push(currentLine);
      const pageText = normalizePageText(extractedLines.join('\n'));
      if (pageText) {
        pages.push(pageText);
        continue;
      }
      const operators = await page.getOperatorList();
      const imageOperators = new Set([OPS.paintImageMaskXObject, OPS.paintImageXObject]);
      if (operators.fnArray.some((operator) => imageOperators.has(operator))) imageOnlyPages += 1;
    } catch {
      unreadablePages += 1;
    }
  }

  const extracted = pages.join('\n');
  if (!extracted) {
    if (imageOnlyPages > 0) throw new ResumeExtractionError('scanned_pdf', 'This PDF appears to contain scanned or image pages rather than selectable text. Please upload a text-readable PDF.');
    if (unreadablePages > 0) throw new ResumeExtractionError('unreadable_pdf', 'This PDF is valid but its text could not be extracted.');
    throw new ResumeExtractionError('unreadable_pdf', 'This PDF contains no readable text. Please upload a text-readable PDF.');
  }
  return extracted;
}

function sectionBetween(lines: string[], start: RegExp, end: RegExp): string[] {
  const startIndex = lines.findIndex((line) => start.test(line));
  if (startIndex < 0) return [];
  const endIndex = lines.findIndex((line, index) => index > startIndex && end.test(line));
  return lines.slice(startIndex + 1, endIndex < 0 ? lines.length : endIndex);
}

export function parseResumeSections(text: string): ResumeTextSections {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/^[-•▪]\s*/, '').trim()).filter(Boolean);
  const summaryHeading = /^(PROFESSIONAL SUMMARY|CAREER OBJECTIVE|OBJECTIVE|SUMMARY|PROFILE|ABOUT ME)$/i;
  const educationHeading = /^(EDUCATION|ACADEMIC BACKGROUND|ACADEMIC QUALIFICATIONS)$/i;
  const experienceHeading = /^(WORK EXPERIENCE|WORK HISTORY|EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|INTERNSHIPS?)$/i;
  const projectsHeading = /^(PROJECTS?|SELECTED PROJECTS|ACADEMIC PROJECTS|PERSONAL PROJECTS)$/i;
  const skillsHeading = /^(TECHNICAL SKILLS?|TECHNICAL COMPETENCIES|SKILLS|CORE SKILLS|CORE COMPETENCIES)$/i;
  const achievementsHeading = /^(ACHIEVEMENTS?|ACCOMPLISHMENTS?|ACHIEVEMENTS\s*&\s*EXTRACURRICULARS|EXTRACURRICULAR ACTIVITIES|EXTRACURRICULARS?|ACTIVITIES)$/i;
  const nextSectionHeading = /^(EDUCATION|ACADEMIC BACKGROUND|ACADEMIC QUALIFICATIONS|WORK EXPERIENCE|WORK HISTORY|EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|INTERNSHIPS?|PROJECTS?|SELECTED PROJECTS|ACADEMIC PROJECTS|PERSONAL PROJECTS|TECHNICAL SKILLS?|TECHNICAL COMPETENCIES|SKILLS|CORE SKILLS|CORE COMPETENCIES|ACHIEVEMENTS?|ACCOMPLISHMENTS?|EXTRACURRICULAR ACTIVITIES|EXTRACURRICULARS?|ACTIVITIES|CERTIFICATIONS?|LANGUAGES?)$/i;
  const summaryLines = sectionBetween(lines, summaryHeading, nextSectionHeading);
  return {
    name: lines[0],
    contactLine: lines[1],
    location: lines[1]?.split('|').map((item) => item.trim()).find((item) => /\b(?:india|bhopal|remote|on-site|onsite)\b/i.test(item)),
    summary: summaryLines.join(' '),
    education: sectionBetween(lines, educationHeading, new RegExp(`(?:${experienceHeading.source}|${projectsHeading.source}|${skillsHeading.source}|${achievementsHeading.source})`, 'i')),
    experience: sectionBetween(lines, experienceHeading, new RegExp(`(?:${projectsHeading.source}|${skillsHeading.source}|${achievementsHeading.source})`, 'i')),
    projects: sectionBetween(lines, projectsHeading, new RegExp(`(?:${skillsHeading.source}|${achievementsHeading.source})`, 'i')),
    skills: sectionBetween(lines, skillsHeading, new RegExp(`(?:${achievementsHeading.source}|CERTIFICATIONS?|LANGUAGES?)`, 'i')),
    achievements: sectionBetween(lines, achievementsHeading, /^(CERTIFICATIONS?|LANGUAGES?)$/i),
    allText: lines.join('\n'),
  };
}

function contactFrom(text: string): ResumeParsedData['contact'] {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim();
  const links = [...text.matchAll(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+(?:\s*-\s*[A-Za-z0-9_-]+)*/gi)]
    .map((match) => `https://${match[0].replace(/^https?:\/\//i, '').replace(/\s*-\s*/g, '-')}`.replace(/[.,;]+$/, ''));
  return { email, phone, links: [...new Set(links)].slice(0, 10) };
}

export function buildDeterministicResume(
  text: string,
  skills: Array<{ id: string; name: string; aliases?: string[] | null }>,
  roleRequiredSkillIds: string[],
  roleTitle: string,
): ResumeParsedData {
  const sections = parseResumeSections(text);
  const lowerText = sections.allText.toLowerCase();
  const evidenced = skills.filter((skill) => [skill.name, ...(skill.aliases || [])].some((name) => name && name.length > 2 && lowerText.includes(name.toLowerCase())));
  const required = skills.filter((skill) => roleRequiredSkillIds.includes(skill.id));
  const missing = required.filter((skill) => !evidenced.some((item) => item.id === skill.id));
  const contact = contactFrom(sections.contactLine || sections.allText);
  const missingNames = missing.slice(0, 6).map((skill) => skill.name);

  return {
    analysis_source: 'deterministic_fallback',
    name: sections.name,
    contact,
    location: sections.location,
    summary: sections.summary,
    education: sections.education,
    skills: sections.skills.length ? sections.skills : evidenced.map((skill) => skill.name),
    projects: sections.projects,
    experience: sections.experience,
    certifications: [],
    achievements: sections.achievements,
    extracurriculars: sections.achievements,
    evidenced_skill_ids: evidenced.map((skill) => skill.id),
    role_required_skill_ids: roleRequiredSkillIds,
    not_evidenced_skill_ids: missing.map((skill) => skill.id),
    strengths: [
      sections.summary ? 'A professional summary is present and can be evaluated against the selected role.' : 'No professional summary was extracted.',
      sections.projects.length ? `${sections.projects.length} project evidence item${sections.projects.length === 1 ? '' : 's'} were extracted from the source resume.` : 'No project evidence was extracted.',
      evidenced.length ? `The resume explicitly evidences ${evidenced.slice(0, 6).map((skill) => skill.name).join(', ')}.` : 'No catalog skills were explicitly evidenced in the extracted text.',
    ],
    improvement_areas: [
      ...(missingNames.length ? [`For ${roleTitle}, the resume does not explicitly evidence: ${missingNames.join(', ')}.`] : []),
      ...(!sections.experience.length ? ['No work-experience evidence was extracted.'] : []),
      ...(!sections.achievements.length ? ['No achievement or extracurricular evidence was extracted.'] : []),
    ].slice(0, 10),
    suggestions: [
      ...(missingNames.length ? [`Add factual evidence for ${missingNames.slice(0, 3).join(', ')} if you have it for the ${roleTitle} path.`] : []),
      ...(sections.projects.length ? ['Strengthen project bullets with real outcomes or measurements where the source evidence supports them.'] : ['Add a project with a clear problem, contribution, and evidence of the result.']),
      ...(sections.experience.length ? ['Make the strongest role-relevant contributions easy to find in the experience bullets.'] : []),
    ].slice(0, 15),
  };
}
