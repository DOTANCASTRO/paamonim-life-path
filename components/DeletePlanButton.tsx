'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  planId: string;
}

export default function DeletePlanButton({ planId }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm) { setConfirm(true); return; }
    setLoading(true);
    await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
    router.refresh();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirm(false);
  };

  if (confirm) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
        >
          {loading ? '...' : 'מחק'}
        </button>
        <span className="text-gray-300">|</span>
        <button onClick={handleCancel} className="text-xs text-gray-400 hover:text-gray-600">
          ביטול
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="text-gray-300 hover:text-red-400 transition-colors"
      title="מחק תכנית"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
