import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { LifeEvent, Budget, TimelineResult } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PRIORITY_LABELS: Record<string, string> = {
  unavoidable: 'בלתי נמנע',
  important: 'חשוב',
  desirable: 'רצוי',
};

const DIRECTION_LABELS: Record<string, string> = {
  burden: 'הכבדה',
  relief: 'הקלה',
};

export async function POST(req: NextRequest) {
  try {
    const { budget, events, result }: { budget: Budget; events: LifeEvent[]; result: TimelineResult } = await req.json();

    const eventsText = events.map((e, i) =>
      `${i + 1}. ${e.name} | ${DIRECTION_LABELS[e.direction]} | מתחיל: ${e.startMonth} | עדיפות: ${PRIORITY_LABELS[e.priority]} | סכום: ₪${e.direction === 'burden' ? e.duration === 'oneTime' ? e.totalAmount : e.monthlyAmount : e.duration === 'oneTime' ? e.totalAmount : e.monthlyAmount} ${e.duration === 'oneTime' ? '(חד-פעמי)' : e.duration === 'forever' ? '(לתמיד)' : `(${e.duration} חודשים)`}`
    ).join('\n');

    const prompt = `אתה יועץ פיננסי של פעמונים. ענה בעברית פשוטה וישירה. עד 20 שורות, ללא פתיחות מיותרות.

תקציב: הכנסות ₪${budget.income.toLocaleString()} | הוצאות ₪${budget.expenses.toLocaleString()} | חובות ₪${budget.debtRepayment.toLocaleString()} | יתרה ₪${budget.bankBalance.toLocaleString()} | עודף חודשי ₪${(budget.income - budget.expenses - budget.debtRepayment).toLocaleString()}
חריגה: ${result.overrunMonths} חודשים | ראשונה: ${result.firstOverrunMonth ?? 'אין'} | יתרה מינימלית: ₪${result.worstBalance.toLocaleString()}

אירועים:
${eventsText}

תן המלצות קצרות ומעשיות: מה לדחות, מה לצמצם, מה לבטל — לפי סדר עדיפות (רצוי קודם). משפטים קצרים. ללא כותרות מיותרות.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ advice: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'AI advice failed' }, { status: 500 });
  }
}
