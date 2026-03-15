import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { LifeEvent, Budget, TimelineResult } from '@/lib/types';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { sanitizeString } from '@/lib/validate';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 5 AI requests per IP per 10 minutes
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

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
  // Rate limit
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'ai-advice', LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'יותר מדי בקשות. נסה שוב עוד כמה דקות.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const { budget, events, result }: { budget: Budget; events: LifeEvent[]; result: TimelineResult } = await req.json();

    // Sanitize event names before injecting into prompt
    const safeEvents = events.map(e => ({
      ...e,
      name: sanitizeString(e.name, 60),
      fundingSource: sanitizeString(e.fundingSource ?? '', 60),
    }));

    const eventsText = safeEvents.map((e, i) =>
      `${i + 1}. ${e.name} | ${DIRECTION_LABELS[e.direction] ?? ''} | מתחיל: ${e.startMonth} | עדיפות: ${PRIORITY_LABELS[e.priority] ?? ''} | סכום: ₪${e.duration === 'oneTime' ? e.totalAmount : e.monthlyAmount} ${e.duration === 'oneTime' ? '(חד-פעמי)' : e.duration === 'forever' ? '(לתמיד)' : `(${e.duration} חודשים)`}`
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
