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
} from 'recharts';
import { TimelineResult, LifeEvent } from '@/lib/types';
import { parseISO, format } from 'date-fns';

const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

function toHebrewLabel(isoDate: string) {
  const d = parseISO(isoDate);
  return `${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface Props {
  result: TimelineResult;
  events: LifeEvent[];
}

function formatShekel(value: number) {
  if (Math.abs(value) >= 1000000) return `₪${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `₪${(value / 1000).toFixed(0)}K`;
  return `₪${value.toLocaleString()}`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm" dir="rtl">
      <p className="font-semibold text-gray-800 mb-1">{data?.label}</p>
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

// Custom label rendered above the reference line
const EventLabel = ({ viewBox, names }: { viewBox?: { x: number; y: number; height: number }; names: string[] }) => {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  const lineHeight = 13;
  const padding = 4;
  const maxWidth = 110;
  // Truncate long names
  const labels = names.map(n => n.length > 14 ? n.slice(0, 13) + '…' : n);

  return (
    <g>
      <rect
        x={x + 4}
        y={y + 4}
        width={maxWidth}
        height={labels.length * lineHeight + padding * 2}
        rx={3}
        fill="white"
        stroke="#d1d5db"
        strokeWidth={1}
        opacity={0.95}
      />
      {labels.map((name, i) => (
        <text
          key={i}
          x={x + 8}
          y={y + 4 + padding + (i + 1) * lineHeight - 2}
          fontSize={10}
          fill="#374151"
          textAnchor="start"
        >
          {name}
        </text>
      ))}
    </g>
  );
};

export default function Timeline({ result, events }: Props) {
  const chartData = result.months.map(m => ({ ...m }));
  const hasOverrun = result.overrunMonths > 0;

  // Group named events by their start month label
  const eventsByMonth = new Map<string, string[]>();
  for (const e of events) {
    if (!e.name) continue;
    const label = toHebrewLabel(e.startMonth);
    // Only show if this month exists in the chart data
    if (!chartData.find(m => m.label === label)) continue;
    if (!eventsByMonth.has(label)) eventsByMonth.set(label, []);
    eventsByMonth.get(label)!.push(e.name);
  }

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
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 60, right: 20, left: 20, bottom: 5 }}>
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

          {/* Zero line */}
          <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />

          {/* Event start markers */}
          {Array.from(eventsByMonth.entries()).map(([monthLabel, names]) => (
            <ReferenceLine
              key={monthLabel}
              x={monthLabel}
              stroke="#0C4DA2"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              label={<EventLabel names={names} />}
            />
          ))}

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
