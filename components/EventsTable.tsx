'use client';

import { LifeEvent, EventDirection, EventPriority } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfMonth } from 'date-fns';
import { useState } from 'react';

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

const PRIORITY_OPTIONS: { value: EventPriority; label: string; color: string }[] = [
  { value: 'unavoidable', label: 'בלתי נמנע', color: 'text-red-600 bg-red-50' },
  { value: 'important',   label: 'חשוב',      color: 'text-amber-600 bg-amber-50' },
  { value: 'desirable',   label: 'רצוי',       color: 'text-blue-600 bg-blue-50' },
];

const DURATION_OPTIONS = [
  { value: 'oneTime',  label: 'חד-פעמי' },
  { value: 'forever',  label: 'לתמיד' },
  ...Array.from({ length: 118 }, (_, i) => ({ value: String(i + 2), label: `${i + 2} חודשים` })),
];

function generateMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 120; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    options.push({ value: format(d, 'yyyy-MM-dd'), label: `${MONTHS_HE[d.getMonth()]} ${d.getFullYear()}` });
  }
  return options;
}

const monthOptions = generateMonthOptions();

function emptyEvent(): LifeEvent {
  return {
    id: uuidv4(),
    name: '',
    direction: 'burden',
    startMonth: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    duration: 'oneTime',
    monthlyAmount: 0,
    totalAmount: 0,
    priority: 'important',
    fundingSource: '',
  };
}

interface RowProps {
  event: LifeEvent;
  index: number;
  onChange: (e: LifeEvent) => void;
  onDelete: () => void;
}

function EventRow({ event, index, onChange, onDelete }: RowProps) {
  const isOneTime = event.duration === 'oneTime';
  const isForever = event.duration === 'forever';
  const priorityInfo = PRIORITY_OPTIONS.find(p => p.value === event.priority)!;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-2 py-2 text-center text-xs text-gray-400">{index + 1}</td>

      {/* Event name */}
      <td className="px-2 py-2">
        <input
          type="text"
          value={event.name}
          onChange={e => onChange({ ...event, name: e.target.value })}
          placeholder="שם האירוע"
          className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </td>

      {/* Direction */}
      <td className="px-2 py-2">
        <select
          value={event.direction}
          onChange={e => onChange({ ...event, direction: e.target.value as EventDirection })}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="burden">הכבדה ▼</option>
          <option value="relief">הקלה ▲</option>
        </select>
      </td>

      {/* Start month */}
      <td className="px-2 py-2">
        <select
          value={event.startMonth}
          onChange={e => onChange({ ...event, startMonth: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>

      {/* Duration */}
      <td className="px-2 py-2">
        <select
          value={String(event.duration)}
          onChange={e => {
            const val = e.target.value;
            const dur = val === 'oneTime' || val === 'forever' ? val : parseInt(val);
            onChange({ ...event, duration: dur });
          }}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>

      {/* Amount */}
      <td className="px-2 py-2">
        {isOneTime ? (
          <input
            type="number"
            min="0"
            value={event.totalAmount || ''}
            onChange={e => onChange({ ...event, totalAmount: parseFloat(e.target.value) || 0 })}
            placeholder="₪ סה״כ"
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 text-left focus:outline-none focus:ring-1 focus:ring-blue-400"
            dir="ltr"
          />
        ) : isForever ? (
          <input
            type="number"
            min="0"
            value={event.monthlyAmount || ''}
            onChange={e => onChange({ ...event, monthlyAmount: parseFloat(e.target.value) || 0 })}
            placeholder="₪ לחודש"
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 text-left focus:outline-none focus:ring-1 focus:ring-blue-400"
            dir="ltr"
          />
        ) : (
          <div className="space-y-1">
            <input
              type="number"
              min="0"
              value={event.monthlyAmount || ''}
              onChange={e => onChange({ ...event, monthlyAmount: parseFloat(e.target.value) || 0 })}
              placeholder="₪/חודש"
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-left focus:outline-none focus:ring-1 focus:ring-blue-400"
              dir="ltr"
            />
            <div className="text-xs text-gray-400 text-center">
              סה״כ: ₪{((event.monthlyAmount || 0) * (typeof event.duration === 'number' ? event.duration : 0)).toLocaleString()}
            </div>
          </div>
        )}
      </td>

      {/* Priority */}
      <td className="px-2 py-2">
        <select
          value={event.priority}
          onChange={e => onChange({ ...event, priority: e.target.value as EventPriority })}
          className={`w-full text-xs border border-gray-200 rounded px-2 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 ${priorityInfo.color}`}
        >
          {PRIORITY_OPTIONS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </td>

      {/* Funding source */}
      <td className="px-2 py-2">
        <input
          type="text"
          value={event.fundingSource || ''}
          onChange={e => onChange({ ...event, fundingSource: e.target.value })}
          placeholder="אופציונלי"
          className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </td>

      {/* Delete */}
      <td className="px-2 py-2 text-center">
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
          title="מחק אירוע"
        >
          ×
        </button>
      </td>
    </tr>
  );
}

interface Props {
  events: LifeEvent[];
  onChange: (events: LifeEvent[]) => void;
}

export default function EventsTable({ events, onChange }: Props) {
  const addEvent = () => {
    if (events.length >= 90) return;
    onChange([...events, emptyEvent()]);
  };

  const updateEvent = (index: number, updated: LifeEvent) => {
    const next = [...events];
    next[index] = updated;
    onChange(next);
  };

  const deleteEvent = (index: number) => {
    onChange(events.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">אירועי חיים</h2>
        <span className="text-sm text-gray-400">{events.length} / 90</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead>
            <tr className="border-b-2 border-gray-200 text-xs text-gray-500 font-semibold">
              <th className="px-2 py-2 text-center w-8">#</th>
              <th className="px-2 py-2 text-right">אירוע</th>
              <th className="px-2 py-2 text-right w-28">סוג</th>
              <th className="px-2 py-2 text-right w-36">חודש התחלה</th>
              <th className="px-2 py-2 text-right w-32">משך</th>
              <th className="px-2 py-2 text-right w-32">סכום</th>
              <th className="px-2 py-2 text-right w-28">עדיפות</th>
              <th className="px-2 py-2 text-right w-28">מקור מימון</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => (
              <EventRow
                key={event.id}
                event={event}
                index={i}
                onChange={updated => updateEvent(i, updated)}
                onDelete={() => deleteEvent(i)}
              />
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">
                  אין אירועים עדיין. לחץ על "הוסף אירוע" להתחיל.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {events.length < 90 && (
        <button
          onClick={addEvent}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-[#0C4DA2] hover:text-blue-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span> הוסף אירוע
        </button>
      )}
    </div>
  );
}
