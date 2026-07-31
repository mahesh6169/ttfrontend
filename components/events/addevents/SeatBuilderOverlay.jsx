'use client';

// Full-screen one-canvas hall designer (featureplans/events-seatbuilder-redesign.md).
// An OVERLAY mounted inside the wizard step (no route change): Cancel/Save drop back to the exact
// wizard state. Generate the skeleton by numbers, then shape visually on a single zoomable canvas
// that shares the attendee map's colour vocabulary. Edits only walkwayPositions + organizerReservedSeats.
import { useEffect, useMemo, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MdEventSeat } from 'react-icons/md';
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
  initialLayout, initialReserved, capacity, onSave, onClose,
}) {
  const [rows, setRows] = useState(() => JSON.parse(JSON.stringify(initialLayout || [])));
  const [reserved, setReserved] = useState(initialReserved || '');
  const [scale, setScale] = useState(1);
  const [genLabel, setGenLabel] = useState('A'); // starting row label for the Layout calculator
  const [genRows, setGenRows] = useState('');    // empty until the organiser types
  const [genSeats, setGenSeats] = useState('');
  const [aisleSeat, setAisleSeat] = useState('');
  const [bulkInput, setBulkInput] = useState(''); // one-time Bulk Reserve entry (not the live reserved list)
  const [activeStep, setActiveStep] = useState('rows'); // sidebar step in focus: rows | aisles | reserved

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // The builder is a full-screen overlay; lock the page behind it so there is no stray page scrollbar.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const zoomRef = useRef(null);   // TransformWrapper instance
  const canvasRef = useRef(null); // the canvas viewport (wheel target + cursor origin)
  const transformRef = useRef({ scale: 1, positionX: 0, positionY: 0 }); // last-known transform

  // Fixed-per-notch wheel zoom: the library's wheel scales with the raw scroll delta, which varies
  // notch-to-notch (erratic). Instead take ONLY the wheel direction and zoom a constant factor toward
  // the cursor, so every notch feels the same - like the +/- buttons.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      const api = zoomRef.current;
      if (!api?.setTransform) return;
      e.preventDefault();
      const ts = transformRef.current;
      const old = ts.scale || 1;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1; // one notch = +/-10%, direction only
      const next = Math.max(0.3, Math.min(4, old * factor));
      if (next === old) return;
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const k = next / old;
      const nx = cx - (cx - (ts.positionX || 0)) * k;
      const ny = cy - (cy - (ts.positionY || 0)) * k;
      api.setTransform(nx, ny, next, 0);
      transformRef.current = { scale: next, positionX: nx, positionY: ny };
      setScale(next);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const reservedSet = useMemo(() => parseReservedLabels(reserved), [reserved]);
  // "Seats Reserved" summary: compact tokens (formatReservedLabels collapses runs, e.g. B18-B21),
  // one chip per token; the count is the true number of seats.
  const reservedTokens = useMemo(() => {
    const s = formatReservedLabels(reservedSet);
    return s ? s.split(',').map((t) => t.trim()).filter(Boolean) : [];
  }, [reservedSet]);
  const totalSeats = rows.reduce((t, r) => t + (r.seats?.length || 0), 0);
  const cap = Number(capacity) || 0;
  const matches = cap > 0 && totalSeats === cap;
  const atCapacity = cap > 0 && totalSeats >= cap; // configured seats reached capacity - no room for more rows
  const rowsNum = parseInt(genRows, 10);
  const seatsNum = parseInt(genSeats, 10);
  const rowsError = String(genRows).trim() !== '' && !(rowsNum >= 1 && rowsNum <= 100);
  const seatsError = String(genSeats).trim() !== '' && !(seatsNum >= 1 && seatsNum <= 100);
  const canAdd = rowsNum >= 1 && rowsNum <= 100 && seatsNum >= 1 && seatsNum <= 100; // both valid
  const showNumbers = scale >= NUMBER_THRESHOLD;
  // Seat configuration locks on the event's FIRST SALE (a booked seat), not on "existing event": before
  // a sale it is fully editable even on an existing event; after a sale the whole builder is read-only.
  // No partial freeze - all or nothing (featureplans/fix-events-seatmap-salelock.md).
  const locked = (initialLayout || []).some((r) => (r.seats || []).some((s) => s.status === 'booked'));
  // Canvas edits are gated to their tab: aisles (seam clicks) only on the Aisles tab, reserving (seat
  // clicks) only on the Seat Reservations tab. Colours/aisles still SHOW on every tab, just not editable.
  const canAisle = !locked && activeStep === 'aisles';
  const canReserve = !locked && activeStep === 'reserved';

  // ── Structure ────────────────────────────────────────────────────────────
  const generateDims = (r, s, startLabel = 'A') => {
    const next = [];
    let label = startLabel || 'A';
    for (let i = 0; i < r; i++) {
      next.push({ rowLabel: label, seats: makeSeats(s), walkwayPositions: [] });
      label = nextRowLabel(label, next.map((x) => x.rowLabel));
    }
    setRows(next);
    setReserved(''); // a fresh rebuild wipes aisles (new rows) and reserved too, while still designing (item 23)
  };

  // Layout calculator: ONE button with two faces. With no rows it reads "Add" and builds the skeleton
  // from the two numbers; once rows exist it reads "Clear" and wipes the rows (back to "Add"), leaving
  // the typed numbers in the boxes. No auto-create on typing or blur.
  const addLayout = () => {
    if (locked) return;
    const r = Math.max(1, Math.min(100, parseInt(genRows, 10) || 0));
    const s = Math.max(1, Math.min(100, parseInt(genSeats, 10) || 0));
    if (!r || !s) return;
    const start = (genLabel || 'A').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'A';
    generateDims(r, s, start);
  };
  const clearLayout = () => {
    if (locked) return;
    setRows([]);
    setReserved('');
  };

  const addRow = () => {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      const prevCount = last?.seats?.length || 10;
      // Never overshoot capacity: size the new row to the smaller of the previous row and what is left,
      // so a final short row auto-fills the leftover exactly (cap 300, 280 configured, prev 100 -> 20).
      const configured = prev.reduce((t, r) => t + (r.seats?.length || 0), 0);
      const remaining = cap > 0 ? cap - configured : Infinity;
      if (remaining <= 0) return prev; // at capacity - nothing to add (the button is greyed anyway)
      const seatCount = Math.max(1, Math.min(prevCount, remaining));
      const label = nextRowLabel(last?.rowLabel || '', prev.map((x) => x.rowLabel));
      // Copy the previous row's aisles, dropping any that would sit past the shorter tail row's last seat.
      const walkwayPositions = [...(last?.walkwayPositions || [])].filter((p) => p <= seatCount - 1);
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

  // Seat-count field: type freely (empty allowed) via a per-row draft; validate + apply only on
  // blur/Enter, so the field never fights the typist or snaps to a default nobody typed (item 12).
  const [countDrafts, setCountDrafts] = useState({});
  const rowCountValue = (i, r) => (countDrafts[i] !== undefined ? countDrafts[i] : String(r.seats?.length || 0));
  const onRowCountChange = (i, value) => setCountDrafts((d) => ({ ...d, [i]: value }));
  const commitRowCount = (i) => {
    const raw = countDrafts[i];
    const n = parseInt(raw, 10);
    if (raw !== undefined && raw !== '' && Number.isFinite(n)) {
      setRowCount(i, Math.max(1, Math.min(100, n))); // min-1 holds on apply, not while editing
    }
    setCountDrafts((d) => { const c = { ...d }; delete c[i]; return c; }); // empty/invalid reverts
  };

  // ── Walkways ─────────────────────────────────────────────────────────────
  const toggleSeam = (idx, pos) => {
    if (!canAisle) return; // aisles are only editable on the Aisles tab
    const adding = !((rows[idx]?.walkwayPositions) || []).includes(pos);
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const cur = r.walkwayPositions || [];
      const next = cur.includes(pos) ? cur.filter((p) => p !== pos) : [...cur, pos].sort((a, b) => a - b);
      return { ...r, walkwayPositions: next };
    }));
    // Clicking a seam to ADD an aisle prefills "Aisle after seat", so "Apply to all rows" is one click away.
    if (adding) setAisleSeat(String(pos));
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
    setAisleSeat(''); // clear ready for the next number (item 14)
  };

  // Exact inverse of "Apply to all rows": remove the aisle at this seat position (the lane) from every row.
  const removeAisleFromAll = () => {
    const pos = parseInt(aisleSeat, 10);
    if (!Number.isInteger(pos) || pos < 1) return;
    setRows((prev) => prev.map((r) => ({ ...r, walkwayPositions: (r.walkwayPositions || []).filter((p) => p !== pos) })));
    setAisleSeat('');
  };

  // Nuke every aisle from every row in one click.
  const clearAllAisles = () => setRows((prev) => prev.map((r) => ({ ...r, walkwayPositions: [] })));

  // ── Reserve (two-way with the typed box) ──────────────────────────────────
  const toggleReserve = (label, booked) => {
    if (!canReserve || booked) return; // reserving is only editable on the Seat Reservations tab (and never after a sale)
    const set = parseReservedLabels(reserved);
    if (set.has(label)) set.delete(label); else set.add(label);
    setReserved(formatReservedLabels(set));
  };

  // Bulk Reserve: a one-time entry that MERGES the typed seats into the reserved list, then clears.
  // The live list is shown by the "Seats Reserved" summary and by clicking seats - not by this input.
  const applyBulkReserve = () => {
    const add = parseReservedLabels(bulkInput);
    if (add.size) setReserved(formatReservedLabels(new Set([...reservedSet, ...add])));
    setBulkInput('');
  };

  const save = () => onSave(rows, reserved);

  const steps = [
    { key: 'rows', n: '1', label: 'Layout' },
    { key: 'aisles', n: '2', label: 'Aisles' },
    { key: 'reserved', n: '3', label: 'Reservations' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" data-testid="seat-builder-overlay">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm sm:text-base font-semibold text-slate-800">Seating layout</h2>
        <div className="ml-auto flex items-center gap-3">
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-700">Cancel</button>
          <button type="button" onClick={save} className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800">Save</button>
        </div>
      </div>

      {/* Body: sidebar (left on desktop, top tabs on mobile) + canvas */}
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        {/* Sidebar: numbered steps + per-row list + capacity badge (item 19) */}
        <div className="flex shrink-0 flex-col border-b border-slate-200 sm:w-56 sm:border-b-0 sm:border-r" data-testid="builder-sidebar">
          {!locked && (
            <div className="flex gap-1 p-2 sm:flex-col" role="tablist" aria-label="Seating steps">
              {steps.map((s) => (
                <button
                  key={s.key} type="button" role="tab" aria-selected={activeStep === s.key}
                  onClick={() => setActiveStep(s.key)}
                  className={`flex flex-1 items-center gap-2 rounded px-3 py-2 text-sm font-medium sm:flex-none ${activeStep === s.key ? 'border border-teal-300 bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${activeStep === s.key ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{s.n}</span>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {/* Row/Seats Configuration: the real per-row seat counts (the skeleton becomes the true hall here) */}
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-200 p-2" data-testid="rows-panel">
            <h3 className="mb-1 px-1 text-xs font-semibold text-slate-600">Row/Seats Configuration</h3>
            {rows.length === 0 && <p className="px-1 py-1 text-xs text-slate-400">No rows yet - use Layout Settings to configure Rows and Seats per row.</p>}
            {rows.map((r, i) => (
              <div key={i} className="mb-1 flex items-center gap-1">
                <input
                  value={r.rowLabel || ''} onChange={(e) => setRowLabel(i, e.target.value)}
                  disabled={locked} aria-label={`Row ${i + 1} label`} maxLength={3}
                  className={`w-10 rounded border border-slate-300 p-1 text-center text-xs font-bold ${locked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
                <input
                  type="number" min="1" max="100"
                  value={rowCountValue(i, r)}
                  onChange={(e) => onRowCountChange(i, e.target.value)}
                  onBlur={() => commitRowCount(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { commitRowCount(i); e.currentTarget.blur(); } }}
                  disabled={locked} aria-label={`Row ${i + 1} seat count`}
                  className={`w-14 rounded border border-slate-300 p-1 text-center text-xs ${locked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
                {!locked && (
                  <button type="button" onClick={() => removeRow(i)} aria-label={`Remove row ${r.rowLabel}`} className="text-red-500 hover:text-red-700 text-xs px-1">x</button>
                )}
              </div>
            ))}
            {/* Add Single Row travels directly after the last row (one button, one place); greyed out
                once the configured seats reach capacity, so rows cannot push the hall over. */}
            {!locked && rows.length > 0 && (
              <button
                type="button"
                onClick={addRow}
                disabled={atCapacity}
                title={atCapacity ? 'At capacity - no room for another row' : ''}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Add Single Row
              </button>
            )}
          </div>
        </div>

        {/* Canvas: one tool panel above the stage swaps with the step; the hall never moves */}
        <div className="relative flex min-w-0 flex-1 flex-col bg-slate-50" data-testid="builder-canvas">
          {/* Tool panel - only the active step's tool. Each tab is arranged to its owner-blessed layout
              (featureplans/events-seatbuilder-tabs.md); the tab icons quietly teach the seat colours. */}
          <div className="shrink-0 flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 text-sm" data-testid="tool-panel">
            {locked && (
              <div data-testid="builder-locked" className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This event has sold seats, so the seating layout is locked and cannot be edited. To change the layout, recreate the event and reserve the already-sold seats.
              </div>
            )}

            {/* Tab 1 - Layout */}
            {!locked && activeStep === 'rows' && (
              <>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded border border-teal-400 bg-teal-50 text-teal-700"><MdEventSeat className="h-2.5 w-2.5" /></span>
                  Layout Settings
                </div>
                <p className="text-xs text-slate-500">Layout is just a skeleton - use Row/Seats Configuration on the sidebar to adjust the real seats per row.</p>
                {/* Seating Capacity: configured (green when it matches, red when not) / total (black). */}
                <div className="flex items-center gap-1.5" data-testid="capacity-badge">
                  <span className="text-slate-500">Seating Capacity</span>
                  <span className={matches ? 'font-medium text-green-600' : 'font-medium text-red-600'}>{totalSeats}</span>
                  <span className="text-slate-400">/</span>
                  <span className="font-medium text-slate-900">{cap}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1"><span className="text-slate-500">Row Label</span>
                    <input type="text" value={genLabel} onChange={(e) => setGenLabel(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} disabled={locked} aria-label="Row Label" maxLength={3} placeholder="A" className="w-12 rounded border border-slate-300 p-1 text-center font-bold disabled:bg-slate-100" /></label>
                  <label className="flex items-center gap-1"><span className="text-slate-500">Rows</span>
                    <input type="number" min="1" max="100" value={genRows} onChange={(e) => setGenRows(e.target.value)} disabled={locked} aria-label="Rows" className={`w-14 rounded border p-1 text-center disabled:bg-slate-100 ${rowsError ? 'border-red-400' : 'border-slate-300'}`} /></label>
                  <span className="text-slate-400">x</span>
                  <label className="flex items-center gap-1"><span className="text-slate-500">Seats per row</span>
                    <input type="number" min="1" max="100" value={genSeats} onChange={(e) => setGenSeats(e.target.value)} disabled={locked} aria-label="Seats per row" className={`w-14 rounded border p-1 text-center disabled:bg-slate-100 ${seatsError ? 'border-red-400' : 'border-slate-300'}`} /></label>
                  {rows.length > 0 ? (
                    <button type="button" onClick={clearLayout} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Clear</button>
                  ) : (
                    <button type="button" onClick={addLayout} disabled={!canAdd} className={`rounded px-3 py-1 text-xs font-medium ${canAdd ? 'bg-teal-700 text-white hover:bg-teal-800' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}>Add</button>
                  )}
                </div>
                <p className="text-xs text-slate-500">Row Label - e.g. A, AA, VIP (max 3 letters only).</p>
                <p className="text-xs text-slate-500">Row labels increment automatically - A, B, C... or AA, AB, AC...</p>
                {(rowsError || seatsError) && (
                  <p className="text-xs font-medium text-red-600">Rows and Seats per row must each be a number from 1 to 100.</p>
                )}
              </>
            )}

            {/* Tab 2 - Aisles */}
            {!locked && activeStep === 'aisles' && (
              <>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="h-4 w-3 rounded-sm bg-amber-400" />
                  Aisle Settings
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="sm:pr-4">
                    <div className="font-medium text-teal-700">Create</div>
                    <p className="text-xs text-slate-500">Click between two seats to add an aisle</p>
                  </div>
                  <div className="sm:pr-4">
                    <div className="font-medium text-amber-600">Remove</div>
                    <p className="text-xs text-slate-500">Click again to remove</p>
                  </div>
                  <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                    <div className="mb-1 font-medium text-slate-700">Add Multiple Aisles</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-500">Aisle after seat</span>
                      <input type="number" min="1" value={aisleSeat} onChange={(e) => setAisleSeat(e.target.value)} aria-label="Aisle seat number" className="w-14 rounded border border-slate-300 p-1 text-center" />
                      <button type="button" onClick={applyAisleToAll} className="rounded border border-amber-400 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">Apply to all rows</button>
                      <button type="button" onClick={removeAisleFromAll} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">Remove from all rows</button>
                      <button type="button" onClick={clearAllAisles} disabled={!rows.some((r) => (r.walkwayPositions || []).length)} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Clear all aisles</button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab 3 - Reserved */}
            {!locked && activeStep === 'reserved' && (
              <>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded border border-purple-700 bg-purple-600 text-white"><MdEventSeat className="h-2.5 w-2.5" /></span>
                  Seat Reservations
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="sm:pr-4">
                    <div className="font-medium text-teal-700">Manual Selection</div>
                    <p className="text-xs text-slate-500">Click an available seat to reserve it (turns purple). Click again to release.</p>
                  </div>
                  <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                    <div className="mb-1 font-medium text-slate-700">Bulk Reserve</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="text" value={bulkInput} onChange={(e) => setBulkInput(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') applyBulkReserve(); }} aria-label="Bulk reserve seats" placeholder="A1, A4-A6" className="w-40 rounded border border-slate-300 p-1" />
                      <button type="button" onClick={applyBulkReserve} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Apply</button>
                    </div>
                    <p className="mt-1 text-xs italic text-slate-400">Type seats (e.g. A1, A4-A6) and Apply to reserve them in one go.</p>
                  </div>
                </div>
                {/* Seats Reserved summary - compact ranges, wraps to more lines as the list grows */}
                <div className="border-t border-slate-200 pt-2">
                  <div className="mb-1 font-medium text-slate-700">Seats Reserved{reservedSet.size ? ` (${reservedSet.size})` : ''}</div>
                  {reservedTokens.length === 0 ? (
                    <p className="text-xs text-slate-400">None yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {reservedTokens.map((t) => (
                        <span key={t} className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {cap > 0 && totalSeats > cap && (
            <div data-testid="capacity-error" className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-700">
              Over capacity by {totalSeats - cap} seat{totalSeats - cap === 1 ? '' : 's'} - remove {totalSeats - cap} to match the {cap}-seat capacity.
            </div>
          )}
          <div className="min-h-0 min-w-0 flex-1 p-3">
          <div ref={canvasRef} data-testid="builder-map" className="relative h-full w-full overflow-hidden rounded-md border border-slate-200">
          <TransformWrapper
            ref={zoomRef}
            minScale={0.3} maxScale={4} initialScale={1}
            limitToBounds={false}
            wheel={{ disabled: true }} doubleClick={{ step: 0.7 }}
            onTransformed={(_ref, state) => { transformRef.current = { scale: state.scale, positionX: state.positionX, positionY: state.positionY }; setScale(state.scale); }}
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
                    {/* In-map legend, just above the stage (item 23). Top-to-bottom: legend, stage, hall. */}
                    <div className="mx-auto mb-2 flex w-max max-w-full flex-wrap items-center justify-center gap-3 rounded border border-slate-200 bg-white/90 px-3 py-1 text-xs text-slate-700 shadow-sm" data-testid="map-legend">
                      <span className="flex items-center gap-1"><span className="h-3.5 w-3.5 rounded border border-teal-400 bg-teal-50" />Available</span>
                      <span className="flex items-center gap-1"><span className="h-3.5 w-3.5 rounded border border-purple-700 bg-purple-600" />Reserved</span>
                      <span className="flex items-center gap-1"><span className="h-3.5 w-2.5 rounded-sm bg-amber-400" />Aisle</span>
                    </div>
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
                                  disabled={booked || !canReserve}
                                  aria-label={`Seat ${label}`}
                                  data-status={status}
                                  className={`group relative flex h-5 w-5 items-center justify-center rounded border text-[8px] font-medium ${seatClass(status)}`}
                                >
                                  {showNumbers ? (
                                    seat.seatNumber
                                  ) : (
                                    <>
                                      {/* Hovering a seat reveals its number in place (any tab), so the organiser
                                          can read seat positions at the fitted/dot view without zooming in. */}
                                      <MdEventSeat className="h-2.5 w-2.5 group-hover:opacity-0" />
                                      <span className="absolute inset-0 hidden items-center justify-center font-semibold group-hover:flex">{seat.seatNumber}</span>
                                    </>
                                  )}
                                </button>
                                {seatIndex < row.seats.length - 1 && (
                                  hasWalkway ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleSeam(rowIndex, pos)}
                                      disabled={!canAisle}
                                      aria-label={`Remove walkway after seat ${pos} in row ${row.rowLabel}`}
                                      data-walkway="true"
                                      className="mx-0.5 h-5 w-3 self-stretch rounded-sm bg-amber-400 hover:bg-amber-500 disabled:hover:bg-amber-400"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => toggleSeam(rowIndex, pos)}
                                      disabled={!canAisle}
                                      aria-label={`Add walkway after seat ${pos} in row ${row.rowLabel}`}
                                      className="h-5 w-1 self-stretch hover:bg-amber-200 disabled:hover:bg-transparent"
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
      </div>
    </div>
  );
}
