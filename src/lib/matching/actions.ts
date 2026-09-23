'use server';

import { createClient } from '@/lib/supabase/server';
import { rankOpportunityMatches } from './scoring';
import type { OpportunityCatalogItem } from './types';

async function getAuthenticatedStudent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, student: null };
  const { data: student } = await supabase.from('student_profiles').select('id, target_careers, interests').eq('user_id', user.id).single();
  return { supabase, student };
}

async function buildMatches(opportunityId?: string) {
  const { supabase, student } = await getAuthenticatedStudent();
  if (!student) return { success: false, error: 'Unauthorized: Authentication required.', matches: [] };
  const [{ data: studentSkills }, { data: roleSkills }, { data: opportunities }] = await Promise.all([
    supabase.from('student_skills').select('skill_id, proficiency').eq('student_id', student.id),
    supabase.from('career_role_skills').select('skill_id').in('role_id', student.target_careers || []),
    supabase.from('opportunities').select('*, opportunity_skills(skill_id, skills(id, name, category))').eq('status', 'active').eq(opportunityId ? 'id' : 'status', opportunityId ? opportunityId : 'active'),
  ]);
  if (opportunityId && !(opportunities || []).some((item) => item.id === opportunityId)) return { success: false, error: 'Opportunity not found.', matches: [] };
  const catalog = (opportunities || []).map((item) => ({ ...item, skills: (item.opportunity_skills || []).map((link: { skills: unknown }) => Array.isArray(link.skills) ? link.skills[0] : link.skills).filter(Boolean) })) as unknown as OpportunityCatalogItem[];
  const matches = rankOpportunityMatches(catalog, { skills: studentSkills || [], targetRoleSkillIds: new Set((roleSkills || []).map((item) => item.skill_id)), interests: student.interests || [] });
  const rows = matches.map((match) => ({ student_id: student.id, opportunity_id: match.opportunity.id, hard_filter_status: match.hard_filter_status, semantic_score: match.score, match_reasons: match.reasons }));
  if (rows.length) await supabase.from('opportunity_matches').upsert(rows, { onConflict: 'student_id,opportunity_id' });
  return { success: true, matches };
}

export async function getOpportunityMatches() { return buildMatches(); }
export async function getOpportunityMatch(opportunityId: string) { return buildMatches(opportunityId); }
