import { NextRequest, NextResponse } from 'next/server';
import { createPlan } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfMonth } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = uuidv4();
    const startMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

    const plan = await createPlan({
      id,
      title: body.title || 'תכנית חדשה',
      budget: body.budget ?? {
        income: 0,
        expenses: 0,
        debtRepayment: 0,
        bankBalance: 0,
        startMonth,
      },
      events: body.events ?? [],
    });

    if (!plan) {
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }

    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
