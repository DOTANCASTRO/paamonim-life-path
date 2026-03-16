import { getSupabase, getServiceSupabase } from './supabase';
import { Plan } from './types';

interface PlanRow { id: string; title: string; budget: Plan['budget']; events: Plan['events']; notes: string; created_at: string; updated_at: string }

function rowToPlan(data: PlanRow): Plan {
  const rawBudget = data.budget as Omit<Plan['budget'], 'debtRepaymentMonths'> & { debtRepaymentMonths?: number };
  return {
    id: data.id,
    title: data.title,
    budget: { ...rawBudget, debtRepaymentMonths: rawBudget.debtRepaymentMonths ?? 0 },
    events: data.events,
    notes: data.notes ?? '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// READ — anon key is fine (SELECT policy is open)
export async function getPlan(id: string): Promise<Plan | null> {
  const { data, error } = await getSupabase()
    .from('plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return rowToPlan(data);
}

// READ own plans — service client so user_id filter works server-side
export async function getUserPlans(userId: string): Promise<Plan[]> {
  const { data, error } = await getServiceSupabase()
    .from('plans')
    .select('id, title, created_at, updated_at, budget, events, notes')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data.map(rowToPlan);
}

// WRITE — service client bypasses RLS; auth is validated in the API route
export async function createPlan(
  plan: Omit<Plan, 'createdAt' | 'updatedAt'>,
  userId?: string
): Promise<Plan | null> {
  const { data, error } = await getServiceSupabase()
    .from('plans')
    .insert({
      id: plan.id,
      title: plan.title,
      budget: plan.budget,
      events: plan.events,
      notes: plan.notes ?? '',
      ...(userId ? { user_id: userId } : {}),
    })
    .select()
    .single();

  if (error || !data) return null;
  return rowToPlan(data);
}

export async function updatePlan(
  id: string,
  updates: Partial<Pick<Plan, 'title' | 'budget' | 'events' | 'notes'>>
): Promise<boolean> {
  const { error } = await getServiceSupabase()
    .from('plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  return !error;
}

export async function deletePlan(id: string, userId: string): Promise<boolean> {
  const { error } = await getServiceSupabase()
    .from('plans')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  return !error;
}
