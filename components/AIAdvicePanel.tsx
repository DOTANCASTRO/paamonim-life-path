'use client';

import { useState } from 'react';
import { Budget, LifeEvent, TimelineResult } from '@/lib/types';

interface Props {
  budget: Budget;
  events: LifeEvent[];
  result: TimelineResult;
}

export default function AIAdvicePanel({ budget, events, result }: Props) {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getAdvice = async () => {
    setLoading(true);
    setError('');
    setAdvice('');
    try {
      const res = await fetch('/api/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget, events, result }),
      });
      if (!res.ok) throw new Error('שגיאה');
      const data = await res.json();
      setAdvice(data.advice);
    } catch {
      setError('לא ניתן לקבל המלצות כרגע. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const hasOverrun = result.overrunMonths > 0;

  return (
    <div className={`rounded-xl border p-6 ${hasOverrun ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">מה אפשר לעשות?</h2>
          {hasOverrun && (
            <p className="text-sm text-gray-500 mt-0.5">
              זוהו {result.overrunMonths} חודשי חריגה — קבל המלצות מותאמות אישית
            </p>
          )}
          {!hasOverrun && (
            <p className="text-sm text-gray-500 mt-0.5">
              אין חריגה! תוכל לקבל טיפים לאופטימיזציה
            </p>
          )}
        </div>
        <button
          onClick={getAdvice}
          disabled={loading}
          className="flex items-center gap-2 bg-[#0C4DA2] hover:bg-blue-800 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              מחשב...
            </>
          ) : (
            <>✨ מה אפשר לעשות?</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
      )}

      {advice && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-3">
          <div className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {advice}
          </div>
        </div>
      )}
    </div>
  );
}
