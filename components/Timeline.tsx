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
  ReferenceArea,
} from 'recharts';
import { TimelineResult, LifeEvent } from '@/lib/types';
import { parseISO, addMonths, format } from 'date-fns';

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

// Simple text-only label for one-time events (no background box)
const PointLabel = ({ viewBox, names }: { viewBox?: any; names: string[] }) => {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  return (
    <g>
      <circle cx={x} cy={y + 10} r={3} fill="#0C4DA2" />
      {names.map((name, i) => (
        <text
          key={i}
          x={x + 6}
          y={y + 14 + i * 13}
          fontSize={10}
          fill="#0C4DA2"
          fontWeight="600"
          textAnchor="start"
        >
          {name.length > 16 ? name.slice(0, 15) + '…' : name}
        </text>
      ))}
    </g>
  );
};

// Label inside a ReferenceArea (duration events)
const AreaLabel = ({ viewBox, name, direction }: { viewBox?: any; name: string; direction: 'burden' | 'relief' }) => {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  const color = direction === 'burden' ? '#dc2626' : '#16a34a';
  const short = name.length > 16 ? name.slice(0, 15) + '…' : name;
  return (
    <text x={x + 4} y={y + 14} fontSize={10} fill={color} fontWeight="600" textAnchor="start">
      {short}
    </text>
  );
};

export default function Timeline({ result, events }: Props) {
  const chartData = result.months.map(m => ({ ...m }));
  const hasOverrun = result.overrunMonths > 0;
  const lastLabel = chartData[chartData.length - 1]?.label ?? '';

  // Separate events into one-time (point markers) and duration (area bands)
  const pointEvents = new Map<string, string[]>(); // monthLabel → names[]
  const durationEvents: { x1: string; x2: string; name: string; direction: 'burden' | 'relief' }[] = [];

  for (const e of events) {
    if (!e.name) continue;
    const startLabel = toHebrewLabel(e.startMonth);
    if (!chartData.find(m => m.label === startLabel)) continue;

    if (e.duration === 'oneTime') {
      if (!pointEvents.has(startLabel)) pointEvents.set(startLabel, []);
      pointEvents.get(startLabel)!.push(e.name);
    } else {
      let endLabel: string;
      if (e.duration === 'forever') {
        endLabel = lastLabel;
      } else {
        const endDate = addMonths(parseISO(e.startMonth), (e.duration as number) - 1);
        const candidate = toHebrewLabel(format(endDate, 'yyyy-MM-dd'));
        endLabel = chartData.find(m => m.label === candidate) ? candidate : lastLabel;
      }
      durationEvents.push({ x1: startLabel, x2: endLabel, name: e.name, direction: e.direction });
    }
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
        <LineChart data={chartData} margin={{ top: 40, right: 20, left: 20, bottom: 5 }}>
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

          {/* Duration bands — rendered before the line so line sits on top */}
          {durationEvents.map((ev, i) => (
            <ReferenceArea
              key={i}
              x1={ev.x1}
              x2={ev.x2}
              fill={ev.direction === 'burden' ? '#fee2e2' : '#dcfce7'}
              fillOpacity={0.5}
              stroke={ev.direction === 'burden' ? '#fca5a5' : '#86efac'}
              strokeWidth={1}
              label={<AreaLabel name={ev.name} direction={ev.direction} />}
            />
          ))}

          {/* Zero line */}
          <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />

          {/* One-time event markers */}
          {Array.from(pointEvents.entries()).map(([monthLabel, names]) => (
            <ReferenceLine
              key={monthLabel}
              x={monthLabel}
              stroke="#0C4DA2"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              label={<PointLabel names={names} />}
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

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded bg-red-100 border border-red-200" />
          <span>הכבדה (משך)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded bg-green-100 border border-green-200" />
          <span>הקלה (משך)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-3 bg-[#0C4DA2] opacity-60" style={{ borderLeft: '2px dashed #0C4DA2' }} />
          <span>אירוע חד-פעמי</span>
        </div>
      </div>

      {/* Year summary strip */}
      <div className="mt-3 grid grid-cols-10 gap-1">
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
