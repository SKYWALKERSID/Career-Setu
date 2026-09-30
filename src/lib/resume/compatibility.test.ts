import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDeterministicResume, extractResumeText, parseResumeSections, ResumeExtractionError } from './parser';

async function expectReadablePdf(path: string, label: string) {
  const bytes = readFileSync(path);
  const text = await extractResumeText(bytes, 'application/octet-stream');
  assert.ok(text.length > 0, `${label}: extracted text is empty`);
  assert.equal(text, await extractResumeText(bytes, 'application/pdf'), `${label}: extraction is not deterministic`);
  return text;
}

async function run() {
  const goldenPath = process.env.GOLDEN_RESUME_PATH;
  const alternatePath = process.env.FAILING_RESUME_PATH;
  const multiPagePath = process.env.PDF_COMPAT_TEXT_PATH;
  const scannedPath = process.env.PDF_COMPAT_SCANNED_PATH;

  if (!goldenPath || !alternatePath) {
    console.log('SKIP: set GOLDEN_RESUME_PATH and FAILING_RESUME_PATH to run PDF compatibility tests');
    return;
  }
  const golden = await expectReadablePdf(goldenPath, 'golden resume');
  const alternate = await expectReadablePdf(alternatePath, 'alternate resume');
  assert.ok(parseResumeSections(golden).education.length > 0, 'golden resume: education was not sectioned');
  assert.ok(parseResumeSections(alternate).allText.length > 0, 'alternate resume: sections received no text');

  if (multiPagePath) {
    const multiPage = await expectReadablePdf(multiPagePath, 'multi-page text PDF');
    assert.ok(multiPage.length > 1000, 'multi-page text PDF: not all readable text was recovered');
  }

  if (scannedPath) {
    await assert.rejects(
      () => extractResumeText(readFileSync(scannedPath), 'application/octet-stream'),
      (error: unknown) => error instanceof ResumeExtractionError && error.code === 'scanned_pdf',
    );
  }

  await assert.rejects(
    () => extractResumeText(Buffer.from('not a PDF'), 'application/pdf'),
    (error: unknown) => error instanceof ResumeExtractionError && error.code === 'invalid_pdf',
  );

  const sections = parseResumeSections('Alex Student\nEDUCATION\nB.Tech, Example University\nACADEMIC PROJECTS\nPortfolio app\nTECHNICAL COMPETENCIES\nJavaScript\nACCOMPLISHMENTS\nHackathon finalist');
  assert.equal(sections.education.length, 1, 'heading variants: education');
  assert.equal(sections.projects.length, 1, 'heading variants: projects');
  assert.equal(sections.skills.length, 1, 'heading variants: skills');
  assert.equal(sections.achievements.length, 1, 'heading variants: achievements');
  buildDeterministicResume(golden, [], [], 'Selected career');
  console.log('PASS: PDF signature/MIME tolerance, multi-page extraction, scanned/corrupt classification, and section variants');
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
