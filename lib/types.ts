export type EventDirection = 'burden' | 'relief'; // הכבדה | הקלה
export type EventDuration = 'oneTime' | 'forever' | number;
export type EventPriority = 'unavoidable' | 'important' | 'desirable'; // בלתי נמנע | חשוב | רצוי

export interface LifeEvent {
  id: string;
  name: string;
  direction: EventDirection;
  startMonth: string; // ISO date string, first day of month
  duration: EventDuration;
  monthlyAmount: number; // used when duration !== oneTime
  totalAmount: number;   // used when duration === oneTime
  priority: EventPriority;
  fundingSource?: string;
}

export interface Budget {
  income: number;
  expenses: number;
  debtRepayment: number;
  debtRepaymentMonths: number; // 0 = permanent (no end date)
  bankBalance: number;
  startMonth: string; // ISO date string
}

export interface Plan {
  id: string;
  title: string;
  budget: Budget;
  events: LifeEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyResult {
  month: string; // ISO date
  label: string; // "ינואר 2025"
  monthlyBase: number;
  eventsImpact: number;
  monthlySurplus: number;
  cumulativeBalance: number;
  isOverrun: boolean;
  activeEvents: string[];
}

export interface TimelineResult {
  months: MonthlyResult[];
  overrunMonths: number;
  firstOverrunMonth: string | null;
  worstBalance: number;
}
