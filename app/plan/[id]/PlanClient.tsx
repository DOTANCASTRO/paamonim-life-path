'use client';

import { useState, useCallback, useRef } from 'react';
import { Plan, Budget, LifeEvent, TimelineResult } from '@/lib/types';
import { calculateTimeline } from '@/lib/calculator';
import BudgetSetup from '@/components/BudgetSetup';
import EventsTable from '@/components/EventsTable';
import Timeline from '@/components/Timeline';
import AIAdvicePanel from '@/components/AIAdvicePanel';
import PDFExport from '@/components/PDFExport';
import { format, startOfMonth } from 'date-fns';

interface Props {
  initialPlan: Plan;
}

const SAVE_DELAY = 1500;

const emptyBudget = (): Budget => ({
  income: 0,
  expenses: 0,
  debtRepayment: 0,
  bankBalance: 0,
  startMonth: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
});

export default function PlanClient({ initialPlan }: Props) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [result, setResult] = useState<TimelineResult>(() =>
    calculateTimeline(initialPlan.budget, initialPlan.events)
  );
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [copied, setCopied] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const update = useCallback((newBudget: Budget, newEvents: LifeEvent[]) => {
    const newResult = calculateTimeline(newBudget, newEvents);
    setResult(newResult);
    setSaveStatus('unsaved');

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await fetch(`/api/plans/${plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budget: newBudget, events: newEvents }),
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
      }
    }, SAVE_DELAY);
  }, [plan.id]);

  const updateBudget = (budget: Budget) => {
    setPlan(p => ({ ...p, budget }));
    update(budget, plan.events);
  };

  const updateEvents = (events: LifeEvent[]) => {
    setPlan(p => ({ ...p, events }));
    update(plan.budget, events);
  };

  const saveTitle = async (title: string) => {
    setPlan(p => ({ ...p, title }));
    setEditingTitle(false);
    await fetch(`/api/plans/${plan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    const budget = emptyBudget();
    setPlan(p => ({ ...p, budget, events: [] }));
    update(budget, []);
    setConfirmReset(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {editingTitle ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement).querySelector('input') as HTMLInputElement;
                saveTitle(input.value.trim() || 'תכנית חדשה');
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                defaultValue={plan.title}
                className="border border-blue-400 rounded px-2 py-1 text-sm font-semibold focus:outline-none"
                onBlur={e => saveTitle(e.target.value.trim() || 'תכנית חדשה')}
              />
            </form>
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-base font-bold text-gray-800 hover:text-[#0C4DA2] transition-colors"
              title="לחץ לעריכת שם"
            >
              {plan.title}
            </button>
          )}

          <span className={`text-xs px-2 py-0.5 rounded-full ${
            saveStatus === 'saved' ? 'bg-green-100 text-green-600' :
            saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-600' :
            'bg-gray-100 text-gray-500'
          }`}>
            {saveStatus === 'saved' ? 'שמור' : saveStatus === 'saving' ? 'שומר...' : 'לא שמור'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${
              confirmReset
                ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                : 'bg-white border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-300'
            }`}
            title="איפוס תכנית"
          >
            {confirmReset ? '⚠ לחץ שוב לאישור' : '↺ איפוס'}
          </button>
          <PDFExport plan={plan} result={result} />
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-[#0C4DA2] hover:bg-blue-800 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
          >
            {copied ? '✓ הועתק!' : '🔗 שתף תכנית'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <BudgetSetup budget={plan.budget} onChange={updateBudget} />
        <EventsTable events={plan.events} onChange={updateEvents} />
        <Timeline result={result} events={plan.events} />
        <AIAdvicePanel budget={plan.budget} events={plan.events} result={result} />
      </div>
    </div>
  );
}
