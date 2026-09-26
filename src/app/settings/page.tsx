'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { LoadingState } from '@/components/ui/loading-state';
import {
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Heart,
  Save,
  Sparkles,
  User,
} from 'lucide-react';
import { getStudentProfile, saveStudentProfile, getCatalogItems } from '@/lib/profile/actions';
import { calculateProfileCompletion } from '@/lib/profile/validation';

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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'skills' | 'careers' | 'interests'>('profile');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [catalogSkills, setCatalogSkills] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [catalogRoles, setCatalogRoles] = useState<Array<{ id: string; title: string; category: string }>>([]);

  const [formData, setFormData] = useState({
    name: '',
    college: '',
    course: 'B.Tech',
    branch: '',
    semester: 7,
    cgpa: '',
    location: '',
    interests: [] as string[],
    target_careers: [] as string[],
    skill_ids: [] as string[],
  });

  useEffect(() => {
    async function load() {
      try {
        const [res, catalog] = await Promise.all([getStudentProfile(), getCatalogItems()]);

        setCatalogSkills(catalog.skills || []);
        setCatalogRoles(catalog.careerRoles || []);

        if (res.success && res.studentProfile) {
          const sp = res.studentProfile;
          setFormData({
            name: sp.name || '',
            college: sp.college || '',
            course: sp.course || 'B.Tech',
            branch: sp.branch || '',
            semester: sp.semester || 1,
            cgpa: sp.cgpa !== null && sp.cgpa !== undefined ? String(sp.cgpa) : '',
            location: sp.location || '',
            interests: sp.interests || [],
            target_careers: sp.target_careers || [],
            skill_ids: (res.studentSkills || []).map((sk) => sk.skill_id),
          });
        }
      } catch (err: unknown) {
        setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to fetch settings profile' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completionScore = calculateProfileCompletion({
    name: formData.name,
    location: formData.location,
    college: formData.college,
    course: formData.course,
    branch: formData.branch,
    semester: formData.semester,
    cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
    skillsCount: formData.skill_ids.length,
    targetCareersCount: formData.target_careers.length,
    interestsCount: formData.interests.length,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await saveStudentProfile({
        name: formData.name,
        college: formData.college,
        course: formData.course,
        branch: formData.branch,
        semester: Number(formData.semester),
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
        location: formData.location,
        interests: formData.interests,
        target_careers: formData.target_careers,
        skill_ids: formData.skill_ids,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile settings');
      }

      setMsg({ type: 'success', text: 'Profile settings updated successfully!' });
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      skill_ids: prev.skill_ids.includes(id)
        ? prev.skill_ids.filter((s) => s !== id)
        : [...prev.skill_ids, id],
    }));
  };

  const toggleTargetCareer = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      target_careers: prev.target_careers.includes(id)
        ? prev.target_careers.filter((c) => c !== id)
        : [...prev.target_careers, id],
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f4f8fc]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center p-6">
            <LoadingState label="Loading profile settings..." />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f8fc]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-4 p-4 sm:p-6">
          <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Profile & Settings' }]} />

          {/* Hero Banner matched to CareerSetu design system */}
          <section className="relative overflow-hidden rounded-[3px] border border-[#dbe7f3] bg-[#eaf4fc] px-6 py-7 shadow-[0_2px_10px_rgba(29,67,110,0.04)] sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#1769d4]">
                  STUDENT ACCOUNT · PROFILE & SETTINGS
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#10285a] sm:text-4xl">
                  Personalize Your Learning Path
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#526d89]">
                  Keep your academic background, technical skills, target career roles, and domain interests up to date for precise AI recommendations and readiness scoring.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded border border-[#cbe0f5] bg-white/80 px-5 py-3 shadow-sm">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Profile Completion</p>
                  <p className="text-xs text-slate-400">Deterministic metric</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#10285a]">{completionScore}%</span>
                </div>
              </div>
            </div>
          </section>

          {msg.text && (
            <div
              className={`rounded border p-3.5 text-xs font-semibold shadow-sm ${
                msg.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-6 border-b border-[#dce7f0] text-xs font-semibold text-[#61728a]">
            {[
              { id: 'profile' as const, label: 'Personal Info', icon: User },
              { id: 'academic' as const, label: 'Academic Foundation', icon: GraduationCap },
              { id: 'skills' as const, label: 'Technical Skills', icon: Sparkles },
              { id: 'careers' as const, label: 'Target Careers', icon: BriefcaseBusiness },
              { id: 'interests' as const, label: 'Domain Interests', icon: Heart },
            ].map(({ id, label, icon: TabIcon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 border-b-2 px-2 py-3 transition-colors ${
                  activeTab === id
                    ? 'border-[#1769d4] font-bold text-[#1769d4]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* Form Content Card */}
              <div className="space-y-5">
                {activeTab === 'profile' && (
                  <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <div className="flex items-center gap-2 border-b border-[#edf3f8] pb-4">
                      <User className="h-5 w-5 text-[#1769d4]" />
                      <h2 className="text-lg font-bold text-[#10285a]">Personal Details</h2>
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <FormField label="Full Name" required>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your full name"
                          className="h-10 text-xs"
                          required
                        />
                      </FormField>

                      <FormField label="Location / City" required>
                        <Input
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g. Bhopal, MP"
                          className="h-10 text-xs"
                          required
                        />
                      </FormField>
                    </div>
                  </Card>
                )}

                {activeTab === 'academic' && (
                  <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <div className="flex items-center gap-2 border-b border-[#edf3f8] pb-4">
                      <GraduationCap className="h-5 w-5 text-[#1769d4]" />
                      <h2 className="text-lg font-bold text-[#10285a]">Academic Foundation</h2>
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <FormField label="College / Institution" required>
                        <Input
                          value={formData.college}
                          onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                          placeholder="e.g. Jabalpur Engineering College"
                          className="h-10 text-xs"
                          required
                        />
                      </FormField>

                      <FormField label="Degree Course" required>
                        <Select
                          value={formData.course}
                          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                          className="h-10 text-xs"
                        >
                          <option value="B.Tech">B.Tech</option>
                          <option value="B.E.">B.E.</option>
                          <option value="BCA">BCA</option>
                          <option value="MCA">MCA</option>
                          <option value="B.Sc">B.Sc</option>
                          <option value="Diploma">Diploma</option>
                        </Select>
                      </FormField>

                      <FormField label="Branch / Discipline" required>
                        <Input
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                          placeholder="e.g. Computer Science & Engineering"
                          className="h-10 text-xs"
                          required
                        />
                      </FormField>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Semester" required>
                          <Select
                            value={formData.semester}
                            onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                            className="h-10 text-xs"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                              <option key={s} value={s}>
                                Sem {s}
                              </option>
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
                            className="h-10 text-xs"
                          />
                        </FormField>
                      </div>
                    </div>
                  </Card>
                )}

                {activeTab === 'skills' && (
                  <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#1769d4]" />
                        <h2 className="text-lg font-bold text-[#10285a]">Technical Skills Catalog</h2>
                      </div>
                      <span className="text-xs font-semibold text-[#1769d4]">
                        {formData.skill_ids.length} Selected
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Select skills from the verified catalog to calculate your technical readiness score accurately.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {catalogSkills.map((sk) => {
                        const isSelected = formData.skill_ids.includes(sk.id);
                        return (
                          <button
                            type="button"
                            key={sk.id}
                            onClick={() => toggleSkill(sk.id)}
                            className={`rounded border px-3 py-1.5 text-xs font-semibold transition-all ${
                              isSelected
                                ? 'border-[#1769d4] bg-[#eaf3ff] text-[#1769d4]'
                                : 'border-[#dce7f0] bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {sk.name}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {activeTab === 'careers' && (
                  <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-5 w-5 text-[#1769d4]" />
                        <h2 className="text-lg font-bold text-[#10285a]">Target Career Roles</h2>
                      </div>
                      <span className="text-xs font-semibold text-[#1769d4]">
                        {formData.target_careers.length} Selected
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Select at least one canonical target role from the catalog to tailor mock interviews, roadmaps, and career matching.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {catalogRoles.map((role) => {
                        const isSelected = formData.target_careers.includes(role.id);
                        return (
                          <div
                            key={role.id}
                            onClick={() => toggleTargetCareer(role.id)}
                            className={`cursor-pointer rounded border p-3.5 transition-all ${
                              isSelected
                                ? 'border-[#1769d4] bg-[#f0f6ff]'
                                : 'border-[#e4ebf3] bg-white hover:bg-[#f8fbfe]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg sm:text-xl font-bold text-[#10285a]">{role.title}</h3>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-[#1769d4]" />}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">{role.category}</p>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {activeTab === 'interests' && (
                  <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-[#1769d4]" />
                        <h2 className="text-lg font-bold text-[#10285a]">Domain Interests</h2>
                      </div>
                      <span className="text-xs font-semibold text-[#1769d4]">
                        {formData.interests.length} Selected
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {AVAILABLE_DOMAIN_INTERESTS.map((interest) => {
                        const isSelected = formData.interests.includes(interest);
                        return (
                          <button
                            type="button"
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                              isSelected
                                ? 'border-[#1769d4] bg-[#1769d4] text-white shadow-sm'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '} {interest}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Save CTA Bar */}
                <div className="flex items-center justify-between rounded border border-[#dce7f0] bg-white p-4 shadow-sm">
                  <p className="text-[11px] text-slate-500">
                    Changes take effect across your dashboard, readiness score, and roadmap immediately.
                  </p>
                  <Button variant="govt" type="submit" disabled={saving} className="px-6">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Profile Settings'}
                  </Button>
                </div>
              </div>

              {/* Sidebar Info Card */}
              <aside className="space-y-5">
                <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-5 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#10285a]">Profile Strength Breakdown</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Calculated deterministically from your current form selections.
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex justify-between border-b border-[#edf3f8] pb-2">
                      <span className="text-slate-600">Personal Info</span>
                      <span className="font-bold text-emerald-700">
                        {formData.name && formData.location ? '15 / 15 pts' : 'Incomplete'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-[#edf3f8] pb-2">
                      <span className="text-slate-600">Academic Info</span>
                      <span className="font-bold text-emerald-700">
                        {formData.college && formData.course && formData.branch ? '30 / 30 pts' : 'Incomplete'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-[#edf3f8] pb-2">
                      <span className="text-slate-600">Technical Skills ({formData.skill_ids.length})</span>
                      <span className="font-bold text-emerald-700">
                        {formData.skill_ids.length >= 5 ? '25 / 25 pts' : formData.skill_ids.length >= 3 ? '15 / 25 pts' : '10 / 25 pts'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-[#edf3f8] pb-2">
                      <span className="text-slate-600">Target Roles ({formData.target_careers.length})</span>
                      <span className="font-bold text-emerald-700">
                        {formData.target_careers.length >= 1 ? '20 / 20 pts' : '0 / 20 pts'}
                      </span>
                    </div>

                    <div className="flex justify-between pb-1">
                      <span className="text-slate-600">Interests ({formData.interests.length})</span>
                      <span className="font-bold text-emerald-700">
                        {formData.interests.length >= 1 ? '10 / 10 pts' : '0 / 10 pts'}
                      </span>
                    </div>
                  </div>
                </Card>

                <div className="rounded-[3px] border border-[#dbe8f5] bg-[#edf6ff] p-5">
                  <h3 className="text-lg sm:text-xl font-bold text-[#10285a]">Data Ownership & Security</h3>
                  <p className="mt-2 text-[11px] leading-4 text-slate-600">
                    Your profile data is protected by Supabase RLS (`user_id = auth.uid()`). Updates are stored securely and never shared publicly.
                  </p>
                </div>
              </aside>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
