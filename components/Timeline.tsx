'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { TimelineResult } from '@/lib/types';

interface Props {
  result: TimelineResult;
}

function formatShekel(value: number) {
  if (Math.abs(value) >= 1000000) return `₪${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `₪${(value / 1000).toFixed(0)}K`;
  return `₪${value.toLocaleString()}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm" dir="rtl">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <p className={`font-bold ${data?.cumulativeBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        יתרה: ₪{data?.cumulativeBalance?.toLocaleString()}
      </p>
      <p className="text-gray-500 text-xs">עודף חודשי: ₪{data?.monthlySurplus?.toLocaleString()}</p>
      {data?.activeEvents?.length > 0 && (
        <div className="mt-1 border-t border-gray-100 pt-1">
          <p className="text-xs text-gray-400">אירועים פעילים:</p>
          {data.activeEvents.map((e: string) => (
            <p key={e} className="text-xs text-gray-600">• {e}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Timeline({ result }: Props) {
  // Show every 3rd month label to avoid crowding
  const chartData = result.months.map((m, i) => ({
    ...m,
    shortLabel: i % 6 === 0 ? m.label.replace(' ', '\n') : '',
  }));

  const hasOverrun = result.overrunMonths > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800">מסלול החיים — 10 שנים</h2>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          hasOverrun ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {hasOverrun ? (
            <>{result.overrunMonths} חודשי חריגה — {result.firstOverrunMonth}</>
          ) : (
            <>אין חריגה — כל הכבוד!</>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={(val, i) => (i % 6 === 0 ? val.split(' ')[1] || val : '')}
            interval={0}
          />
          <YAxis
            tickFormatter={formatShekel}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="cumulativeBalance"
            stroke="#0C4DA2"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#0C4DA2' }}
            name="יתרה מצטברת"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Year summary strip */}
      <div className="mt-4 grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, yearIdx) => {
          const yearMonths = result.months.slice(yearIdx * 12, yearIdx * 12 + 12);
          const overruns = yearMonths.filter(m => m.isOverrun).length;
          const endBalance = yearMonths[yearMonths.length - 1]?.cumulativeBalance ?? 0;
          const startYear = yearMonths[0]?.label?.split(' ')[1] ?? '';
          return (
            <div
              key={yearIdx}
              className={`rounded p-2 text-center text-xs ${
                overruns > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
              }`}
            >
              <div className="font-semibold text-gray-600">{startYear}</div>
              {overruns > 0 ? (
                <div className="text-red-600 font-bold">{overruns} ⚠</div>
              ) : (
                <div className="text-green-600">✓</div>
              )}
              <div className={`font-medium text-xs mt-0.5 ${endBalance >= 0 ? 'text-gray-600' : 'text-red-600'}`}>
                {formatShekel(endBalance)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
