'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Info, Search, Plus, X } from 'lucide-react';
import { getStudentProfile, getCatalogItems, saveStudentProfile } from '@/lib/profile/actions';
import { calculateProfileCompletion } from '@/lib/profile/validation';
import { OnboardingCompletionVisual } from '@/components/onboarding/onboarding-completion-visual';
import { AcademicCombobox } from '@/components/academic/academic-combobox';
import {
  ACADEMIC_DEGREES,
  branchesForDegree,
  findBranch,
  findDegree,
  findSpecialization,
  labelForBranch,
  labelForDegree,
  labelForSpecialization,
  specializationsForBranch,
} from '@/lib/academic/taxonomy';

const AVAILABLE_DOMAIN_INTERESTS = [
  'Software Development',
  'Data Science & Analytics',
  'Cloud Computing & DevOps',
  'Cybersecurity & Defense',
  'UI/UX & Product Design',
  'Artificial Intelligence & Machine Learning',
  'Hardware & Embedded Systems',
  'Government & Public Sector Careers',
  'Business & Entrepreneurship',
];

function formatSemester(value: number) {
  if (!value || value < 1) return 'Not selected';
  const suffix =
    value % 100 >= 11 && value % 100 <= 13
      ? 'th'
      : (({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[value % 10] || 'th');
  return `${value}${suffix}`;
}

function getMaxSemestersForDegree(degreeId: string): number {
  if (!degreeId) return 10;
  if (['mca', 'bed'].includes(degreeId)) return 4;
  if (['bca', 'bsc', 'bcom', 'ba', 'bba', 'bmmc', 'llb', 'diploma-engineering'].includes(degreeId)) return 6;
  if (['btech', 'be', 'bdes', 'bpharm', 'bpt', 'bnursing', 'bsc-agriculture'].includes(degreeId)) return 8;
  return 10;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Catalog Data from DB
  const [skillsCatalog, setSkillsCatalog] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [careerRolesCatalog, setCareerRolesCatalog] = useState<Array<{ id: string; title: string; category: string }>>([]);

  // Search/Filter States
  const [skillSearch, setSkillSearch] = useState('');
  const [careerSearch, setCareerSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    college: '',
    course: '',
    branch: '',
    specialization: '',
    degreeId: '',
    branchId: '',
    specializationId: '',
    degreeOther: '',
    branchOther: '',
    specializationOther: '',
    semester: 0,
    cgpa: '',
    interests: [] as string[],
    selectedCareerTitles: [] as string[],
    selectedSkillIds: [] as string[],
  });

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setErrorMsg('');

      try {
        const [catalogRes, profileRes] = await Promise.all([getCatalogItems(), getStudentProfile()]);

        setSkillsCatalog(catalogRes.skills);
        setCareerRolesCatalog(catalogRes.careerRoles);

        if (profileRes.success && profileRes.studentProfile) {
          const sp = profileRes.studentProfile;
          const userSkills = (profileRes.studentSkills || []).map((sk) => sk.skill_id);
          const resolvedDegreeId = sp.degree_id || findDegree(sp.course)?.id || '';
          const resolvedBranchId = sp.branch_id || findBranch(sp.branch, resolvedDegreeId)?.id || '';

          setFormData({
            name: sp.name || '',
            location: sp.location || '',
            college: sp.college || '',
            course: sp.course || '',
            branch: sp.branch || '',
            specialization: sp.specialization_id ? labelForSpecialization(sp.specialization_id, sp.specialization_other) : '',
            degreeId: resolvedDegreeId,
            branchId: resolvedBranchId,
            specializationId: sp.specialization_id || findSpecialization(sp.specialization_other, resolvedBranchId)?.id || '',
            degreeOther: sp.degree_other || '',
            branchOther: sp.branch_other || '',
            specializationOther: sp.specialization_other || '',
            semester: sp.semester && sp.semester >= 1 ? Number(sp.semester) : 0,
            cgpa: sp.cgpa !== null && sp.cgpa !== undefined ? String(sp.cgpa) : '',
            interests: sp.interests || [],
            selectedCareerTitles: (sp.target_careers || []).map(
              (value: string) => catalogRes.careerRoles.find((role) => role.id === value)?.title || value
            ),
            selectedSkillIds: userSkills,
          });
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load initial onboarding data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

        const maxSemesters = getMaxSemestersForDegree(formData.degreeId);
        const semesterOptions = Array.from({ length: maxSemesters }, (_, i) => i + 1);

        const validateStep1 = (): boolean => {
          const errors: Record<string, string> = {};

          if (!formData.name.trim()) {
            errors.name = 'Full name is required.';
          } else if (formData.name.trim().length < 2) {
            errors.name = 'Full name must be at least 2 characters.';
          }

          if (!formData.college.trim()) {
            errors.college = 'College or university name is required.';
          } else if (formData.college.trim().length < 2) {
            errors.college = 'College name must be at least 2 characters.';
          }

          if (!formData.degreeId) {
            errors.degreeId = 'Please select your degree course from the list.';
          } else if (formData.degreeId === 'other' && !formData.degreeOther.trim()) {
            errors.degreeOther = 'Please specify your degree course name.';
          }

          if (!formData.branchId) {
            errors.branchId = formData.degreeId
              ? 'Please select your branch or discipline.'
              : 'Select a degree course first, then choose your branch.';
          } else if (formData.branchId === 'other' && !formData.branchOther.trim()) {
            errors.branchOther = 'Please specify your branch or discipline name.';
          }

          if (formData.specializationId === 'other' && !formData.specializationOther.trim()) {
            errors.specializationOther = 'Please specify your specialization name or choose "No specific specialization".';
          }

          if (!formData.semester || formData.semester < 1 || formData.semester > maxSemesters) {
            errors.semester = `Please select your current semester (1st to ${formatSemester(maxSemesters)}).`;
          }

          if (formData.cgpa.trim()) {
            const cgpa = Number(formData.cgpa);
            if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
              errors.cgpa = 'Aggregate CGPA must be between 0.00 and 10.00 (leave blank if not yet available).';
            }
            if (!formData.college.trim()) {
              setErrorMsg('Please enter your college name');
              return;
            }
            if (!formData.location.trim()) {
              setErrorMsg('Please select a preferred district or location');
              return;
            }
            if (!formData.degreeId || (formData.degreeId === 'other' && !formData.degreeOther.trim())) {
              setErrorMsg('Please select a valid degree.');
              return;
            }
            if (!formData.branchId || (formData.branchId === 'other' && !formData.branchOther.trim())) {
              setErrorMsg('Please select a branch for this degree.');
              return;
            }
            if (formData.cgpa.trim()) {
              const cgpa = Number(formData.cgpa);
              if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
                setErrorMsg('CGPA must be between 0 and 10.');
                return;
              }
            }
          } else if (step === 3) {
            if (formData.selectedCareerTitles.length === 0) {
              setErrorMsg('Please select at least one target career role');
              return;
            }
            if (formData.interests.length === 0) {
              setErrorMsg('Please select at least one domain interest');
              return;
            }
          }

          if (!formData.location.trim()) {
            errors.location = 'Please select your preferred MP district or location.';
          }

          setFieldErrors(errors);
          const messages = Object.values(errors);
          if (messages.length > 0) {
            setErrorMsg(
              messages.length === 1
                ? messages[0]
                : `Please fix ${messages.length} highlighted fields before continuing: ${messages.join(' ')}`
            );
            return false;
          }

          setErrorMsg('');
          return true;
        };

        const validateStep3 = (): boolean => {
          const errors: Record<string, string> = {};

          if (formData.interests.length === 0) {
            errors.interests = 'Select at least 1 domain interest so we can tailor your learning path.';
          }

          if (formData.selectedCareerTitles.length === 0) {
            errors.targetCareers = 'Select at least 1 target career role from the catalog.';
          }

          setFieldErrors(errors);
          const messages = Object.values(errors);
          if (messages.length > 0) {
            setErrorMsg(messages.join(' '));
            return false;
          }

          setErrorMsg('');
          return true;
        };

        const nextStep = () => {
          if (step === 1 && !validateStep1()) return;
          if (step === 3 && !validateStep3()) return;
          setErrorMsg('');
          setFieldErrors({});
          setStep((s) => Math.min(s + 1, 4));
        };

        const prevStep = () => {
          setErrorMsg('');
          setFieldErrors({});
          setStep((s) => Math.max(s - 1, 1));
        };

        const handleFinish = async () => {
          if (saving) return;
          if (!validateStep1()) {
            setStep(1);
            return;
          }
          if (!validateStep3()) {
            setStep(3);
            return;
          }

          setSaving(true);
          setErrorMsg('');

          try {
            const res = await saveStudentProfile({
              name: formData.name,
              location: formData.location,
              college: formData.college,
              name: formData.name.trim(),
              location: formData.location.trim(),
              college: formData.college.trim(),
              course: formData.course,
              branch: formData.branch,
              degree_id: formData.degreeId,
              branch_id: formData.branchId,
              specialization_id: formData.specializationId || null,
              degree_other: formData.degreeOther || null,
              branch_other: formData.branchOther || null,
              specialization_other: formData.specializationOther || null,
              degree_other: formData.degreeOther?.trim() || null,
              branch_other: formData.branchOther?.trim() || null,
              specialization_other: formData.specializationOther?.trim() || null,
              semester: Number(formData.semester),
              cgpa: formData.cgpa.trim() ? Number(formData.cgpa) : null,
              interests: formData.interests,
              target_careers: formData.selectedCareerTitles,
              skill_ids: formData.selectedSkillIds,
            });

            if (!res.success) {
              throw new Error(res.error || 'Failed to save profile');
              throw new Error(res.error || 'Failed to save your student profile. Please review your entries and try again.');
            }

            setCompleted(true);
          } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Save failed. Please try again.');
            setErrorMsg(err instanceof Error ? err.message : 'Save failed. Please check your connection and try again.');
          } finally {
            setSaving(false);
          }
        };

        if (loading) {
          return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
              <LoadingState label="Loading catalog & student profile..." />
              <LoadingState label="Loading academic catalog & your student profile..." />
            </div>
          );
        }

        if (completed) {
          return (
            <main className="grid min-h-screen bg-white lg:grid-cols-[0.9fr_1.1fr]">
              <section className="flex flex-col justify-center px-8 py-12 sm:px-16 lg:px-20">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2f7d3d] text-[10px] font-bold text-white">
                    MP
                  </span>
                  <span>
                    <strong className="block text-[15px] text-[#10295d]">MP CareerSetu</strong>
                  </span>
                </div>
                <div className="mt-12 max-w-[440px]">
                  <div className="mb-7 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <span key={item} className="h-1.5 flex-1 rounded-full bg-[#1559c7]" />
                    ))}
                    <span className="ml-3 text-xs font-medium text-[#536987]">Step 5 of 5</span>
                  </div>
                  <h1 className="text-4xl font-extrabold text-[#10295d]">You&apos;re All Set!</h1>
                  <p className="mt-3 text-base leading-6 text-[#536987]">
                    Let&apos;s build a brighter future together. Start exploring, learning and unlocking new opportunities.
                  </p>
                  <div className="mt-8 space-y-4">
                    {[
                      'Profile ready',
                      'Personalized recommendations',
                      'Access to courses & opportunities',
                      'Tools for career growth',
                      'Be a part of a stronger Madhya Pradesh',
                    ].map((item) => (
                      <p key={item} className="flex items-center gap-3 text-sm text-[#536987]">
                        <CheckCircle className="h-5 w-5 shrink-0 fill-[#3f9b54] text-white" />
                        {item}
                      </p>
                    ))}
                  </div>
                  <Button
                    variant="govt"
                    size="lg"
                    className="mt-9 w-[215px]"
                    className="mt-9 w-[230px]"
                    isLoading={redirecting}
                    disabled={redirecting}
                    onClick={() => {
                      setRedirecting(true);
                      router.replace('/dashboard');
                      router.refresh();
                    }}
                  >
                    Go to Dashboard <ArrowRight className="h-4 w-4 ml-1" />
                    {redirecting ? (
                      'Opening Dashboard...'
                    ) : (
                      <>
                        Go to Dashboard <ArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </section>
              <OnboardingCompletionVisual />
            </main>
          );
        }

        const filteredSkills = skillsCatalog.filter((sk) =>
          sk.name.toLowerCase().includes(skillSearch.toLowerCase()) || sk.category.toLowerCase().includes(skillSearch.toLowerCase())
  const filteredSkills = skillsCatalog.filter(
            (sk) =>
              sk.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
              sk.category.toLowerCase().includes(skillSearch.toLowerCase())
          );

        const filteredRoles = careerRolesCatalog.filter((cr) =>
          cr.title.toLowerCase().includes(careerSearch.toLowerCase()) || cr.category.toLowerCase().includes(careerSearch.toLowerCase())
  const filteredRoles = careerRolesCatalog.filter(
            (cr) =>
              cr.title.toLowerCase().includes(careerSearch.toLowerCase()) ||
              cr.category.toLowerCase().includes(careerSearch.toLowerCase())
          );

        const selectedDegree = findDegree(formData.degreeId);
        const selectedBranch = findBranch(formData.branchId, formData.degreeId);
        const branchOptions = branchesForDegree(formData.degreeId);
        const specializationOptions = specializationsForBranch(formData.branchId);

        const completionScore = calculateProfileCompletion({
          name: formData.name,
          location: formData.location,
          college: formData.college,
          course: formData.course,
          branch: formData.branch,
          semester: formData.semester,
          cgpa: parseFloat(formData.cgpa || '0'),
          skillsCount: formData.selectedSkillIds.length,
          targetCareersCount: formData.selectedCareerTitles.length,
          interestsCount: formData.interests.length,
        });

        // Live checklist of missing items on Step 1
        const step1Missing: string[] = [];
        if (!formData.name.trim()) step1Missing.push('Full Name');
        if (!formData.college.trim()) step1Missing.push('College / University');
        if (!formData.degreeId || (formData.degreeId === 'other' && !formData.degreeOther.trim())) step1Missing.push('Degree Course');
        if (!formData.branchId || (formData.branchId === 'other' && !formData.branchOther.trim())) step1Missing.push('Branch / Discipline');
        if (!formData.semester || formData.semester < 1 || formData.semester > maxSemesters) step1Missing.push('Current Semester');
        if (!formData.location.trim()) step1Missing.push('Preferred MP District / Location');

        const step3Missing: string[] = [];
        if (formData.interests.length === 0) step3Missing.push('At least 1 Domain Interest');
        if (formData.selectedCareerTitles.length === 0) step3Missing.push('At least 1 Target Career Role');

        return (
          <div className="min-h-screen bg-[#f7faff] flex flex-col items-center p-5 sm:p-8">
            <div className="w-full max-w-[920px] space-y-6">
              {/* Top Header */}
              <div className="flex justify-between items-center border-b border-[#dce7f2] pb-4">
                <div className="flex justify-between items-center border-b border-[#dce7f2] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#2f7d3d] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      MP
                    </div>
                    <div>
                      <span className="font-bold text-[#10295d] text-base block leading-none">MP CareerSetu</span>
                      <span className="text-[10px] text-slate-500 font-medium">Government Employability Readiness Portal</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#536987] block">Step {step} of 4</span>
                    <span className="text-[10px] font-bold text-[#1559c7]">Profile completion: {completionScore}%</span>
                  </div>
                </div>

                {/* Step Progress Bar */}
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all ${s <= step ? 'bg-brand-600' : 'bg-slate-200'
                        }`}
                      className={`h-2 rounded-full transition-all ${s <= step ? 'bg-brand-600' : 'bg-slate-200'}`}
                    />
                  ))}
                </div>

                {errorMsg && (
                  <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center">
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg('')}><X className="h-4 w-4" /></button>
                    <div
                      role="alert"
                      className="p-3.5 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-start gap-3 shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-red-800">Please review the highlighted fields</p>
                          <p className="mt-0.5 leading-5">{errorMsg}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Dismiss error"
                        onClick={() => setErrorMsg('')}
                        className="text-red-500 hover:text-red-800 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
        )}

                    {/* Step 1: Academic & Personal Details */}
                    {step === 1 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Academic & Personal Details</CardTitle>
                          <CardDescription>Enter your college institution, degree course and academic details.</CardDescription>
                          <CardDescription>
                            Enter your college institution, degree course, current semester, and preferred location. Fields marked with{' '}
                            <span className="text-red-500 font-bold">*</span> are required.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField label="Full Name" required>
                            <div className="rounded-lg border border-blue-100 bg-[#f0f6ff] p-3 text-xs text-[#10295d] flex items-start gap-2.5">
                              <Info className="h-4 w-4 text-[#1559c7] shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold">How to fill this step:</span> Select your{' '}
                                <strong>Degree Course</strong> first to unlock matching <strong>Branches</strong>, then choose your{' '}
                                <strong>Current Semester</strong> and <strong>Preferred MP District</strong>.
                              </div>
                            </div>

                            <FormField
                              label="Full Name"
                              required
                              error={fieldErrors.name}
                              hint="Enter your full official name as recorded by your institution."
                            >
                              <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                onChange={(e) => {
                                  clearFieldError('name');
                                  setFormData({ ...formData, name: e.target.value });
                                }}
                                placeholder="e.g. Ananya Sharma"
                                className={fieldErrors.name ? 'border-red-400 focus:border-red-500' : ''}
                              />
                            </FormField>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField label="College / University" required>
                                <FormField
                                  label="College / University"
                                  required
                                  error={fieldErrors.college}
                                  hint="Enter the full name of your college or university."
                                >
                                  <Input
                                    value={formData.college}
                                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                                    onChange={(e) => {
                                      clearFieldError('college');
                                      setFormData({ ...formData, college: e.target.value });
                                    }}
                                    placeholder="e.g. Jabalpur Engineering College (JEC)"
                                    className={fieldErrors.college ? 'border-red-400 focus:border-red-500' : ''}
                                  />
                                </FormField>

                                <AcademicCombobox
                                  label="Degree Course"
                                  placeholder="Search degrees..."
                                  value={formData.degreeId}
                                  options={ACADEMIC_DEGREES}
                                  onChange={(degreeId) => setFormData((prev) => ({ ...prev, degreeId, course: labelForDegree(degreeId), branchId: '', branch: '', specializationId: '', specialization: '', branchOther: '', specializationOther: '' }))}
                                />
                                {formData.degreeId === 'other' && <Input className="mt-2" value={formData.degreeOther} onChange={(e) => setFormData({ ...formData, degreeOther: e.target.value, course: e.target.value })} placeholder="Please specify your degree" />}
                                <div>
                                  <AcademicCombobox
                                    label="Degree Course"
                                    required
                                    placeholder="Search or select your degree (e.g. B.Tech, B.Sc, BCA)..."
                                    value={formData.degreeId}
                                    options={ACADEMIC_DEGREES}
                                    error={fieldErrors.degreeId || fieldErrors.degreeOther}
                                    hint="Type to search or click to browse UGC/AICTE degrees."
                                    onChange={(degreeId) => {
                                      clearFieldError('degreeId');
                                      clearFieldError('degreeOther');
                                      clearFieldError('branchId');
                                      const nextMaxSem = getMaxSemestersForDegree(degreeId);
                                      setFormData((prev) => ({
                                        ...prev,
                                        degreeId,
                                        course: labelForDegree(degreeId),
                                        branchId: '',
                                        branch: '',
                                        specializationId: '',
                                        specialization: '',
                                        branchOther: '',
                                        specializationOther: '',
                                        semester: prev.semester > nextMaxSem ? 0 : prev.semester,
                                      }));
                                    }}
                                  />
                                  {formData.degreeId === 'other' && (
                                    <Input
                                      className={`mt-2 ${fieldErrors.degreeOther ? 'border-red-400' : ''}`}
                                      value={formData.degreeOther}
                                      onChange={(e) => {
                                        clearFieldError('degreeOther');
                                        setFormData({ ...formData, degreeOther: e.target.value, course: e.target.value });
                                      }}
                                      placeholder="Please specify your degree name"
                                    />
                                  )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <AcademicCombobox
                                    label="Branch / Discipline"
                                    placeholder="Search branches..."
                                    required
                                    placeholder={selectedDegree ? 'Search or select your branch...' : 'Select a Degree Course first'}
                                    value={formData.branchId}
                                    options={branchOptions}
                                    disabled={!selectedDegree}
                                    onChange={(branchId) => setFormData((prev) => ({ ...prev, branchId, branch: labelForBranch(branchId), specializationId: '', specialization: '', branchOther: '', specializationOther: '' }))}
                                    error={fieldErrors.branchId || fieldErrors.branchOther}
                                    hint={
                                      selectedDegree
                                        ? `Showing branches available under ${selectedDegree.shortName || selectedDegree.name}.`
                                        : 'Select your Degree Course above to unlock branches.'
                                    }
                                    onChange={(branchId) => {
                                      clearFieldError('branchId');
                                      clearFieldError('branchOther');
                                      setFormData((prev) => ({
                                        ...prev,
                                        branchId,
                                        branch: labelForBranch(branchId),
                                        specializationId: '',
                                        specialization: '',
                                        branchOther: '',
                                        specializationOther: '',
                                      }));
                                    }}
                                  />
                                  {formData.branchId === 'other' && <Input className="mt-2" value={formData.branchOther} onChange={(e) => setFormData({ ...formData, branchOther: e.target.value, branch: e.target.value })} placeholder="Please specify your branch" />}
                                  {formData.branchId === 'other' && (
                                    <Input
                                      className={`mt-2 ${fieldErrors.branchOther ? 'border-red-400' : ''}`}
                                      value={formData.branchOther}
                                      onChange={(e) => {
                                        clearFieldError('branchOther');
                                        setFormData({ ...formData, branchOther: e.target.value, branch: e.target.value });
                                      }}
                                      placeholder="Please specify your branch or discipline"
                                    />
                                  )}
                                </div>

                                <div>
                                  <AcademicCombobox
                                    label="Specialization"
                                    placeholder="Search specializations..."
                                    label="Specialization (Optional)"
                                    placeholder={selectedBranch ? 'Search specialization (optional)...' : 'Select a Branch first'}
                                    value={formData.specializationId}
                                    options={specializationOptions}
                                    disabled={!selectedBranch}
                                    onChange={(specializationId) => setFormData((prev) => ({ ...prev, specializationId, specialization: labelForSpecialization(specializationId), specializationOther: '' }))}
                                    error={fieldErrors.specializationOther}
                                    hint={
                                      selectedBranch
                                        ? 'Optional: Select if your program has a specific specialization.'
                                        : 'Select your Branch first to see optional specializations.'
                                    }
                                    onChange={(specializationId) => {
                                      clearFieldError('specializationOther');
                                      setFormData((prev) => ({
                                        ...prev,
                                        specializationId,
                                        specialization: labelForSpecialization(specializationId),
                                        specializationOther: '',
                                      }));
                                    }}
                                  />
                                  {formData.specializationId === 'other' && <Input className="mt-2" value={formData.specializationOther} onChange={(e) => setFormData({ ...formData, specializationOther: e.target.value, specialization: e.target.value })} placeholder="Please specify your specialization" />}
                                  {formData.specializationId === 'other' && (
                                    <Input
                                      className={`mt-2 ${fieldErrors.specializationOther ? 'border-red-400' : ''}`}
                                      value={formData.specializationOther}
                                      onChange={(e) => {
                                        clearFieldError('specializationOther');
                                        setFormData({ ...formData, specializationOther: e.target.value, specialization: e.target.value });
                                      }}
                                      placeholder="Please specify your specialization"
                                    />
                                  )}
                                </div>
                              </div>

                              <FormField label="Current Semester" required>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <FormField
                                    label="Current Semester"
                                    required
                                    error={fieldErrors.semester}
                                    hint={
                                      selectedDegree
                                        ? `Select your active semester (1st to ${formatSemester(maxSemesters)} for ${selectedDegree.shortName || selectedDegree.name}).`
                                        : 'Choose the semester you are currently studying in.'
                                    }
                                  >
                                    <Select
                                      value={formData.semester}
                                      onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                                      aria-label="Current Semester"
                                      value={formData.semester || 0}
                                      onChange={(e) => {
                                        const nextSemester = Number(e.target.value);
                                        clearFieldError('semester');
                                        setFormData((prev) => ({
                                          ...prev,
                                          semester: Number.isFinite(nextSemester) ? nextSemester : 0,
                                        }));
                                      }}
                                      className={fieldErrors.semester ? 'border-red-400 focus:border-red-500' : ''}
                                    >
                                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                      <option key={sem} value={sem}>{formatSemester(sem)} Semester</option>
                    <option value={0}>Select your current semester...</option>
                    {
                                          semesterOptions.map((sem) => (
                                            <option key={sem} value={sem}>
                                              {formatSemester(sem)} Semester (Year {Math.ceil(sem / 2)})
                                            </option>
                                          ))
                                        }
                  </Select>
                                  </FormField>

                                  <FormField label="Aggregate CGPA">
                                    <FormField
                                      label="Aggregate CGPA (Optional)"
                                      error={fieldErrors.cgpa}
                                      hint="Enter on a 0.00 – 10.00 scale (leave empty if 1st semester results are pending)."
                                    >
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="10"
                                        value={formData.cgpa}
                                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                                        onChange={(e) => {
                                          clearFieldError('cgpa');
                                          const val = e.target.value;
                                          setFormData({ ...formData, cgpa: val });
                                          if (val.trim()) {
                                            const num = Number(val);
                                            if (!Number.isFinite(num) || num < 0 || num > 10) {
                                              setFieldErrors((prev) => ({
                                                ...prev,
                                                cgpa: 'CGPA must be between 0.00 and 10.00.',
                                              }));
                                            }
                                          }
                                        }}
                                        placeholder="e.g. 8.4"
                                        className={fieldErrors.cgpa ? 'border-red-400 focus:border-red-500' : ''}
                                      />
                                      <p className="mt-1 text-xs text-slate-500">0-10 scale</p>
                                    </FormField>
                                </div>

                                <FormField label="Preferred MP District / Location">
                                  <FormField
                                    label="Preferred MP District / Location"
                                    required
                                    error={fieldErrors.location}
                                    hint="Used to match local internships, government schemes, and regional opportunities."
                                  >
                                    <Select
                                      aria-label="Preferred MP District / Location"
                                      value={formData.location}
                                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                      onChange={(e) => {
                                        clearFieldError('location');
                                        setFormData({ ...formData, location: e.target.value });
                                      }}
                                      className={fieldErrors.location ? 'border-red-400 focus:border-red-500' : ''}
                                    >
                                      <option value="">Select a district or location</option>
                                      <option value="">Select a district or location...</option>
                                      <option value="Bhopal, MP">Bhopal, MP</option>
                                      <option value="Indore, MP">Indore, MP</option>
                                      <option value="Jabalpur, MP">Jabalpur, MP</option>
                                      <option value="Gwalior, MP">Gwalior, MP</option>
                                      <option value="Ujjain, MP">Ujjain, MP</option>
                                      <option value="Sagar, MP">Sagar, MP</option>
                                      <option value="Rewa, MP">Rewa, MP</option>
                                      <option value="Satna, MP">Satna, MP</option>
                                      <option value="Open to Remote">Open to Remote</option>
                                    </Select>
                                  </FormField>

                                  {step1Missing.length > 0 ? (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900">
                                      <span className="font-semibold">Still needed to continue:</span> {step1Missing.join(' • ')}
                                    </div>
                                  ) : (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                      <span>All required Step 1 details are complete. Click Continue to select your skills.</span>
                                    </div>
                                  )}
                                </CardContent>
                                <CardFooter className="justify-end gap-3 border-t border-slate-100 pt-4">
                                  <Button onClick={nextStep} variant="govt">
                                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                                  </Button>
                                </CardFooter>
                              </Card>
        )}

                              {/* Step 2: Skills Selection */}
                              {step === 2 && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Skills & Technical Competencies</CardTitle>
                                    <CardDescription>Select skills from the official MP CareerSetu skills catalog.</CardDescription>
                                    <CardDescription>
                                      Select the technical and domain skills you currently know from the official MP CareerSetu skills catalog.
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="rounded-lg border border-blue-100 bg-[#f0f6ff] p-3 text-xs text-[#10295d] flex items-start gap-2.5">
                                      <Info className="h-4 w-4 text-[#1559c7] shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-semibold">Tip:</span> Select at least <strong>3 to 5 skills</strong> that you
                                        have practiced in coursework or projects to unlock the full 25% skill profile score and get accurate AI
                                        skill-gap roadmaps. Click any skill below to add it, or click a badge to remove it.
                                      </div>
                                    </div>

                                    {/* Search Box */}
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                      <Input
                                        placeholder="Search skills by name or category (e.g. Python, AWS, SQL)..."
                                        value={skillSearch}
                                        onChange={(e) => setSkillSearch(e.target.value)}
                                        className="pl-9"
                                      />
                                    </div>

                                    {/* Currently Selected Skills */}
                                    <div>
                                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                        Selected Skills ({formData.selectedSkillIds.length}):
                                      </p>
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                          Selected Skills ({formData.selectedSkillIds.length}):
                                        </p>
                                        <span className="text-xs font-medium text-[#1559c7]">
                                          {formData.selectedSkillIds.length >= 5
                                            ? '✓ Full skill completion points (25/25)'
                                            : formData.selectedSkillIds.length >= 3
                                              ? `${5 - formData.selectedSkillIds.length} more for max skill score (15/25)`
                                              : formData.selectedSkillIds.length >= 1
                                                ? `Select ${3 - formData.selectedSkillIds.length} more for 15/25 pts`
                                                : 'Select skills below to begin'}
                                        </span>
                                      </div>
                                      {formData.selectedSkillIds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No skills selected yet. Select skills below.</p>
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    No skills selected yet. Click on the skill buttons below to add your skills.
                  </p>
                                      ) : (
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                                          {formData.selectedSkillIds.map((id) => {
                                            const sk = skillsCatalog.find((s) => s.id === id);
                                            return (
                                              <Badge
                                                key={id}
                                                variant="default"
                                                className="text-xs py-1 px-2.5 flex items-center gap-1.5 cursor-pointer bg-brand-700 text-white hover:bg-brand-800"
                                                onClick={() => setFormData({
                                                  ...formData,
                                                  selectedSkillIds: formData.selectedSkillIds.filter((sId) => sId !== id)
                                                })}
                                                onClick={() =>
                                                  setFormData({
                                                    ...formData,
                                                    selectedSkillIds: formData.selectedSkillIds.filter((sId) => sId !== id),
                                                  })
                                                }
                                              >
                                                {sk?.name || id} <X className="h-3 w-3" />
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* Skills Catalog Checklist */}
                                    <div>
                                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Available Skills Catalog:</p>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                                        {filteredSkills.map((sk) => {
                                          const isSelected = formData.selectedSkillIds.includes(sk.id);
                                          return (
                                            <button
                                              type="button"
                                              key={sk.id}
                                              onClick={() => {
                                                if (isSelected) {
                                                  setFormData({
                                                    ...formData,
                                                    selectedSkillIds: formData.selectedSkillIds.filter((sId) => sId !== sk.id),
                                                  });
                                                } else {
                                                  setFormData({
                                                    ...formData,
                                                    selectedSkillIds: [...formData.selectedSkillIds, sk.id],
                                                  });
                                                }
                                              }}
                                              className={`text-left text-xs p-2 rounded-md border transition-all flex justify-between items-center ${isSelected
                                                  ? 'bg-brand-50 border-brand-300 text-brand-900 font-semibold'
                                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                              <span className="truncate">{sk.name}</span>
                                              {isSelected ? <CheckCircle className="h-3.5 w-3.5 text-brand-700 shrink-0" /> : <Plus className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                        Available Skills Catalog ({filteredSkills.length}):
                                      </p>
                                      {filteredSkills.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-slate-500 border border-slate-200 rounded-lg">
                                          No catalog skills match &ldquo;{skillSearch}&rdquo;. Try a different keyword.
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                                          {filteredSkills.map((sk) => {
                                            const isSelected = formData.selectedSkillIds.includes(sk.id);
                                            return (
                                              <button
                                                type="button"
                                                key={sk.id}
                                                onClick={() => {
                                                  if (isSelected) {
                                                    setFormData({
                                                      ...formData,
                                                      selectedSkillIds: formData.selectedSkillIds.filter((sId) => sId !== sk.id),
                                                    });
                                                  } else {
                                                    setFormData({
                                                      ...formData,
                                                      selectedSkillIds: [...formData.selectedSkillIds, sk.id],
                                                    });
                                                  }
                                                }}
                                                className={`text-left text-xs p-2 rounded-md border transition-all flex justify-between items-center ${isSelected
                                                    ? 'bg-brand-50 border-brand-300 text-brand-900 font-semibold'
                                                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                                  }`}
                                              >
                                                <span className="truncate">{sk.name}</span>
                                                {isSelected ? (
                                                  <CheckCircle className="h-3.5 w-3.5 text-brand-700 shrink-0" />
                                                ) : (
                                                  <Plus className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                  <CardFooter className="justify-between border-t border-slate-100 pt-4">
                                    <Button onClick={prevStep} variant="outline">
                                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                                    </Button>
                                    <Button onClick={nextStep} variant="govt">
                                      Continue <ArrowRight className="h-4 w-4 ml-1" />
                                    </Button>
                                  </CardFooter>
                                </Card>
                              )}

                              {/* Step 3: Target Career Roles & Domain Interests */}
                              {step === 3 && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Career Goals & Domain Interests</CardTitle>
                                    <CardDescription>Select your target career roles and domain focus areas.</CardDescription>
                                    <CardDescription>
                                      Select at least 1 domain interest and at least 1 target career role so CareerSetu can build your
                                      personalized AI recommendations and 90-day roadmap.
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-5">
                                    {/* Domain Interests Selection */}
                                    <div>
                                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                        Domain Interests ({formData.interests.length}):
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                            Domain Interests ({formData.interests.length}) <span className="text-red-500">*</span>
                                          </p>
                                          <span className="text-xs text-slate-500">Select 1 or more focus areas</span>
                                        </div>
                                        <div
                                          className={`flex flex-wrap gap-2 p-3 rounded-lg border ${fieldErrors.interests ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'
                                            }`}
                                        >
                                          {AVAILABLE_DOMAIN_INTERESTS.map((interest) => {
                                            const isSelected = formData.interests.includes(interest);
                                            return (
                                              <button
                                                type="button"
                                                key={interest}
                                                onClick={() => {
                                                  clearFieldError('interests');
                                                  if (isSelected) {
                                                    setFormData({
                                                      ...formData,
                                                      interests: formData.interests.filter((i) => i !== interest),
                                                    });
                                                  } else {
                                                    setFormData({
                                                      ...formData,
                                                      interests: [...formData.interests, interest],
                                                    });
                                                  }
                                                }}
                                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${isSelected
                                                    ? 'bg-brand-700 border-brand-800 text-white font-medium shadow-sm'
                                                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                                  }`}
                                              >
                                                {isSelected ? '✓ ' : '+ '} {interest}
                                              </button>
                                            );
                                          })}
                                        </div>
                                        {fieldErrors.interests && (
                                          <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.interests}</p>
                                        )}
                                      </div>

                                      {/* Target Career Roles */}
                                      <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <div className="flex justify-between items-center">
                                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                            Target Career Roles ({formData.selectedCareerTitles.length}):
                                            Target Career Roles ({formData.selectedCareerTitles.length}) <span className="text-red-500">*</span>
                                          </p>
                                          <span className="text-xs text-slate-500">Select at least 1 role to target</span>
                                        </div>

                                        <div className="relative">
                                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                          <Input
                                            placeholder="Search career roles (e.g. Software Developer, Data Analyst)..."
                                            value={careerSearch}
                                            onChange={(e) => setCareerSearch(e.target.value)}
                                            className="pl-9"
                                          />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                                          <div
                                            className={`grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg ${fieldErrors.targetCareers ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                                              }`}
                                          >
                                            {filteredRoles.map((role) => {
                                              const isSelected = formData.selectedCareerTitles.includes(role.title);
                                              return (
                                                <button
                                                  type="button"
                                                  key={role.id}
                                                  onClick={() => {
                                                    clearFieldError('targetCareers');
                                                    if (isSelected) {
                                                      setFormData({
                                                        ...formData,
                                                        selectedCareerTitles: formData.selectedCareerTitles.filter((t) => t !== role.title),
                                                      });
                                                    } else {
                                                      setFormData({
                                                        ...formData,
                                                        selectedCareerTitles: [...formData.selectedCareerTitles, role.title],
                                                      });
                                                    }
                                                  }}
                                                  className={`text-left p-2.5 rounded-lg border text-xs transition-all ${isSelected
                                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                                                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                                                    }`}
                                                >
                                                  <div className="flex justify-between items-center mb-0.5">
                                                    <span className="font-bold">{role.title}</span>
                                                    {isSelected && <CheckCircle className="h-4 w-4 text-emerald-700" />}
                                                  </div>
                                                  <p className="text-[11px] text-slate-500 line-clamp-1">{role.category}</p>
                                                </button>
                                              );
                                            })}
                                          </div>
                                          {fieldErrors.targetCareers && (
                                            <p className="text-xs font-medium text-red-600">{fieldErrors.targetCareers}</p>
                                          )}
                                        </div>

                                        {step3Missing.length > 0 ? (
                                          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900">
                                            <span className="font-semibold">Still needed to continue:</span> {step3Missing.join(' • ')}
                                          </div>
                                        ) : (
                                          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                            <span>Career goals and domain interests selected. Click Continue to review and save.</span>
                                          </div>
                                        )}
                                      </CardContent>
                                      <CardFooter className="justify-between border-t border-slate-100 pt-4">
                                        <Button onClick={prevStep} variant="outline">
                                          <ArrowLeft className="h-4 w-4 mr-1" /> Back
                                        </Button>
                                        <Button onClick={nextStep} variant="govt">
                                          Continue <ArrowRight className="h-4 w-4 ml-1" />
                                        </Button>
                                      </CardFooter>
                                    </Card>
        )}

                                    {/* Step 4: Summary & Save */}
                                    {step === 4 && (
                                      <Card className="text-center p-6">
                                        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                                          <CheckCircle className="h-10 w-10" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900">Review & Save Profile</h2>
                                        <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                                          Your information will be securely saved to your Supabase student profile.
                                          Verify your details below before saving. You can click any section&apos;s Edit link to make adjustments.
                                        </p>

                                        <div className="my-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
                                          <p><span className="font-semibold text-slate-700">Full Name:</span> {formData.name}</p>
                                          <p><span className="font-semibold text-slate-700">College:</span> {formData.college}</p>
                                          <p><span className="font-semibold text-slate-700">Preferred Location:</span> {formData.location || 'Not selected'}</p>
                                          <p><span className="font-semibold text-slate-700">Academic:</span> {formData.course} ({formData.branch}) • {formatSemester(formData.semester)} Sem • Aggregate CGPA {formData.cgpa || 'Not provided'}</p>
                                          <p><span className="font-semibold text-slate-700">Domain Interests:</span> {formData.interests.join(', ')}</p>
                                          <p><span className="font-semibold text-slate-700">Selected Skills ({formData.selectedSkillIds.length}):</span> {formData.selectedSkillIds.length} skills mapped</p>
                                          <p><span className="font-semibold text-slate-700">Target Roles:</span> {formData.selectedCareerTitles.join(', ')}</p>
                                          <div className="my-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
                                            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                              <span className="font-bold text-[#10295d] uppercase tracking-wider">Academic & Personal</span>
                                              <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() => setStep(1)}
                                                className="text-[#1559c7] font-semibold hover:underline disabled:opacity-50"
                                              >
                                                Edit Step 1
                                              </button>
                                            </div>
                                            <p>
                                              <span className="font-semibold text-slate-700">Full Name:</span> {formData.name}
                                            </p>
                                            <p>
                                              <span className="font-semibold text-slate-700">College:</span> {formData.college}
                                            </p>
                                            <p>
                                              <span className="font-semibold text-slate-700">Preferred Location:</span>{' '}
                                              {formData.location || 'Not selected'}
                                            </p>
                                            <p>
                                              <span className="font-semibold text-slate-700">Academic Program:</span> {formData.course} (
                                              {formData.branch}) • {formatSemester(formData.semester)} Semester • Aggregate CGPA:{' '}
                                              {formData.cgpa || 'Not provided'}
                                            </p>

                                            <div className="flex justify-between items-center border-b border-slate-200 pt-2 pb-2">
                                              <span className="font-bold text-[#10295d] uppercase tracking-wider">Skills & Career Goals</span>
                                              <div className="flex gap-3">
                                                <button
                                                  type="button"
                                                  disabled={saving}
                                                  onClick={() => setStep(2)}
                                                  className="text-[#1559c7] font-semibold hover:underline disabled:opacity-50"
                                                >
                                                  Edit Skills
                                                </button>
                                                <button
                                                  type="button"
                                                  disabled={saving}
                                                  onClick={() => setStep(3)}
                                                  className="text-[#1559c7] font-semibold hover:underline disabled:opacity-50"
                                                >
                                                  Edit Goals
                                                </button>
                                              </div>
                                            </div>
                                            <p>
                                              <span className="font-semibold text-slate-700">Selected Skills ({formData.selectedSkillIds.length}):</span>{' '}
                                              {formData.selectedSkillIds.length > 0
                                                ? formData.selectedSkillIds
                                                  .map((id) => skillsCatalog.find((s) => s.id === id)?.name || id)
                                                  .join(', ')
                                                : 'None selected yet'}
                                            </p>
                                            <p>
                                              <span className="font-semibold text-slate-700">Domain Interests:</span> {formData.interests.join(', ')}
                                            </p>
                                            <p>
                                              <span className="font-semibold text-slate-700">Target Roles:</span>{' '}
                                              {formData.selectedCareerTitles.join(', ')}
                                            </p>
                                          </div>

                                          {saving && (
                                            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-[#10295d] font-medium">
                                              Saving your profile, calculating readiness assessment, and preparing your personalized AI career
                                              recommendations...
                                            </div>
                                          )}

                                          <div className="flex gap-3">
                                            <Button onClick={prevStep} variant="outline" className="w-1/3">
                                              <ArrowLeft className="h-4 w-4 mr-1" /> Edit
                                              <Button onClick={prevStep} variant="outline" className="w-1/3" disabled={saving}>
                                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                                              </Button>
                                              <Button onClick={handleFinish} variant="govt" size="lg" className="w-2/3" isLoading={saving}>
                                                Save Profile & Enter Dashboard →
                                                <Button
                                                  onClick={handleFinish}
                                                  variant="govt"
                                                  size="lg"
                                                  className="w-2/3"
                                                  isLoading={saving}
                                                  disabled={saving}
                                                >
                                                  {saving ? 'Saving Profile & Preparing AI Recommendations...' : 'Save Profile & Enter Dashboard →'}
                                                </Button>
                                              </div>
                                            </Card>
        )}
                                          </div>
                                        </div>
                                        );
}
