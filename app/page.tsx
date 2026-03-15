'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');

  const createPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || 'תכנית חדשה' }),
      });
      const plan = await res.json();
      router.push(`/plan/${plan.id}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
            <svg className="w-10 h-10 text-[#0C4DA2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">מסלול החיים</h1>
          <p className="text-gray-500 mb-8 text-base leading-relaxed">
            תכנן את העתיד הכלכלי שלך.<br />
            הזן אירועי חיים צפויים וראה איך הם משפיעים על התקציב לאורך 10 שנים.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 p-6 text-right">
            <label className="block text-sm font-medium text-gray-700 mb-2">שם התכנית</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="למשל: משפחת כהן 2025"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:border-transparent mb-4"
              onKeyDown={e => e.key === 'Enter' && createPlan()}
            />
            <button
              onClick={createPlan}
              disabled={loading}
              className="w-full bg-[#0C4DA2] hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-lg transition-colors text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  יוצר תכנית...
                </>
              ) : (
                <>צור תכנית חדשה →</>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            התכנית נשמרת אוטומטית — שמור את הקישור לחזור אליה בכל עת
          </p>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-200">
        כלי זה פותח על ידי פעמונים | Castro Lab
      </footer>
    </div>
  );
}
