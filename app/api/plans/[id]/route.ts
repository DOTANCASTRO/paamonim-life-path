import { NextRequest, NextResponse } from 'next/server';
import { getPlan, updatePlan, deletePlan } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { validateTitle, validateBudget, validateEvents, validateNotes } from '@/lib/validate';

// 60 reads per IP per minute (auto-save is frequent)
const READ_LIMIT = 60;
// 120 writes per IP per minute (auto-save debounced at 1.5s)
const WRITE_LIMIT = 120;
const WINDOW_MS = 60 * 1000;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'read-plan', READ_LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const plan = await getPlan(id);
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'write-plan', WRITE_LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const res = NextResponse.next();
  const supabase = createSupabaseRouteHandlerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const updates: Partial<{ title: string; budget: ReturnType<typeof validateBudget>; events: ReturnType<typeof validateEvents>; notes: string }> = {};

    if (body.title !== undefined) updates.title = validateTitle(body.title);
    if (body.budget !== undefined) updates.budget = validateBudget(body.budget);
    if (body.events !== undefined) updates.events = validateEvents(body.events);
    if (body.notes !== undefined) updates.notes = validateNotes(body.notes);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const ok = await updatePlan(id, user.id, updates);
    if (!ok) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });

    const plan = await getPlan(id);
    return NextResponse.json(plan);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'write-plan', WRITE_LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const res = NextResponse.next();
  const supabase = createSupabaseRouteHandlerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ok = await deletePlan(id, user.id);
  if (!ok) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
