'use server';

import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/client';
import { AIInfrastructureTestSchema, type AIInfrastructureTestResult } from '@/lib/ai/schemas';
import { AI_TEST_PROMPT } from '@/lib/ai/prompts/test';

export async function runAIInfrastructureTest() {
  const supabase = await createClient();

  // 1. Enforce authentication — protected server action
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized: Authentication required to execute AI infrastructure test.' };
  }

  // 2. Fetch authenticated student profile to construct test input
  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id, college, course, branch, target_careers, interests')
    .eq('user_id', user.id)
    .single();
  if (!sp) return { success: false, error: 'Student profile not found.' };

  const { data: skills } = await supabase
    .from('student_skills')
    .select('skills(name)')
    .eq('student_id', sp?.id || '');

  const skillNames = (skills || []).map((s) => {
    const relatedSkill = Array.isArray(s.skills) ? s.skills[0] : s.skills;
    return relatedSkill?.name;
  }).filter((name): name is string => Boolean(name)).join(', ') || 'No recorded skills';

  // 3. Format test prompt
  const formattedPrompt = AI_TEST_PROMPT
    .replace('{{degree_branch}}', `${sp.course || 'Not provided'} in ${sp.branch || 'Not provided'}`)
    .replace('{{college}}', sp.college || 'Not provided')
    .replace('{{skills}}', skillNames)
    .replace('{{target_careers}}', (sp.target_careers || []).join(', ') || 'None recorded')
    .replace('{{interests}}', (sp.interests || []).join(', ') || 'None recorded');

  const startTime = Date.now();
  const provider = aiClient.getProvider();

  // 4. Call AI Provider Abstraction
  const aiResult = await provider.generateStructuredOutput<AIInfrastructureTestResult>(
    formattedPrompt,
    AIInfrastructureTestSchema,
    'System: You are a structured JSON AI model for MP CareerSetu.'
  );

  const latencyMs = Date.now() - startTime;

  // 5. Log run telemetry to `public.ai_runs` (NO secrets or sensitive raw resumes logged)
  try {
    await supabase.from('ai_runs').insert({
      feature: 'infrastructure_test',
      model: provider.modelName,
      prompt_version: 'v1.0-test',
      latency_ms: latencyMs,
      success: aiResult.success,
    });
  } catch (logErr) {
    console.error('ai_runs telemetry logging failed:', logErr);
  }

  return {
    success: aiResult.success,
    data: aiResult.data,
    error: aiResult.success ? undefined : 'AI infrastructure test is temporarily unavailable.',
    provider: aiResult.provider,
    model: aiResult.model,
    latencyMs,
  };
}
