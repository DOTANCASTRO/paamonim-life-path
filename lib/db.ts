import { getSupabase } from './supabase';
import { Plan } from './types';

interface PlanRow { id: string; title: string; budget: Plan['budget']; events: Plan['events']; created_at: string; updated_at: string }
function rowToPlan(data: PlanRow): Plan {
  return {
    id: data.id,
    title: data.title,
    budget: data.budget,
    events: data.events,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getPlan(id: string): Promise<Plan | null> {
  const { data, error } = await getSupabase()
    .from('plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return rowToPlan(data);
}

export async function getUserPlans(userId: string): Promise<Plan[]> {
  const { data, error } = await getSupabase()
    .from('plans')
    .select('id, title, created_at, updated_at, budget, events')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data.map(rowToPlan);
}

export async function createPlan(
  plan: Omit<Plan, 'createdAt' | 'updatedAt'>,
  userId?: string
): Promise<Plan | null> {
  const { data, error } = await getSupabase()
    .from('plans')
    .insert({
      id: plan.id,
      title: plan.title,
      budget: plan.budget,
      events: plan.events,
      ...(userId ? { user_id: userId } : {}),
    })
    .select()
    .single();

  if (error || !data) return null;
  return rowToPlan(data);
}

export async function updatePlan(
  id: string,
  updates: Partial<Pick<Plan, 'title' | 'budget' | 'events'>>
): Promise<boolean> {
  const { error } = await getSupabase()
    .from('plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  return !error;
}
