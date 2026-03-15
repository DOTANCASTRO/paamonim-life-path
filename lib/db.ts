import { getSupabase } from './supabase';
import { Plan } from './types';

export async function getPlan(id: string): Promise<Plan | null> {
  const { data, error } = await getSupabase()
    .from('plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    budget: data.budget,
    events: data.events,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function createPlan(plan: Omit<Plan, 'createdAt' | 'updatedAt'>): Promise<Plan | null> {
  const { data, error } = await getSupabase()
    .from('plans')
    .insert({
      id: plan.id,
      title: plan.title,
      budget: plan.budget,
      events: plan.events,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    budget: data.budget,
    events: data.events,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updatePlan(id: string, updates: Partial<Pick<Plan, 'title' | 'budget' | 'events'>>): Promise<boolean> {
  const { error } = await getSupabase()
    .from('plans')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  return !error;
}
