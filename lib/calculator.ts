import { Budget, LifeEvent, MonthlyResult, TimelineResult } from './types';
import { addMonths, format, differenceInCalendarMonths, parseISO, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

export function formatHebrewMonth(isoDate: string): string {
  const d = parseISO(isoDate);
  return `${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function calculateTimeline(budget: Budget, events: LifeEvent[], totalMonths = 120): TimelineResult {
  const startDate = startOfMonth(parseISO(budget.startMonth));
  const monthlyBase = budget.income - budget.expenses - budget.debtRepayment;
  const months: MonthlyResult[] = [];
  let cumulativeBalance = budget.bankBalance;

  for (let t = 0; t < totalMonths; t++) {
    const currentDate = addMonths(startDate, t);
    const isoMonth = format(currentDate, 'yyyy-MM-dd');

    let eventsImpact = 0;
    const activeEvents: string[] = [];

    for (const event of events) {
      if (!event.name) continue;

      const eventStart = startOfMonth(parseISO(event.startMonth));
      const monthsElapsed = differenceInCalendarMonths(currentDate, eventStart);

      if (monthsElapsed < 0) continue;

      const duration = event.duration === 'forever' ? 999 : event.duration === 'oneTime' ? 1 : (event.duration as number);
      if (monthsElapsed >= duration) continue;

      const amount = event.duration === 'oneTime' ? event.totalAmount : event.monthlyAmount;
      const multiplier = event.direction === 'burden' ? -1 : 1;
      eventsImpact += amount * multiplier;
      activeEvents.push(event.name);
    }

    const monthlySurplus = monthlyBase + eventsImpact;
    cumulativeBalance += monthlySurplus;

    months.push({
      month: isoMonth,
      label: `${HEBREW_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
      monthlyBase,
      eventsImpact,
      monthlySurplus,
      cumulativeBalance,
      isOverrun: cumulativeBalance < 0,
      activeEvents,
    });
  }

  const overrunMonths = months.filter(m => m.isOverrun).length;
  const firstOverrun = months.find(m => m.isOverrun);
  const worstBalance = Math.min(...months.map(m => m.cumulativeBalance));

  return {
    months,
    overrunMonths,
    firstOverrunMonth: firstOverrun?.label ?? null,
    worstBalance,
  };
}

export function getOverrunEvents(result: TimelineResult, events: LifeEvent[]): LifeEvent[] {
  const overrunMonths = result.months.filter(m => m.isOverrun);
  const eventNamesInOverrun = new Set(overrunMonths.flatMap(m => m.activeEvents));
  return events.filter(e => eventNamesInOverrun.has(e.name));
}
