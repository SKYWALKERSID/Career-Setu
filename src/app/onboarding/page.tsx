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
import { CheckCircle, ArrowRight, ArrowLeft, Search, Plus, X } from 'lucide-react';
import { getStudentProfile, getCatalogItems, saveStudentProfile } from '@/lib/profile/actions';
import { calculateProfileCompletion } from '@/lib/profile/validation';
import { OnboardingCompletionVisual } from '@/components/onboarding/onboarding-completion-visual';

const AVAILABLE_DOMAIN_INTERESTS = [
  'Software Engineering',
  'Data Science & Analytics',
  'Cloud Computing & DevOps',
  'Cybersecurity & Defense',
  'UI/UX & Product Design',
  'Artificial Intelligence / ML',
  'Hardware & Embedded Systems',
  'E-Governance & Public IT',
  'Digital Marketing & Media',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Catalog Data from DB
  const [skillsCatalog, setSkillsCatalog] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [careerRolesCatalog, setCareerRolesCatalog] = useState<Array<{ id: string; title: string; category: string }>>([]);

  // Search/Filter States
  const [skillSearch, setSkillSearch] = useState('');
  const [careerSearch, setCareerSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    location: 'Bhopal, MP',
    college: '',
    course: 'B.Tech',
    branch: 'Computer Science & Engineering',
    semester: 7,
    cgpa: '8.0',
    interests: ['Software Engineering', 'Data Science & Analytics'] as string[],
    selectedCareerTitles: ['Software Developer'] as string[],
    selectedSkillIds: [] as string[],
  });

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

          setFormData({
            name: sp.name || '',
            location: sp.location || 'Bhopal, MP',
            college: sp.college || '',
            course: sp.course || 'B.Tech',
            branch: sp.branch || 'Computer Science & Engineering',
            semester: sp.semester || 7,
            cgpa: sp.cgpa ? String(sp.cgpa) : '8.0',
            interests: sp.interests && sp.interests.length > 0 ? sp.interests : ['Software Engineering'],
            selectedCareerTitles: sp.target_careers && sp.target_careers.length > 0 ? sp.target_careers : ['Software Developer'],
            selectedSkillIds: userSkills,
          });
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load initial onboarding data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setErrorMsg('Please enter your full name');
        return;
      }
      if (!formData.college.trim()) {
        setErrorMsg('Please enter your college name');
        return;
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
    setErrorMsg('');
    setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => {
    setErrorMsg('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleFinish = async () => {
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await saveStudentProfile({
        name: formData.name,
        location: formData.location,
        college: formData.college,
        course: formData.course,
        branch: formData.branch,
        semester: Number(formData.semester),
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
        interests: formData.interests,
        target_careers: formData.selectedCareerTitles,
        skill_ids: formData.selectedSkillIds,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save profile');
      }

      setCompleted(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <LoadingState label="Loading catalog & student profile..." />
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
              <small className="text-[10px] text-slate-500">Government of Madhya Pradesh</small>
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
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </section>
        <OnboardingCompletionVisual />
      </main>
    );
  }

  const filteredSkills = skillsCatalog.filter((sk) =>
    sk.name.toLowerCase().includes(skillSearch.toLowerCase()) || sk.category.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const filteredRoles = careerRolesCatalog.filter((cr) =>
    cr.title.toLowerCase().includes(careerSearch.toLowerCase()) || cr.category.toLowerCase().includes(careerSearch.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-[#f7faff] flex flex-col items-center p-5 sm:p-8">
      <div className="w-full max-w-[920px] space-y-6">
        {/* Top Header */}
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
              className={`h-2 rounded-full transition-all ${
                s <= step ? 'bg-brand-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Step 1: Academic & Personal Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Academic & Personal Details</CardTitle>
              <CardDescription>Enter your college institution, degree course and academic details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Full Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ananya Sharma"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="College / University" required>
                  <Input
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    placeholder="e.g. Jabalpur Engineering College (JEC)"
                  />
                </FormField>

                <FormField label="Degree Course" required>
                  <Select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  >
                    <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                    <option value="B.E.">B.E. (Bachelor of Engineering)</option>
                    <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                    <option value="MCA">MCA (Master of Computer Applications)</option>
                    <option value="B.Sc">B.Sc (Computer Science / IT)</option>
                    <option value="Diploma">Diploma (Polytechnic)</option>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Branch / Discipline" required>
                  <Input
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="e.g. Computer Science"
                  />
                </FormField>

                <FormField label="Current Semester" required>
                  <Select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                      <option key={sem} value={sem}>{sem}th Semester</option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="CGPA / Aggregate %">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.cgpa}
                    onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                    placeholder="e.g. 8.4"
                  />
                </FormField>
              </div>

              <FormField label="Preferred MP District / Location">
                <Select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <option>Bhopal, MP</option>
                  <option>Indore, MP</option>
                  <option>Jabalpur, MP</option>
                  <option>Gwalior, MP</option>
                  <option>Ujjain, MP</option>
                  <option>Open to Remote</option>
                </Select>
              </FormField>
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
            </CardHeader>
            <CardContent className="space-y-4">
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
                {formData.selectedSkillIds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No skills selected yet. Select skills below.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {formData.selectedSkillIds.map((id) => {
                      const sk = skillsCatalog.find((s) => s.id === id);
                      return (
                        <Badge
                          key={id}
                          variant="default"
                          className="text-xs py-1 px-2.5 flex items-center gap-1.5 cursor-pointer bg-brand-700 hover:bg-brand-800"
                          onClick={() => setFormData({
                            ...formData,
                            selectedSkillIds: formData.selectedSkillIds.filter((sId) => sId !== id)
                          })}
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
                        className={`text-left text-xs p-2 rounded-md border transition-all flex justify-between items-center ${
                          isSelected
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
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Domain Interests Selection */}
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Domain Interests ({formData.interests.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_DOMAIN_INTERESTS.map((interest) => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                      <button
                        type="button"
                        key={interest}
                        onClick={() => {
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
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-brand-700 border-brand-800 text-white font-medium shadow-sm'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Career Roles */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Target Career Roles ({formData.selectedCareerTitles.length}):
                  </p>
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
                  {filteredRoles.map((role) => {
                    const isSelected = formData.selectedCareerTitles.includes(role.title);
                    return (
                      <button
                        type="button"
                        key={role.id}
                        onClick={() => {
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
                        className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                          isSelected
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

        {/* Step 4: Summary & Save */}
        {step === 4 && (
          <Card className="text-center p-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Review & Save Profile</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              Your information will be securely saved to your Supabase student profile.
            </p>

            <div className="my-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
              <p><span className="font-semibold text-slate-700">Full Name:</span> {formData.name}</p>
              <p><span className="font-semibold text-slate-700">College:</span> {formData.college}</p>
              <p><span className="font-semibold text-slate-700">Academic:</span> {formData.course} ({formData.branch}) • {formData.semester}th Sem • CGPA {formData.cgpa}</p>
              <p><span className="font-semibold text-slate-700">Domain Interests:</span> {formData.interests.join(', ')}</p>
              <p><span className="font-semibold text-slate-700">Selected Skills ({formData.selectedSkillIds.length}):</span> {formData.selectedSkillIds.length} skills mapped</p>
              <p><span className="font-semibold text-slate-700">Target Roles:</span> {formData.selectedCareerTitles.join(', ')}</p>
            </div>

            <div className="flex gap-3">
              <Button onClick={prevStep} variant="outline" className="w-1/3">
                <ArrowLeft className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button onClick={handleFinish} variant="govt" size="lg" className="w-2/3" isLoading={saving}>
                Save Profile & Enter Dashboard →
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
