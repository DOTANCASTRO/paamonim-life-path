import { NextRequest, NextResponse } from 'next/server';
import { getPlan, updatePlan } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const ok = await updatePlan(id, body);
    if (!ok) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    const plan = await getPlan(id);
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
