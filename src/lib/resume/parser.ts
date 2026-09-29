import { inflateSync } from 'node:zlib';
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

function decodeLiteral(value: string): string {
  return value.replace(/\\([()\\])/g, '$1').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
}

function literalStrings(value: string): string[] {
  const result: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '(') continue;
    let depth = 1;
    let escaped = false;
    let text = '';
    for (index += 1; index < value.length; index += 1) {
      const char = value[index];
      if (escaped) {
        text += `\\${char}`;
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '(') {
        depth += 1;
        text += char;
      } else if (char === ')') {
        depth -= 1;
        if (depth === 0) break;
        text += char;
      } else {
        text += char;
      }
    }
    if (text) result.push(decodeLiteral(text));
  }
  return result;
}

function pdfContentStreams(buffer: Buffer): string[] {
  const raw = buffer.toString('latin1');
  const streams: string[] = [];
  for (const match of raw.matchAll(/stream\r?\n|stream\r/g)) {
    const start = match.index + match[0].length;
    const end = raw.indexOf('endstream', start);
    if (end < 0) continue;
    try {
      streams.push(inflateSync(buffer.subarray(start, end)).toString('latin1'));
    } catch {
      // Uncompressed or unsupported streams are ignored; the text parser remains safe.
    }
  }
  return streams;
}

function extractPdfLines(buffer: Buffer): string[] {
  const lines: Array<{ page: number; x: number; y: number; text: string }> = [];
  pdfContentStreams(buffer).forEach((content, page) => {
    for (const block of content.matchAll(/BT([\s\S]*?)ET/g)) {
      const body = block[1];
      const tm = body.match(/1 0 0 1 ([\d.-]+) ([\d.-]+) Tm/);
      if (!tm) continue;
      let text = '';
      const tj = body.match(/\[([\s\S]*?)\]\s*TJ/);
      if (tj) text += literalStrings(tj[1]).join('');
      const tjSingle = body.match(/\(([^)]*)\)\s*Tj/);
      if (tjSingle) text += decodeLiteral(tjSingle[1]);
      text = text.replace(/\s+/g, ' ').trim();
      if (text) lines.push({ page, x: Number(tm[1]), y: Number(tm[2]), text });
    }
  });

  const grouped: Array<{ page: number; y: number; items: Array<{ x: number; text: string }> }> = [];
  for (const item of lines) {
    const line = grouped.find((candidate) => candidate.page === item.page && Math.abs(candidate.y - item.y) < 1);
    if (line) line.items.push({ x: item.x, text: item.text });
    else grouped.push({ page: item.page, y: item.y, items: [{ x: item.x, text: item.text }] });
  }
  return grouped
    .sort((a, b) => a.page - b.page || b.y - a.y)
    .map((line) => line.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export function extractResumeText(buffer: Buffer, type: string): string {
  if (type === 'text/plain') return buffer.toString('utf8').trim();
  if (type !== 'application/pdf') throw new Error('Unsupported format. Please upload a PDF or text resume.');
  const lines = extractPdfLines(buffer);
  if (lines.length < 3) throw new Error('No readable text was found in the uploaded resume.');
  return lines.join('\n');
}

function sectionBetween(lines: string[], start: RegExp, end: RegExp): string[] {
  const startIndex = lines.findIndex((line) => start.test(line));
  if (startIndex < 0) return [];
  const endIndex = lines.findIndex((line, index) => index > startIndex && end.test(line));
  return lines.slice(startIndex + 1, endIndex < 0 ? lines.length : endIndex);
}

export function parseResumeSections(text: string): ResumeTextSections {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/^[-•▪]\s*/, '').trim()).filter(Boolean);
  const summaryLines = sectionBetween(lines, /^PROFESSIONAL SUMMARY$/i, /^EDUCATION$/i);
  return {
    name: lines[0],
    contactLine: lines[1],
    location: lines[1]?.split('|').map((item) => item.trim()).find((item) => /\b(?:india|bhopal|remote|on-site|onsite)\b/i.test(item)),
    summary: summaryLines.join(' '),
    education: sectionBetween(lines, /^EDUCATION$/i, /^WORK EXPERIENCE$/i),
    experience: sectionBetween(lines, /^WORK EXPERIENCE$/i, /^PROJECTS$/i),
    projects: sectionBetween(lines, /^PROJECTS$/i, /^TECHNICAL SKILLS$/i),
    skills: sectionBetween(lines, /^TECHNICAL SKILLS$/i, /^ACHIEVEMENTS\s*&\s*EXTRACURRICULARS$/i),
    achievements: sectionBetween(lines, /^ACHIEVEMENTS\s*&\s*EXTRACURRICULARS$/i, /^$|$^/),
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
