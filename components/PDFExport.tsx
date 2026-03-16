'use client';

import { Plan, TimelineResult } from '@/lib/types';
import { useState } from 'react';

interface Props {
  plan: Plan;
  result: TimelineResult;
}

const PRIORITY_LABELS: Record<string, string> = {
  unavoidable: 'בלתי נמנע',
  important: 'חשוב',
  desirable: 'רצוי',
};

const DIRECTION_LABELS: Record<string, string> = {
  burden: 'הכבדה',
  relief: 'הקלה',
};

function formatDuration(d: string | number): string {
  if (d === 'oneTime') return 'חד-פעמי';
  if (d === 'forever') return 'לתמיד';
  return `${d} חודשים`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function PDFExport({ plan, result }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    const yearSummaries = Array.from({ length: 10 }, (_, yearIdx) => {
      const yearMonths = result.months.slice(yearIdx * 12, yearIdx * 12 + 12);
      const overruns = yearMonths.filter(m => m.isOverrun).length;
      const endBalance = yearMonths[yearMonths.length - 1]?.cumulativeBalance ?? 0;
      const year = yearMonths[0]?.label?.split(' ')[1] ?? String(new Date().getFullYear() + yearIdx);
      return { year, overruns, endBalance };
    });

    const eventsRows = plan.events.map((e, i) => [
      `<tr>`,
      `<td>${i + 1}</td>`,
      `<td>${escapeHtml(e.name)}</td>`,
      `<td>${DIRECTION_LABELS[e.direction]}</td>`,
      `<td>${e.startMonth.slice(0, 7)}</td>`,
      `<td>${escapeHtml(formatDuration(e.duration))}</td>`,
      `<td>₪${e.duration === 'oneTime' ? e.totalAmount.toLocaleString() : `${e.monthlyAmount.toLocaleString()}/חודש`}</td>`,
      `<td>${PRIORITY_LABELS[e.priority]}</td>`,
      `</tr>`,
    ].join('')).join('');

    const yearRows = yearSummaries.map(y => [
      `<tr style="background:${y.overruns > 0 ? '#fef2f2' : '#f0fdf4'}">`,
      `<td>${escapeHtml(y.year)}</td>`,
      `<td style="color:${y.overruns > 0 ? '#dc2626' : '#16a34a'}">${y.overruns > 0 ? `${y.overruns} חודשי חריגה` : 'ללא חריגה'}</td>`,
      `<td style="color:${y.endBalance >= 0 ? '#374151' : '#dc2626'}">₪${y.endBalance.toLocaleString()}</td>`,
      `</tr>`,
    ].join('')).join('');

    const html = [
      '<!DOCTYPE html>',
      '<html dir="rtl" lang="he">',
      '<head>',
      '<meta charset="UTF-8">',
      `<title>מסלול החיים — ${escapeHtml(plan.title)}</title>`,
      '<style>',
      `@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&display=swap');`,
      'body{font-family:Heebo,Arial,sans-serif;direction:rtl;color:#1f2937;padding:24px;font-size:13px}',
      'h1{color:#0C4DA2;font-size:22px;margin-bottom:4px}',
      'h2{color:#0C4DA2;font-size:15px;margin:20px 0 8px;border-bottom:2px solid #e5e7eb;padding-bottom:4px}',
      '.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:3px solid #0C4DA2;padding-bottom:12px}',
      '.logo{font-size:20px;font-weight:700;color:#0C4DA2}',
      '.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}',
      '.card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center}',
      '.card .lbl{font-size:11px;color:#6b7280}',
      '.card .val{font-size:18px;font-weight:700;color:#1f2937}',
      '.status{text-align:center;padding:10px;border-radius:8px;margin-bottom:16px;font-size:15px;font-weight:700}',
      '.ok{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}',
      '.overrun{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}',
      'table{width:100%;border-collapse:collapse;font-size:12px}',
      'th{background:#0C4DA2;color:white;padding:6px 8px;text-align:right;font-weight:600}',
      'td{padding:5px 8px;border-bottom:1px solid #f3f4f6}',
      '.footer{margin-top:30px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px}',
      '</style>',
      '</head>',
      '<body>',
      '<div class="header">',
      `<div><div class="logo">פעמונים</div><h1>מסלול החיים — ${escapeHtml(plan.title)}</h1><div style="font-size:11px;color:#6b7280">הופק: ${new Date().toLocaleDateString('he-IL')}</div></div>`,
      '<div style="font-size:11px;color:#9ca3af">Castro Lab</div>',
      '</div>',
      `<div class="status ${result.overrunMonths > 0 ? 'overrun' : 'ok'}">${result.overrunMonths > 0 ? `⚠ ${result.overrunMonths} חודשי חריגה — חריגה ראשונה: ${result.firstOverrunMonth}` : '✓ אין חריגה — כל הכבוד!'}</div>`,
      '<h2>תקציב בסיסי</h2>',
      '<div class="summary-grid">',
      `<div class="card"><div class="lbl">הכנסות</div><div class="val">₪${plan.budget.income.toLocaleString()}</div></div>`,
      `<div class="card"><div class="lbl">הוצאות</div><div class="val">₪${plan.budget.expenses.toLocaleString()}</div></div>`,
      `<div class="card"><div class="lbl">החזר חובות${plan.budget.debtRepaymentMonths > 0 ? `<br><span style="font-size:10px;color:#6b7280">${plan.budget.debtRepaymentMonths} חודשים</span>` : ''}</div><div class="val">₪${plan.budget.debtRepayment.toLocaleString()}</div></div>`,
      `<div class="card"><div class="lbl">יתרה בבנק</div><div class="val">₪${plan.budget.bankBalance.toLocaleString()}</div></div>`,
      '</div>',
      '<h2>סיכום שנתי</h2>',
      '<table><thead><tr><th>שנה</th><th>מצב</th><th>יתרה סוף שנה</th></tr></thead>',
      `<tbody>${yearRows}</tbody></table>`,
      `<h2>אירועי חיים (${plan.events.length})</h2>`,
      '<table><thead><tr><th>#</th><th>אירוע</th><th>סוג</th><th>התחלה</th><th>משך</th><th>סכום</th><th>עדיפות</th></tr></thead>',
      `<tbody>${eventsRows}</tbody></table>`,
      plan.notes ? [
        '<h2>הערות</h2>',
        `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:13px;white-space:pre-wrap;line-height:1.6">${escapeHtml(plan.notes)}</div>`,
      ].join('') : '',
      `<div class="footer">כלי זה פותח על ידי פעמונים | Castro Lab | ${new Date().getFullYear()}</div>`,
      '</body></html>',
    ].join('');

    const filename = `מסלול החיים - ${plan.title}.pdf`;
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-medium px-4 py-2.5 rounded-lg border border-gray-300 transition-colors text-sm"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          מכין...
        </>
      ) : (
        <>📄 הורד PDF</>
      )}
    </button>
  );
}
