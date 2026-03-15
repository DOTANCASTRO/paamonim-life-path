'use client';

import { Budget } from '@/lib/types';
import { format } from 'date-fns';

interface Props {
  budget: Budget;
  onChange: (budget: Budget) => void;
}

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

function generateMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 120; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = format(d, 'yyyy-MM-dd');
    const label = `${MONTHS_HE[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value, label });
  }
  return options;
}

const monthOptions = generateMonthOptions();

function NumberInput({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₪</span>
        <input
          type="number"
          min="0"
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-300 rounded-lg pr-8 pl-3 py-2.5 text-left text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0"
          dir="ltr"
        />
      </div>
    </div>
  );
}

export default function BudgetSetup({ budget, onChange }: Props) {
  const monthly = budget.income - budget.expenses - budget.debtRepayment;
  const isPositive = monthly >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">תקציב חודשי בסיסי</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <NumberInput
          label="הכנסות חודשיות"
          value={budget.income}
          onChange={v => onChange({ ...budget, income: v })}
        />
        <NumberInput
          label="הוצאות חודשיות"
          value={budget.expenses}
          onChange={v => onChange({ ...budget, expenses: v })}
        />
        <NumberInput
          label="החזר חובות חודשי"
          value={budget.debtRepayment}
          onChange={v => onChange({ ...budget, debtRepayment: v })}
        />
        <NumberInput
          label="יתרה בבנק כיום"
          value={budget.bankBalance}
          hint="נקודת ההתחלה של הסימולציה"
          onChange={v => onChange({ ...budget, bankBalance: v })}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">חודש התחלה</label>
        <select
          value={budget.startMonth}
          onChange={e => onChange({ ...budget, startMonth: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {monthOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className={`rounded-lg p-3 ${isPositive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">עודף / גרעון חודשי בסיסי</span>
          <span className={`text-lg font-bold ${isPositive ? 'text-green-700' : 'text-red-600'}`}>
            ₪{monthly.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
