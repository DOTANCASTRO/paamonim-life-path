import { Budget, LifeEvent } from './types';

const MAX_AMOUNT = 9_999_999;
const MAX_TITLE_LEN = 120;
const MAX_EVENT_NAME_LEN = 100;
const MAX_EVENTS = 90;
const VALID_DIRECTIONS = ['burden', 'relief'];
const VALID_PRIORITIES = ['unavoidable', 'important', 'desirable'];

function isFinitePositive(v: unknown): boolean {
  return typeof v === 'number' && isFinite(v) && v >= 0 && v <= MAX_AMOUNT;
}

export function validateBudget(b: unknown): Budget {
  if (!b || typeof b !== 'object') throw new Error('Invalid budget');
  const budget = b as Record<string, unknown>;

  const income = Number(budget.income ?? 0);
  const expenses = Number(budget.expenses ?? 0);
  const debtRepayment = Number(budget.debtRepayment ?? 0);
  const debtRepaymentMonths = Math.floor(Number(budget.debtRepaymentMonths ?? 0));
  const bankBalance = Number(budget.bankBalance ?? 0);

  if (!isFinitePositive(income)) throw new Error('Invalid income');
  if (!isFinitePositive(expenses)) throw new Error('Invalid expenses');
  if (!isFinitePositive(debtRepayment)) throw new Error('Invalid debtRepayment');
  if (!Number.isInteger(debtRepaymentMonths) || debtRepaymentMonths < 0 || debtRepaymentMonths > 1200) {
    throw new Error('Invalid debtRepaymentMonths');
  }
  if (typeof bankBalance !== 'number' || !isFinite(bankBalance) || Math.abs(bankBalance) > MAX_AMOUNT) {
    throw new Error('Invalid bankBalance');
  }

  const startMonth = String(budget.startMonth ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startMonth)) throw new Error('Invalid startMonth');

  return { income, expenses, debtRepayment, debtRepaymentMonths, bankBalance, startMonth };
}

export function sanitizeString(s: unknown, maxLen: number): string {
  if (typeof s !== 'string') return '';
  // Strip control characters and trim
  return s.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

export function validateEvents(events: unknown): LifeEvent[] {
  if (!Array.isArray(events)) throw new Error('Events must be an array');
  if (events.length > MAX_EVENTS) throw new Error(`Max ${MAX_EVENTS} events`);

  return events.map((e, i) => {
    if (!e || typeof e !== 'object') throw new Error(`Event ${i} invalid`);
    const ev = e as Record<string, unknown>;

    const name = sanitizeString(ev.name, MAX_EVENT_NAME_LEN);
    const direction = String(ev.direction ?? '');
    if (!VALID_DIRECTIONS.includes(direction)) throw new Error(`Event ${i}: invalid direction`);

    const priority = String(ev.priority ?? '');
    if (!VALID_PRIORITIES.includes(priority)) throw new Error(`Event ${i}: invalid priority`);

    const startMonth = String(ev.startMonth ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startMonth)) throw new Error(`Event ${i}: invalid startMonth`);

    const rawDuration = ev.duration;
    let duration: 'oneTime' | 'forever' | number;
    if (rawDuration === 'oneTime') duration = 'oneTime';
    else if (rawDuration === 'forever') duration = 'forever';
    else {
      const d = Number(rawDuration);
      if (!Number.isInteger(d) || d < 2 || d > 998) throw new Error(`Event ${i}: invalid duration`);
      duration = d;
    }

    const monthlyAmount = Math.max(0, Math.min(MAX_AMOUNT, Number(ev.monthlyAmount ?? 0)));
    const totalAmount = Math.max(0, Math.min(MAX_AMOUNT, Number(ev.totalAmount ?? 0)));
    const fundingSource = sanitizeString(ev.fundingSource, 200);
    const id = sanitizeString(ev.id, 36);

    return { id, name, direction, priority, startMonth, duration, monthlyAmount, totalAmount, fundingSource } as LifeEvent;
  });
}

export function validateTitle(title: unknown): string {
  return sanitizeString(title, MAX_TITLE_LEN) || 'תכנית חדשה';
}

export function validateNotes(notes: unknown): string {
  return sanitizeString(notes, 2000);
}
