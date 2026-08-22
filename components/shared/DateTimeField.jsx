// components/shared/DateTimeField.jsx
//
// A modern date (or date-and-time) picker: a read-only field that opens a calendar popover instead
// of the browser's native date control (which looks inconsistent and dated across phones). Built on
// the app's existing libs - @headlessui/react Popover for the panel and date-fns for the month grid -
// so it adds NO new dependency. Contract: designguide/00-shared/shared-components.md.
//
// Value shape matches the old native inputs exactly, so nothing downstream changes:
//   - date only:      'yyyy-MM-dd'         (e.g. '2026-08-29')
//   - date and time:  "yyyy-MM-dd'T'HH:mm" (e.g. '2026-08-29T14:00')
// Time is entered as hour + minute selects with AM/PM pills; the calendar shows a teal selected day
// and a teal ring on today.

'use client';

import React, { useMemo, useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { FaRegCalendarAlt, FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import {
  format, parseISO, isValid,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isSameMonth, addMonths, subMonths,
  setHours, setMinutes, getHours, getMinutes,
} from 'date-fns';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);          // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);         // 0,5,...,55

const parseValue = (value) => {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
};

const SELECT_CLASS =
  'rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300';

export default function DateTimeField({ value, includeTime = false, onChange, ariaLabel }) {
  const selected = parseValue(value);
  const [viewMonth, setViewMonth] = useState(selected || new Date());
  const today = new Date();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const displayText = selected
    ? format(selected, includeTime ? 'd MMM yyyy, h:mm a' : 'd MMM yyyy')
    : includeTime ? 'Pick a date and time' : 'Pick a date';

  const emit = (dateObj) =>
    onChange(format(dateObj, includeTime ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd'));

  // Picking a day keeps any time already chosen; if none yet and time is asked, default to 9:00 AM.
  const pickDay = (day) => {
    if (!includeTime) { emit(day); return; }
    const base = selected || setMinutes(setHours(day, 9), 0);
    emit(setMinutes(setHours(day, getHours(base)), getMinutes(base)));
  };

  // Time controls derive from the selected value; if a time is set before a day, anchor it to today.
  const hour12 = selected ? ((getHours(selected) + 11) % 12) + 1 : 9;
  const minute = selected ? getMinutes(selected) : 0;
  const meridiem = selected && getHours(selected) >= 12 ? 'PM' : 'AM';
  const to24 = (h12, mer) => (mer === 'PM' ? (h12 % 12) + 12 : h12 % 12);
  const applyTime = (h24, m) => emit(setMinutes(setHours(selected || today, h24), m));

  const maxW = includeTime ? 'max-w-[260px]' : 'max-w-[200px]';

  return (
    <Popover className={`relative ${maxW}`}>
      <PopoverButton
        aria-label={ariaLabel}
        className={`w-full flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-left hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 ${selected ? 'text-slate-700' : 'text-slate-400'}`}
      >
        <FaRegCalendarAlt className="h-4 w-4 shrink-0 text-slate-500" />
        <span className="min-w-0 flex-1 truncate">{displayText}</span>
        <FaChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
      </PopoverButton>

      {/* Portalled + auto-flipping panel (headless UI v2 anchor), so near the bottom of a scrolled
          page it opens upward instead of behind the fixed action bar. z-50 sits above that bar. */}
      <PopoverPanel
        data-testid="datetime-popover"
        anchor={{ to: 'bottom start', gap: 6, padding: 16 }}
        className="z-50 w-[300px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg focus:outline-none"
      >
        {({ close }) => (
          <>
            {/* Month header */}
            <div className="mb-2 flex items-center justify-between">
              <button type="button" aria-label="Previous month" onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <FaChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-slate-900">{format(viewMonth, 'MMMM yyyy')}</span>
              <button type="button" aria-label="Next month" onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <FaChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday header */}
            <div className="mb-1 grid grid-cols-7">
              {WEEKDAYS.map((d, i) => (
                <span key={i} className="py-1 text-center text-xs text-slate-400">{d}</span>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day) => {
                const inMonth = isSameMonth(day, viewMonth);
                const isSel = selected && isSameDay(day, selected);
                const isToday = isSameDay(day, today);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => pickDay(day)}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                      isSel
                        ? 'bg-teal-700 font-semibold text-white'
                        : isToday
                          ? 'text-slate-700 ring-1 ring-teal-500'
                          : inMonth
                            ? 'text-slate-700 hover:bg-slate-100'
                            : 'text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Time row (only when the question asks for a time) */}
            {includeTime && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <span className="text-sm text-slate-600">Time</span>
                <div className="flex items-center gap-1">
                  <select aria-label="Hour" value={hour12} onChange={(e) => applyTime(to24(Number(e.target.value), meridiem), minute)} className={SELECT_CLASS}>
                    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-slate-500">:</span>
                  <select aria-label="Minute" value={minute} onChange={(e) => applyTime(to24(hour12, meridiem), Number(e.target.value))} className={SELECT_CLASS}>
                    {MINUTES.map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                  </select>
                </div>
                <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
                  {['AM', 'PM'].map((mer) => (
                    <button
                      key={mer}
                      type="button"
                      onClick={() => applyTime(to24(hour12, mer), minute)}
                      className={`px-2.5 py-1 text-xs font-medium ${meridiem === mer ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      {mer}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
              <button type="button" onClick={() => { onChange(''); }} className="text-sm text-slate-500 hover:text-slate-700">Clear</button>
              <button type="button" onClick={() => close()} className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-800">Done</button>
            </div>
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}
