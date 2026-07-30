'use client';

// Full-screen one-canvas hall designer (featureplans/events-seatbuilder-redesign.md).
// An OVERLAY mounted inside the wizard step (no route change): Cancel/Save drop back to the exact
// wizard state. Generate the skeleton by numbers, then shape visually on a single zoomable canvas
// that shares the attendee map's colour vocabulary. Edits only walkwayPositions + organizerReservedSeats.
import { useEffect, useMemo, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MdEventSeat } from 'react-icons/md';
import SeatLegend from '@/components/events/seats/SeatLegend';
import { nextRowLabel, parseReservedLabels, formatReservedLabels } from '@/utils/events/seatBuilder';

// Seat numbers are hidden at fitted view (clean dots) and appear once zoomed past this scale.
const NUMBER_THRESHOLD = 1.6;

const makeSeats = (count) =>
  Array.from({ length: count }, (_, i) => ({ seatNumber: i + 1, status: 'available' }));

// Same colour language as the attendee map (SeatButton): available teal, reserved PURPLE, booked red.
const seatClass = (status) => {
  if (status === 'booked') return 'bg-red-500 text-white border-red-600 cursor-not-allowed';
  if (status === 'reserved') return 'bg-purple-600 text-white border-purple-700';
  return 'bg-teal-50 text-teal-700 border-teal-400 hover:bg-teal-100 cursor-pointer';
};

export default function SeatBuilderOverlay({
  initialLayout, initialReserved, capacity, isEditMode = false, originalRowCount = 0, onSave, onClose,
}) {
  const [rows, setRows] = useState(() => JSON.parse(JSON.stringify(initialLayout || [])));
  const [reserved, setReserved] = useState(initialReserved || '');
  const [scale, setScale] = useState(1);
  const [genRows, setGenRows] = useState(10);
  const [genSeats, setGenSeats] = useState(40);
  const [aisleSeat, setAisleSeat] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const reservedSet = useMemo(() => parseReservedLabels(reserved), [reserved]);
  const totalSeats = rows.reduce((t, r) => t + (r.seats?.length || 0), 0);
  const cap = Number(capacity) || 0;
  const matches = cap > 0 && totalSeats === cap;
  const showNumbers = scale >= NUMBER_THRESHOLD;
  const canGenerate = originalRowCount === 0; // protect frozen rows on edit
  const isFrozen = (rowIndex) => isEditMode && rowIndex < originalRowCount;

  // ── Structure ────────────────────────────────────────────────────────────
  const generate = () => {
    if (!canGenerate) return;
    const r = Math.max(1, Math.min(100, Number(genRows) || 0));
    const s = Math.max(1, Math.min(100, Number(genSeats) || 0));
    const next = [];
    let label = 'A';
    for (let i = 0; i < r; i++) {
      next.push({ rowLabel: label, seats: makeSeats(s), walkwayPositions: [] });
      label = nextRowLabel(label, next.map((x) => x.rowLabel));
    }
    setRows(next);
  };

  const addRow = () => {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      const seatCount = last?.seats?.length || 10;
      const label = nextRowLabel(last?.rowLabel || '', prev.map((x) => x.rowLabel));
      const walkwayPositions = [...(last?.walkwayPositions || [])];
      return [...prev, { rowLabel: label, seats: makeSeats(seatCount), walkwayPositions }];
    });
  };

  const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const setRowLabel = (idx, value) => {
    const v = value.toUpperCase().replace(/[^A-Z]/g, '');
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, rowLabel: v } : r)));
  };

  const setRowCount = (idx, value) => {
    const n = Math.max(1, Math.min(100, parseInt(value, 10) || 1));
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const walkwayPositions = (r.walkwayPositions || []).filter((p) => p <= n - 1);
      return { ...r, seats: makeSeats(n), walkwayPositions };
    }));
  };

  // ── Walkways ─────────────────────────────────────────────────────────────
  const toggleSeam = (idx, pos) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const cur = r.walkwayPositions || [];
      const next = cur.includes(pos) ? cur.filter((p) => p !== pos) : [...cur, pos].sort((a, b) => a - b);
      return { ...r, walkwayPositions: next };
    }));
  };

  const applyAisleToAll = () => {
    const pos = parseInt(aisleSeat, 10);
    if (!Number.isInteger(pos) || pos < 1) return;
    setRows((prev) => prev.map((r) => {
      const max = (r.seats?.length || 0) - 1;
      if (pos > max) return r; // can't cut past this row's last seat
      const cur = r.walkwayPositions || [];
      return cur.includes(pos) ? r : { ...r, walkwayPositions: [...cur, pos].sort((a, b) => a - b) };
    }));
  };

  // ── Reserve (two-way with the typed box) ──────────────────────────────────
  const toggleReserve = (label, booked) => {
    if (booked) return; // backend refuses sold seats; the canvas shows it honestly
    const set = parseReservedLabels(reserved);
    if (set.has(label)) set.delete(label); else set.add(label);
    setReserved(formatReservedLabels(set));
  };

  const save = () => onSave(rows, reserved);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" data-testid="seat-builder-overlay">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm sm:text-base font-semibold text-slate-800">Seating layout</h2>
        <div className="ml-2 flex items-center gap-2 text-sm">
          <span className="text-slate-500">Capacity {cap}</span>
          <span className="text-slate-300">/</span>
          <span className={matches ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {totalSeats} configured
          </span>
          {cap > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${matches ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {matches ? 'Matches' : (totalSeats > cap ? `${totalSeats - cap} over` : `${cap - totalSeats} short`)}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-700">Cancel</button>
          <button type="button" onClick={save} className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800">Save</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 px-4 py-2 text-sm">
        <div className="flex items-center gap-1">
          <input type="number" min="1" max="100" value={genRows} onChange={(e) => setGenRows(e.target.value)} aria-label="Rows" className="w-14 rounded border border-slate-300 p-1 text-center" />
          <span className="text-slate-400">x</span>
          <input type="number" min="1" max="100" value={genSeats} onChange={(e) => setGenSeats(e.target.value)} aria-label="Seats per row" className="w-14 rounded border border-slate-300 p-1 text-center" />
          <button type="button" onClick={generate} disabled={!canGenerate} title={canGenerate ? '' : 'Existing rows are locked while editing'} className="rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white disabled:opacity-40">Generate</button>
        </div>
        <button type="button" onClick={addRow} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">+ Add row</button>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Aisle after seat</span>
          <input type="number" min="1" value={aisleSeat} onChange={(e) => setAisleSeat(e.target.value)} aria-label="Aisle seat number" className="w-14 rounded border border-slate-300 p-1 text-center" />
          <button type="button" onClick={applyAisleToAll} className="rounded border border-amber-400 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">Apply to all rows</button>
        </div>
        <label className="flex items-center gap-1">
          <span className="text-slate-500">Reserved</span>
          <input type="text" value={reserved} onChange={(e) => setReserved(e.target.value.toUpperCase())} aria-label="Reserved seats" placeholder="A1,A4-A6" className="w-40 rounded border border-slate-300 p-1" />
        </label>
        <div className="ml-auto"><SeatLegend /></div>
      </div>

      {/* Body: rows panel + canvas */}
      <div className="flex min-h-0 flex-1">
        {/* Rows panel (structure edits; locked on frozen rows) */}
        <div className="w-40 shrink-0 overflow-y-auto border-r border-slate-200 p-2" data-testid="rows-panel">
          {rows.map((r, i) => (
            <div key={i} className="mb-1 flex items-center gap-1">
              <input
                value={r.rowLabel || ''} onChange={(e) => setRowLabel(i, e.target.value)}
                disabled={isFrozen(i)} aria-label={`Row ${i + 1} label`} maxLength={3}
                className={`w-10 rounded border border-slate-300 p-1 text-center text-xs font-bold ${isFrozen(i) ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              />
              <input
                type="number" min="1" max="100" value={r.seats?.length || 0} onChange={(e) => setRowCount(i, e.target.value)}
                disabled={isFrozen(i)} aria-label={`Row ${i + 1} seat count`}
                className={`w-14 rounded border border-slate-300 p-1 text-center text-xs ${isFrozen(i) ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              />
              {!isFrozen(i) && (
                <button type="button" onClick={() => removeRow(i)} aria-label={`Remove row ${r.rowLabel}`} className="text-red-500 hover:text-red-700 text-xs px-1">x</button>
              )}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="relative min-w-0 flex-1 bg-slate-50">
          <TransformWrapper
            minScale={0.3} maxScale={4} initialScale={1} centerOnInit
            wheel={{ step: 0.1 }} doubleClick={{ step: 0.7 }}
            onTransformed={(_ref, state) => setScale(state.scale)}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
                  <button type="button" onClick={() => { zoomIn(0.4); setScale((s) => Math.min(4, s + 0.4)); }} aria-label="Zoom in" className="h-8 w-8 rounded bg-white shadow border border-slate-200 text-slate-700">+</button>
                  <button type="button" onClick={() => { zoomOut(0.4); setScale((s) => Math.max(0.3, s - 0.4)); }} aria-label="Zoom out" className="h-8 w-8 rounded bg-white shadow border border-slate-200 text-slate-700">-</button>
                  <button type="button" onClick={() => { resetTransform(); setScale(1); }} aria-label="Fit" className="h-8 w-8 rounded bg-white shadow border border-slate-200 text-[10px] text-slate-700">Fit</button>
                </div>
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full">
                  <div className="mx-auto w-full px-8 py-6">
                    {/* Stage bar */}
                    <div className="mx-auto mb-6 w-2/3 rounded bg-slate-800 py-1 text-center text-xs font-semibold tracking-widest text-white" data-testid="stage-bar">STAGE</div>
                    {rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="mb-2 flex items-center justify-center gap-2">
                        <span className="w-8 shrink-0 text-right text-xs font-bold text-slate-600">{row.rowLabel}</span>
                        <div className="flex items-center gap-1">
                          {(row.seats || []).map((seat, seatIndex) => {
                            const pos = seatIndex + 1;
                            const label = `${row.rowLabel}${seat.seatNumber}`;
                            const booked = seat.status === 'booked';
                            const status = booked ? 'booked' : (reservedSet.has(label) ? 'reserved' : 'available');
                            const hasWalkway = (row.walkwayPositions || []).includes(pos);
                            return (
                              <span key={label} className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => toggleReserve(label, booked)}
                                  disabled={booked}
                                  aria-label={`Seat ${label}`}
                                  data-status={status}
                                  className={`flex h-5 w-5 items-center justify-center rounded border text-[8px] font-medium ${seatClass(status)}`}
                                >
                                  {showNumbers ? seat.seatNumber : <MdEventSeat className="h-2.5 w-2.5" />}
                                </button>
                                {seatIndex < row.seats.length - 1 && (
                                  hasWalkway ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleSeam(rowIndex, pos)}
                                      aria-label={`Remove walkway after seat ${pos} in row ${row.rowLabel}`}
                                      data-walkway="true"
                                      className="mx-0.5 h-5 w-3 self-stretch rounded-sm bg-amber-400 hover:bg-amber-500"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => toggleSeam(rowIndex, pos)}
                                      aria-label={`Add walkway after seat ${pos} in row ${row.rowLabel}`}
                                      className="h-5 w-1 self-stretch hover:bg-amber-200"
                                    />
                                  )
                                )}
                              </span>
                            );
                          })}
                        </div>
                        <span className="w-8 shrink-0 text-left text-xs font-bold text-slate-600">{row.rowLabel}</span>
                      </div>
                    ))}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      </div>
    </div>
  );
}
