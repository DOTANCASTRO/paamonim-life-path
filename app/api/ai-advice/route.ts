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

    const prompt = `אתה יועץ פיננסי מומחה של עמותת פעמונים. אתה עוזר למשפחות לנהל את התקציב שלהן באופן מציאותי ואמפתי.

**נתוני התקציב הבסיסי:**
- הכנסות חודשיות: ₪${budget.income.toLocaleString()}
- הוצאות חודשיות: ₪${budget.expenses.toLocaleString()}
- החזר חובות: ₪${budget.debtRepayment.toLocaleString()}
- יתרה בבנק כיום: ₪${budget.bankBalance.toLocaleString()}
- עודף/גרעון חודשי בסיסי: ₪${(budget.income - budget.expenses - budget.debtRepayment).toLocaleString()}

**אירועי חיים מתוכננים:**
${eventsText}

**תוצאות הניתוח:**
- חודשי חריגה: ${result.overrunMonths}
- חודש החריגה הראשון: ${result.firstOverrunMonth ?? 'אין'}
- יתרה מינימלית: ₪${result.worstBalance.toLocaleString()}

**המשימה שלך:**
ספק המלצות מעשיות ומפורטות כיצד להתמודד עם החריגה בתקציב. התמקד ב:
1. אירועים לפי סדר עדיפות — התחל מ"רצוי", המשך ל"חשוב", ורק לבסוף "בלתי נמנע"
2. לכל אירוע בעייתי — הצע פעולה קונקרטית: דחייה, צמצום היקף, פריסה לתשלומים, ביטול
3. אם יש חריגה קטנה — האם ניתן לגשר עם חסכון קיים?
4. טיפ אחד ייחודי שמתאים למצב הספציפי הזה

כתוב בעברית, בשפה ברורה וחמה. אורך: 200-350 מילים. מבנה: פסקאות קצרות עם כותרות קצרות מודגשות.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ advice: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'AI advice failed' }, { status: 500 });
  }
}
