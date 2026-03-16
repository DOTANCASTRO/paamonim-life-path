import { NextRequest, NextResponse } from 'next/server';
import { createPlan } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfMonth } from 'date-fns';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { validateTitle, validateBudget, validateEvents } from '@/lib/validate';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';

const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'create-plan', LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'יותר מדי בקשות. נסה שוב מאוחר יותר.' }, { status: 429 });
  }

  const res = NextResponse.next();

  try {
    const body = await req.json();
    const id = uuidv4();
    const startMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

    const title = validateTitle(body.title);
    const budget = body.budget
      ? validateBudget(body.budget)
      : { income: 0, expenses: 0, debtRepayment: 0, debtRepaymentMonths: 0, bankBalance: 0, startMonth };
    const events = body.events ? validateEvents(body.events) : [];

    // Read session from request cookies
    const supabase = createSupabaseRouteHandlerClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    const plan = await createPlan({ id, title, budget, events }, user?.id);
    if (!plan) return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });

    return NextResponse.json(plan);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
