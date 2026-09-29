export type AcademicOption = {
  id: string;
  name: string;
  shortName?: string;
  aliases?: string[];
  source: 'UGC' | 'AICTE' | 'institutional';
  sourceVersion: string;
};

export type AcademicBranch = AcademicOption & {
  degreeIds: string[];
};

export type AcademicSpecialization = AcademicOption & {
  branchIds: string[];
};

export const ACADEMIC_TAXONOMY_VERSION = '2025-UGC-2024-27-AICTE';

export const ACADEMIC_DEGREES: AcademicOption[] = [
  { id: 'btech', name: 'Bachelor of Technology', shortName: 'B.Tech', aliases: ['btech', 'b.tech'], source: 'UGC', sourceVersion: '2025' },
  { id: 'be', name: 'Bachelor of Engineering', shortName: 'B.E.', aliases: ['be', 'b.e.', 'b eng'], source: 'UGC', sourceVersion: '2025' },
  { id: 'bsc', name: 'Bachelor of Science', shortName: 'B.Sc.', aliases: ['bsc', 'b.sc.'], source: 'UGC', sourceVersion: '2025' },
  { id: 'bca', name: 'Bachelor of Computer Applications', shortName: 'BCA', aliases: ['bca'], source: 'UGC', sourceVersion: '2025' },
  { id: 'bcom', name: 'Bachelor of Commerce', shortName: 'B.Com.', aliases: ['bcom', 'b.com.'], source: 'UGC', sourceVersion: '2025' },
  { id: 'ba', name: 'Bachelor of Arts', shortName: 'B.A.', aliases: ['ba', 'b.a.'], source: 'UGC', sourceVersion: '2025' },
  { id: 'bba', name: 'Bachelor of Business Administration', shortName: 'BBA', aliases: ['bba'], source: 'UGC', sourceVersion: '2025' },
  { id: 'bdes', name: 'Bachelor of Design', shortName: 'B.Des.', aliases: ['bdes', 'b.des.'], source: 'UGC', sourceVersion: '2025' },
  { id: 'barch', name: 'Bachelor of Architecture', shortName: 'B.Arch.', aliases: ['barch', 'b.arch.'], source: 'UGC', sourceVersion: '2025' },
  { id: 'bed', name: 'Bachelor of Education', shortName: 'B.Ed.', aliases: ['bed', 'b.ed.'], source: 'UGC', sourceVersion: '2025' },
  { id: 'bpharm', name: 'Bachelor of Pharmacy', shortName: 'B.Pharm.', aliases: ['bpharm', 'b.pharm.'], source: 'UGC', sourceVersion: '2025' },
  { id: 'bpt', name: 'Bachelor of Physiotherapy', shortName: 'B.P.T.', aliases: ['bpt', 'b.p.t.'], source: 'UGC', sourceVersion: '2025' },
  { id: 'bnursing', name: 'Bachelor of Science in Nursing', shortName: 'B.Sc. Nursing', aliases: ['bsc nursing', 'b.sc nursing'], source: 'institutional', sourceVersion: '2025' },
  { id: 'bmmc', name: 'Bachelor of Journalism and Mass Communication', shortName: 'BJMC', aliases: ['bjmc', 'mass communication'], source: 'UGC', sourceVersion: '2025' },
  { id: 'bsc-agriculture', name: 'Bachelor of Science in Agriculture', shortName: 'B.Sc. Agriculture', aliases: ['bsc agriculture', 'agriculture'], source: 'institutional', sourceVersion: '2025' },
  { id: 'llb', name: 'Bachelor of Laws', shortName: 'LL.B.', aliases: ['llb', 'll.b.'], source: 'UGC', sourceVersion: '2025' },
  { id: 'mca', name: 'Master of Computer Applications', shortName: 'MCA', aliases: ['mca'], source: 'UGC', sourceVersion: '2025' },
  { id: 'diploma-engineering', name: 'Diploma in Engineering and Technology', shortName: 'Diploma', aliases: ['diploma', 'polytechnic'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'other', name: 'Other / Not listed', source: 'institutional', sourceVersion: '2025' },
];

const ENGINEERING = ['btech', 'be'];
const SCIENCE = ['bsc'];
const COMMERCE = ['bcom'];
const ARTS = ['ba'];
const BUSINESS = ['bba'];
const DESIGN = ['bdes'];
const COMPUTING = ['bca', 'mca', 'diploma-engineering'];

export const ACADEMIC_BRANCHES: AcademicBranch[] = [
  ...[
    ['computer-science-engineering', 'Computer Science and Engineering', ['cse', 'computer science', 'computer sci', 'computer science & engineering']],
    ['computer-engineering', 'Computer Engineering', ['computer eng']],
    ['information-technology', 'Information Technology', ['it', 'information tech']],
    ['electronics-communication-engineering', 'Electronics and Communication Engineering', ['ece', 'electronics communication']],
    ['electrical-engineering', 'Electrical Engineering', ['eee', 'electrical']],
    ['mechanical-engineering', 'Mechanical Engineering', ['mechanical']],
    ['civil-engineering', 'Civil Engineering', ['civil']],
    ['chemical-engineering', 'Chemical Engineering', ['chemical']],
    ['aerospace-engineering', 'Aerospace Engineering', ['aerospace']],
    ['aeronautical-engineering', 'Aeronautical Engineering', ['aeronautical']],
    ['automobile-engineering', 'Automobile Engineering', ['automobile', 'automotive']],
    ['agricultural-engineering', 'Agricultural Engineering', ['agriculture engineering']],
    ['biotechnology', 'Biotechnology', ['biotech']],
    ['biomedical-engineering', 'Biomedical Engineering', ['biomedical']],
    ['instrumentation-control-engineering', 'Instrumentation and Control Engineering', ['instrumentation', 'control']],
    ['production-engineering', 'Production Engineering', ['production']],
    ['industrial-engineering', 'Industrial Engineering', ['industrial']],
    ['mechatronics-engineering', 'Mechatronics Engineering', ['mechatronics']],
    ['mining-engineering', 'Mining Engineering', ['mining']],
    ['metallurgical-materials-engineering', 'Metallurgical and Materials Engineering', ['metallurgy', 'materials']],
    ['food-technology', 'Food Technology', ['food tech']],
    ['textile-technology', 'Textile Technology', ['textile']],
    ['environmental-engineering', 'Environmental Engineering', ['environment']],
    ['petroleum-engineering', 'Petroleum Engineering', ['petroleum']],
    ['robotics-engineering', 'Robotics Engineering', ['robotics']],
  ].map(([id, name, aliases]) => ({ id: id as string, name: name as string, aliases: aliases as string[], degreeIds: ENGINEERING, source: 'AICTE' as const, sourceVersion: '2024-2027' })),
  ...[
    ['physics', 'Physics'], ['chemistry', 'Chemistry'], ['mathematics', 'Mathematics'], ['computer-science', 'Computer Science', ['computer science / it', 'cs']], ['statistics', 'Statistics'], ['biotechnology-science', 'Biotechnology'], ['microbiology', 'Microbiology'], ['zoology', 'Zoology'], ['botany', 'Botany'], ['geography-science', 'Geography'], ['environmental-science', 'Environmental Science'],
  ].map(([id, name, aliases]) => ({ id: id as string, name: name as string, aliases: aliases as string[] | undefined, degreeIds: SCIENCE, source: 'institutional' as const, sourceVersion: '2025' })),
  ...[
    ['commerce', 'Commerce'], ['accounting', 'Accounting'], ['finance-commerce', 'Finance'], ['business-economics', 'Business Economics'],
  ].map(([id, name]) => ({ id: id as string, name: name as string, degreeIds: COMMERCE, source: 'institutional' as const, sourceVersion: '2025' })),
  ...[
    ['english', 'English'], ['economics', 'Economics'], ['psychology', 'Psychology'], ['sociology', 'Sociology'], ['political-science', 'Political Science'], ['history', 'History'], ['geography-arts', 'Geography'],
  ].map(([id, name]) => ({ id: id as string, name: name as string, degreeIds: ARTS, source: 'institutional' as const, sourceVersion: '2025' })),
  ...[
    ['finance', 'Finance'], ['marketing', 'Marketing'], ['human-resource-management', 'Human Resource Management'], ['business-analytics', 'Business Analytics'], ['operations-management', 'Operations Management'],
  ].map(([id, name]) => ({ id: id as string, name: name as string, degreeIds: BUSINESS, source: 'institutional' as const, sourceVersion: '2025' })),
  ...[
    ['communication-design', 'Communication Design'], ['product-design', 'Product Design'], ['user-experience-design', 'User Experience Design'],
  ].map(([id, name]) => ({ id: id as string, name: name as string, degreeIds: DESIGN, source: 'institutional' as const, sourceVersion: '2025' })),
  { id: 'computer-applications', name: 'Computer Applications', aliases: ['computer applications', 'computer application'], degreeIds: COMPUTING, source: 'institutional', sourceVersion: '2025' },
  { id: 'information-systems', name: 'Information Systems', aliases: ['information system'], degreeIds: COMPUTING, source: 'institutional', sourceVersion: '2025' },
  { id: 'other', name: 'Other / Not listed', degreeIds: ACADEMIC_DEGREES.map((degree) => degree.id), source: 'institutional', sourceVersion: '2025' },
];

export const ACADEMIC_SPECIALIZATIONS: AcademicSpecialization[] = [
  { id: 'ai-data-science', name: 'Artificial Intelligence (AI) and Data Science', branchIds: ['computer-science-engineering', 'computer-engineering'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'ai-machine-learning', name: 'Artificial Intelligence and Machine Learning', aliases: ['ai/ml', 'ai & ml'], branchIds: ['computer-science-engineering', 'computer-engineering'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'computer-communication-engineering', name: 'Computer and Communication Engineering', branchIds: ['computer-science-engineering', 'computer-engineering'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'computer-science-applied-mathematics', name: 'Computer Science and Applied Mathematics', branchIds: ['computer-science-engineering', 'computer-engineering'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'software-engineering', name: 'Software Engineering', branchIds: ['computer-science-engineering', 'computer-engineering', 'information-technology'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'computer-science-ai', name: 'Computer Science and Engineering (Artificial Intelligence)', branchIds: ['computer-science-engineering'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'computer-science-aiml', name: 'Computer Science and Engineering (Artificial Intelligence and Machine Learning)', branchIds: ['computer-science-engineering'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'computer-science-cyber-security', name: 'Computer Science and Engineering (Cyber Security)', branchIds: ['computer-science-engineering'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'computer-science-data-science', name: 'Computer Science and Engineering (Data Science)', branchIds: ['computer-science-engineering'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'computer-science-iot', name: 'Computer Science and Engineering (Internet of Things)', branchIds: ['computer-science-engineering'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'computer-networks', name: 'Computer Networking', branchIds: ['computer-science-engineering', 'computer-engineering', 'information-technology'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'data-science', name: 'Data Science', branchIds: ['computer-science-engineering', 'computer-engineering', 'information-technology', 'computer-science'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'embedded-systems', name: 'Embedded Systems', branchIds: ['electronics-communication-engineering', 'electrical-engineering'], source: 'institutional', sourceVersion: '2025' },
  { id: 'vlsi-design', name: 'VLSI Design', branchIds: ['electronics-communication-engineering', 'electrical-engineering'], source: 'institutional', sourceVersion: '2025' },
  { id: 'renewable-energy', name: 'Renewable Energy Engineering', branchIds: ['electrical-engineering', 'mechanical-engineering'], source: 'institutional', sourceVersion: '2025' },
  { id: 'automotive-engineering', name: 'Automotive Engineering', branchIds: ['mechanical-engineering', 'automobile-engineering'], source: 'AICTE', sourceVersion: '2024-2027' },
  { id: 'structural-engineering', name: 'Structural Engineering', branchIds: ['civil-engineering'], source: 'institutional', sourceVersion: '2025' },
  { id: 'no-specialization', name: 'No specific specialization', branchIds: ACADEMIC_BRANCHES.map((branch) => branch.id), source: 'institutional', sourceVersion: '2025' },
  { id: 'other', name: 'Other / Not listed', branchIds: ACADEMIC_BRANCHES.map((branch) => branch.id), source: 'institutional', sourceVersion: '2025' },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function findDegree(value?: string | null) {
  if (!value) return undefined;
  const needle = normalize(value);
  return ACADEMIC_DEGREES.find((item) => item.id === value || normalize(item.name) === needle || normalize(item.shortName || '') === needle || item.aliases?.some((alias) => normalize(alias) === needle));
}

export function findBranch(value?: string | null, degreeId?: string) {
  if (!value) return undefined;
  const needle = normalize(value);
  return ACADEMIC_BRANCHES.find((item) => (item.id === value || normalize(item.name) === needle || item.aliases?.some((alias) => normalize(alias) === needle)) && (!degreeId || item.degreeIds.includes(degreeId)));
}

export function findSpecialization(value?: string | null, branchId?: string) {
  if (!value) return undefined;
  const needle = normalize(value);
  return ACADEMIC_SPECIALIZATIONS.find((item) => (item.id === value || normalize(item.name) === needle || item.aliases?.some((alias) => normalize(alias) === needle)) && (!branchId || item.branchIds.includes(branchId)));
}

export function branchesForDegree(degreeId?: string) {
  return ACADEMIC_BRANCHES.filter((item) => item.degreeIds.includes(degreeId || ''));
}

export function specializationsForBranch(branchId?: string) {
  return ACADEMIC_SPECIALIZATIONS.filter((item) => item.branchIds.includes(branchId || ''));
}

export function labelForDegree(id?: string | null, fallback?: string | null) {
  return ACADEMIC_DEGREES.find((item) => item.id === id)?.shortName || fallback || '';
}

export function labelForBranch(id?: string | null, fallback?: string | null) {
  return ACADEMIC_BRANCHES.find((item) => item.id === id)?.name || fallback || '';
}

export function labelForSpecialization(id?: string | null, fallback?: string | null) {
  return ACADEMIC_SPECIALIZATIONS.find((item) => item.id === id)?.name || fallback || '';
}
