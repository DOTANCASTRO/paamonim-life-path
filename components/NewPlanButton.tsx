'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  large?: boolean;
}

export default function NewPlanButton({ large }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [open, setOpen] = useState(false);

  const [error, setError] = useState('');

  const create = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || 'תכנית חדשה' }),
      });
      const plan = await res.json();
      if (!res.ok || !plan.id) {
        setError(plan.error ?? 'שגיאה ביצירת תכנית');
        setLoading(false);
        return;
      }
      router.push(`/plan/${plan.id}`);
    } catch {
      setError('שגיאת רשת. נסה שוב.');
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 bg-[#0C4DA2] hover:bg-blue-800 text-white font-bold rounded-lg transition-colors ${
          large ? 'px-6 py-3 text-base' : 'px-4 py-2.5 text-sm'
        }`}
      >
        + תכנית חדשה
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setOpen(false); }}
        placeholder="שם התכנית"
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] w-44"
      />
      <button
        onClick={create}
        disabled={loading}
        className="bg-[#0C4DA2] hover:bg-blue-800 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        {loading ? '...' : 'צור'}
      </button>
      <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">
        ביטול
      </button>
    </div>
    </div>
  );
}
