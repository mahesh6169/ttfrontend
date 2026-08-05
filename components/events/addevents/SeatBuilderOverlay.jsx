'use client';

// Full-screen one-canvas hall designer (featureplans/events-seatbuilder-redesign.md).
// An OVERLAY mounted inside the wizard step (no route change): Cancel/Save drop back to the exact
// wizard state. Generate the skeleton by numbers, then shape visually on a single zoomable canvas
// that shares the attendee map's colour vocabulary. Edits only walkwayPositions + organizerReservedSeats.
// Mobile layout (featureplans/events-seatbuilder-mobile.md): tabs -> MAP (primary) -> Row/Seats list,
// with the per-tab tool in a dismissible bottom sheet; desktop keeps the sidebar-left / canvas-right layout.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MdEventSeat, MdFitScreen } from 'react-icons/md';
import { toast } from 'react-toastify';
import { nextRowLabel, parseReservedLabels, formatReservedLabels } from '@/utils/events/seatBuilder';

// Seat numbers are hidden at fitted view (clean dots) and appear once zoomed past this scale.
const NUMBER_THRESHOLD = 1.6;
// Unified with the attendee map (events-seatmap-zoom-parity.md): min zoom = fitted view, max = 4.0.
const MAX_SCALE = 4;

const makeSeats = (count) =>
  Array.from({ length: count }, (_, i) => ({ seatNumber: i + 1, status: 'available' }));

// Same colour language as the attendee map (SeatButton): available teal, reserved PURPLE, booked red.
const seatClass = (status) => {
  if (status === 'booked') return 'bg-red-500 text-white border-red-600 cursor-not-allowed';
  if (status === 'reserved') return 'bg-purple-600 text-white border-purple-700';
  // Hover gated to true hover devices ([@media(hover:hover)]) so a touch tap toggles the seat on the first
  // tap (a sticky-hover seat would only reveal the card first) - parity with the attendee SeatButton.
  return 'bg-teal-50 text-teal-700 border-teal-400 [@media(hover:hover)]:hover:bg-teal-100 cursor-pointer';
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
  const [bulkError, setBulkError] = useState(''); // set on Apply/blur when tokens are not real seats
  const [activeStep, setActiveStep] = useState('rows'); // sidebar step in focus: rows | aisles | reserved
  const [sheetOpen, setSheetOpen] = useState(false);    // MOBILE: the per-tab tool bottom sheet (desktop shows the tool inline)

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
  const contentRef = useRef(null); // the hall content (natural size, for the fit computation)
  const transformRef = useRef({ scale: 1, positionX: 0, positionY: 0 }); // last-known transform
  const anchorYRef = useRef(0);   // screen-y of the hall centre; +/- controls zoom toward it
  const [fitScale, setFitScale] = useState(1); // the fitted whole-hall scale = the minimum zoom
  const [viewportH, setViewportH] = useState(null); // map box height, sized to hug the fitted hall (mobile); desktop fills
  const [isMobile, setIsMobile] = useState(false);  // below the sm breakpoint - gates the earlier seat-number reveal

  // Track the sm breakpoint so seat numbers can reveal earlier on the phone (see showNumbers below).
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
      const next = Math.max(fitScale, Math.min(MAX_SCALE, old * factor)); // floor = fitted, cap unified
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
  }, [fitScale]);

  // Smart Fit (ported from the attendee map for parity): fit the whole hall to ~96% of the width, stage
  // top-aligned, and record that fitted scale as the minimum zoom. Recentres from anywhere.
  const fitToView = useCallback(() => {
    const vp = canvasRef.current;
    const content = contentRef.current;
    const api = zoomRef.current;
    if (!vp || !content || !api?.setTransform) return;
    const cw = content.offsetWidth || 1;
    const ch = content.offsetHeight || 1;
    const vw = vp.clientWidth;
    const fit = Math.min((vw * 0.96) / cw, 1); // that 96% margin IS the gutter
    const safeFit = Number.isFinite(fit) && fit > 0 ? fit : 1;
    const x = Math.max(0, (vw - cw * safeFit) / 2); // horizontally centred = the shared centreline
    const padTop = 8; // stage top-aligned
    const padBottom = 24;
    const y = padTop;
    const fittedH = ch * safeFit;
    // Box HUGS the fitted hall (+ padding), capped so a tall hall stays pannable and floored so a tiny
    // hall still reads as a map - borrowed from the attendee /events/seats map so a short hall wastes no
    // space (desktop keeps filling its column via sm:!h-full, which overrides this inline height).
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const boxH = Math.round(Math.min(Math.round(winH * 0.55), Math.max(200, fittedH + padTop + padBottom)));
    setViewportH(boxH);
    anchorYRef.current = y + fittedH / 2; // +/- controls zoom toward the hall
    setFitScale(safeFit);
    setScale(safeFit);
    api.setTransform(x, y, safeFit, 0);
    transformRef.current = { scale: safeFit, positionX: x, positionY: y };
  }, []);

  // +/- buttons: fixed 0.3 step, clamped to [fitted, MAX_SCALE], anchored on the hall (unified with attendee).
  const zoomBy = useCallback((delta) => {
    const api = zoomRef.current;
    const vp = canvasRef.current;
    if (!api?.setTransform || !vp) return;
    const ts = transformRef.current;
    const oldScale = ts.scale || 1;
    const newScale = Math.max(fitScale, Math.min(MAX_SCALE, oldScale + delta));
    if (newScale === oldScale) return;
    const px = vp.clientWidth / 2;
    const py = anchorYRef.current || vp.clientHeight / 2;
    const k = newScale / oldScale;
    const nx = px - (px - (ts.positionX || 0)) * k;
    const ny = py - (py - (ts.positionY || 0)) * k;
    // Instant (0ms) like the wheel/Fit: with onTransform/onZoom now wired, a timed animation would report
    // mid-animation scales and make the +/- step (and seat-number reveal) lag. Parity with the attendee map.
    api.setTransform(nx, ny, newScale, 0);
    transformRef.current = { scale: newScale, positionX: nx, positionY: ny };
    setScale(newScale);
  }, [fitScale]);

  // Sync scale from the library's LIVE callbacks. In react-zoom-pan-pinch v4 the prop is onTransform (not
  // onTransformed) and pinch fires onPinch/onZoom - the -ed/-ing variants silently never fire, so a pinch
  // (or double-tap) would zoom the picture without raising `scale`, and seat numbers would never appear.
  const syncScaleFromLib = (ref) => {
    const s = ref?.state ?? ref?.instance?.state;
    if (!s || typeof s.scale !== 'number') return;
    transformRef.current = { scale: s.scale, positionX: s.positionX, positionY: s.positionY };
    setScale(s.scale);
  };

  // Fit the hall on open and when rows are added/removed (not on aisle/label edits, which would reset zoom).
  useLayoutEffect(() => {
    if (rows.length > 0) {
      const id = requestAnimationFrame(fitToView);
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [rows.length, fitToView]);

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
  // Seat numbers reveal at an absolute 1.6x on desktop (parity with the attendee map). On mobile the hall
  // starts fitted at a much smaller scale (a wide hall shrinks to fit the narrow screen), so a fixed 1.6x
  // forced a huge zoom before numbers showed; instead reveal RELATIVE to the fitted view (a small zoom past
  // fit), capped so it is never later than the desktop 1.6x.
  const numberThreshold = isMobile ? Math.min(NUMBER_THRESHOLD, fitScale * 1.3) : NUMBER_THRESHOLD;
  const showNumbers = scale >= numberThreshold;
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
    const label = rows[idx]?.rowLabel || '';
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const walkwayPositions = (r.walkwayPositions || []).filter((p) => p <= n - 1);
      return { ...r, seats: makeSeats(n), walkwayPositions };
    }));
    // Silent self-cleaning: a shrunk row drops any reserved seat that no longer exists (no message).
    if (label) {
      setReserved((prevReserved) => {
        const set = parseReservedLabels(prevReserved);
        const kept = [...set].filter((lbl) => {
          const m = lbl.match(/^([A-Z]+)(\d+)$/);
          return !(m && m[1] === label && Number(m[2]) > n);
        });
        return kept.length === set.size ? prevReserved : formatReservedLabels(new Set(kept));
      });
    }
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

  // ── Validation (live field errors; Save is the one gate) ──────────────────
  // Every real seat label in the configured hall (for the Bulk Reserve check).
  const allSeatLabels = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => (r.seats || []).forEach((seat) => s.add(`${r.rowLabel}${seat.seatNumber}`)));
    return s;
  }, [rows]);
  // Per-row errors: seat count must be 1-100; label must be 1-3 letters, not blank, and unique (a
  // duplicate flags the LATER row - the original stays calm; labels are seat identities, so A twice collides).
  const rowErrors = useMemo(() => rows.map((r, i) => {
    const raw = countDrafts[i] !== undefined ? countDrafts[i] : String(r.seats?.length || 0);
    const n = parseInt(raw, 10);
    const count = String(raw).trim() !== '' && (!Number.isFinite(n) || n < 1 || n > 100);
    const lbl = (r.rowLabel || '').trim();
    let label = null;
    if (lbl === '') label = 'required';
    else if (rows.slice(0, i).some((o) => (o.rowLabel || '').trim() === lbl)) label = 'duplicate';
    return { count, label };
  }), [rows, countDrafts]);
  const anyRowError = rowErrors.some((e) => e.count || e.label);
  // Aisle-after-seat is red only if the number falls past the end of EVERY row (no row can take it).
  const aislePos = parseInt(aisleSeat, 10);
  const aisleError = String(aisleSeat).trim() !== '' && Number.isInteger(aislePos) && aislePos >= 1
    && rows.length > 0 && rows.every((r) => (r.seats?.length || 0) <= aislePos);

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
    // Clicking a seam to ADD an aisle prefills "Aisle after seat", so "Apply to all rows" is one click
    // away - and on mobile it pops the tool sheet open so those bulk controls are right there.
    if (adding) {
      setAisleSeat(String(pos));
      setSheetOpen(true);
    }
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
    setSheetOpen(true); // mobile: pop the sheet so the Seats Reserved summary + Bulk Reserve are visible
  };

  // Bulk Reserve: a one-time entry that MERGES the typed seats into the reserved list, then clears.
  // Checked on Apply/blur (never per keystroke): tokens that are not real seats in the hall turn the
  // box red and named; nothing applies until the whole box is valid (all-or-nothing).
  const bulkCulprits = () => [...parseReservedLabels(bulkInput)].filter((lbl) => !allSeatLabels.has(lbl));
  const applyBulkReserve = () => {
    if (String(bulkInput).trim() === '') { setBulkError(''); return; }
    const culprits = bulkCulprits();
    if (culprits.length) { setBulkError(`Not in your hall: ${culprits.join(', ')}`); return; }
    const add = parseReservedLabels(bulkInput);
    if (add.size) setReserved(formatReservedLabels(new Set([...reservedSet, ...add])));
    setBulkError('');
    setBulkInput('');
  };
  const checkBulkOnBlur = () => {
    if (String(bulkInput).trim() === '') { setBulkError(''); return; }
    const culprits = bulkCulprits();
    setBulkError(culprits.length ? `Not in your hall: ${culprits.join(', ')}` : '');
  };

  // Save - the ONE gate. Tab switches are always free; validation only blocks Save.
  const nameList = (arr) => (arr.length <= 1 ? (arr[0] || '') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`);
  // One signpost toast at a time (shared id = never stacked). Placed TOP-CENTER: the bottom is now taken
  // by the mobile tool sheet (Layout/Aisles/Reservations), and the top-right Save button is clear of a
  // centred toast - so the error blocks neither the controls being fixed nor re-saving after the fix.
  const signpost = (msg) => toast.error(msg, { toastId: 'seatbuilder-validation', position: 'top-center' });
  const save = () => {
    if (cap > 0 && totalSeats > cap) {
      const over = totalSeats - cap;
      signpost(`Over capacity by ${over} - remove ${over} to save.`);
      return;
    }
    const badTabs = [];
    if (rowsError || seatsError || anyRowError) badTabs.push('Layout'); // the row list counts as Layout
    if (aisleError) badTabs.push('Aisles');
    if (bulkError) badTabs.push('Reservations');
    if (badTabs.length) {
      signpost(`${nameList(badTabs)} ${badTabs.length > 1 ? 'have' : 'has'} errors.`);
      return;
    }
    onSave(rows, reserved);
  };

  const steps = [
    { key: 'rows', n: '1', label: 'Layout' },
    { key: 'aisles', n: '2', label: 'Aisles' },
    { key: 'reserved', n: '3', label: 'Reservations' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-x-clip bg-white" data-testid="seat-builder-overlay">
      {/* Header (kept above the mobile tool-sheet backdrop so Cancel/Save stay reachable) */}
      <div className="relative z-50 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="text-sm sm:text-base font-semibold text-slate-800">Seating layout</h2>
        <div className="ml-auto flex items-center gap-3">
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-700">Cancel</button>
          <button type="button" onClick={save} className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800">Save</button>
        </div>
      </div>

      {/* Body: a responsive grid. Desktop (sm+) keeps the sidebar-left (tabs + Row/Seats list) /
          canvas-right (tool + map) layout. Mobile stacks tabs -> MAP (primary) -> Row/Seats list, and
          the per-tab tool opens as a dismissible bottom sheet (tab tap opens it; Done / backdrop dismiss).
          Seat editing, zoom, validation and Save are unchanged - only the arrangement moves. */}
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)] sm:grid-cols-[14rem_minmax(0,1fr)] sm:grid-rows-[auto_minmax(0,1fr)]">

        {/* Tabs - desktop col1/row1; mobile row1. Hidden when the layout is locked. */}
        {!locked && (
          <div className="relative z-50 border-b border-slate-200 bg-white sm:col-start-1 sm:row-start-1 sm:border-b-0 sm:border-r" data-testid="builder-sidebar">
            <div className="flex gap-1 p-2 sm:flex-col" role="tablist" aria-label="Seating steps">
              {steps.map((s) => (
                <button
                  key={s.key} type="button" role="tab" aria-selected={activeStep === s.key}
                  onClick={() => { setActiveStep(s.key); setSheetOpen(true); }}
                  className={`flex min-w-0 flex-1 items-center gap-1.5 rounded px-2 py-2 text-sm font-medium sm:flex-none ${activeStep === s.key ? 'border border-teal-300 bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className={`hidden h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs sm:flex ${activeStep === s.key ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{s.n}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas (the MAP) - desktop col2/row2; mobile row2 (the primary workspace). The locked notice
            and the over-capacity banner ride above the map. The hall never moves. */}
        <div className="relative flex min-h-0 min-w-0 flex-col bg-slate-50 sm:col-start-2 sm:row-start-2" data-testid="builder-canvas">
          {locked && (
            <div data-testid="builder-locked" className="m-3 mb-0 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This event has sold seats, so the seating layout is locked and cannot be edited. To change the layout, recreate the event and reserve the already-sold seats.
            </div>
          )}
          {cap > 0 && totalSeats > cap && (
            <div data-testid="capacity-error" className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-700">
              Over capacity by {totalSeats - cap} seat{totalSeats - cap === 1 ? '' : 's'} - remove {totalSeats - cap} to match the {cap}-seat capacity.
            </div>
          )}
          {/* Zoom toolbar - horizontal, top-right, ABOVE and outside the map container (parity with the
              attendee /events/seats map). */}
          <div className="flex shrink-0 justify-end gap-1 px-3 pt-2" data-testid="zoom-toolbar">
            <button type="button" onClick={() => zoomBy(0.3)} aria-label="Zoom in" className="h-8 w-8 rounded bg-white shadow border border-slate-200 text-slate-700">+</button>
            <button type="button" onClick={() => zoomBy(-0.3)} aria-label="Zoom out" className="h-8 w-8 rounded bg-white shadow border border-slate-200 text-slate-700">-</button>
            <button type="button" onClick={fitToView} aria-label="Fit" title="Fit to view" className="flex h-8 w-8 items-center justify-center rounded bg-white shadow border border-slate-200 text-slate-700"><MdFitScreen className="h-4 w-4" /></button>
          </div>
          <div className="min-h-0 min-w-0 flex-1 px-3 pb-3 pt-2">
          <div ref={canvasRef} data-testid="builder-map" data-scale={scale} style={viewportH ? { height: `${viewportH}px` } : undefined} className="relative w-full overflow-hidden rounded-md border border-slate-200 h-[55vh] sm:!h-full">
          <TransformWrapper
            ref={zoomRef}
            minScale={fitScale} maxScale={MAX_SCALE} initialScale={1}
            limitToBounds={true}
            wheel={{ disabled: true }} doubleClick={{ step: 0.7 }}
            onPinchStop={syncScaleFromLib}
            onZoomStop={syncScaleFromLib}
          >
            {() => (
              <>
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-max">
                  <div ref={contentRef} className="mx-auto px-8 py-6">
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
                                <div className="relative group">
                                  <button
                                    type="button"
                                    onClick={() => toggleReserve(label, booked)}
                                    disabled={booked || !canReserve}
                                    aria-label={`Seat ${label}`}
                                    data-status={status}
                                    className={`flex h-5 w-5 items-center justify-center rounded border text-[8px] font-medium ${seatClass(status)}`}
                                  >
                                    {showNumbers ? seat.seatNumber : <MdEventSeat className="h-2.5 w-2.5" />}
                                  </button>
                                  {/* Shared hover card (parity with the attendee map): Row + Seat only, no status word, no price. */}
                                  <div data-testid="seat-hover-card" className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 opacity-0 shadow-lg transition-opacity duration-200 [@media(hover:hover)]:group-hover:opacity-100">
                                    <div className="flex items-baseline justify-center gap-1 text-slate-800">
                                      <span className="text-[10px] uppercase tracking-wide text-slate-400">Row</span>
                                      <span className="text-sm font-bold">{row.rowLabel}</span>
                                      <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">Seat</span>
                                      <span className="text-sm font-bold">{seat.seatNumber}</span>
                                    </div>
                                  </div>
                                </div>
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

        {/* Row/Seats Configuration: the real per-row seat counts - desktop col1/row2; mobile row3, a
            capped scroll area below the map so a tall hall never crowds it. */}
        <div className="min-h-0 overflow-y-auto border-t border-slate-200 p-2 sm:col-start-1 sm:row-start-2 sm:border-r" data-testid="rows-panel">
          <div className="mb-1 flex items-center justify-between gap-2 px-1">
            <h3 className="text-xs font-semibold text-slate-600">Row/Seats Configuration</h3>
            {!locked && rows.length > 0 && (
              <button type="button" onClick={addRow} disabled={atCapacity} title={atCapacity ? 'At capacity - no room for another row' : ''} className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">Add Single Row</button>
            )}
          </div>
          {rows.length === 0 && <p className="px-1 py-1 text-xs text-slate-400">No rows yet - use configure layout to set Number Of Rows and Seats Per Row.</p>}
          {rows.map((r, i) => (
            <div key={i} className="mb-1">
              <div className="flex items-center gap-1">
                <input
                  value={r.rowLabel || ''} onChange={(e) => setRowLabel(i, e.target.value)}
                  disabled={locked} aria-label={`Row ${i + 1} label`} maxLength={3}
                  className={`w-10 rounded border p-1 text-center text-xs font-bold ${rowErrors[i]?.label ? 'border-red-400' : 'border-slate-300'} ${locked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
                <input
                  type="number" min="1" max="100"
                  value={rowCountValue(i, r)}
                  onChange={(e) => onRowCountChange(i, e.target.value)}
                  onBlur={() => commitRowCount(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { commitRowCount(i); e.currentTarget.blur(); } }}
                  disabled={locked} aria-label={`Row ${i + 1} seat count`}
                  className={`w-14 rounded border p-1 text-center text-xs ${rowErrors[i]?.count ? 'border-red-400' : 'border-slate-300'} ${locked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
                {!locked && (
                  <button type="button" onClick={() => removeRow(i)} aria-label={`Remove row ${r.rowLabel}`} className="text-red-500 hover:text-red-700 text-xs px-1">x</button>
                )}
              </div>
              {rowErrors[i]?.label && (
                <p className="px-1 text-[10px] font-medium text-red-600">{rowErrors[i].label === 'required' ? 'Row name must be 1-3 letters' : 'Row name already used'}</p>
              )}
              {rowErrors[i]?.count && (
                <p className="px-1 text-[10px] font-medium text-red-600">Seats must be 1-100.</p>
              )}
            </div>
          ))}
          {/* Add Single Row lives in the Configure Layout tool (activeStep 'rows'), not here - one button,
              one place. */}
        </div>

        {/* Per-tab tool - desktop col2/row1 inline; mobile a dismissible bottom sheet that opens on a tab
            tap (see the tab onClick). The Layout / Aisles / Reservations tools are unchanged. */}
        {!locked && (
          <>
            <div onClick={() => setSheetOpen(false)} className={`${sheetOpen ? 'block' : 'hidden'} sm:hidden fixed inset-0 z-40 bg-black/30`} />
            <div
              data-testid="tool-panel"
              data-open={sheetOpen}
              className={`${sheetOpen ? 'block' : 'hidden'} sm:block fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white px-4 pb-[calc(3.5rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl sm:static sm:z-auto sm:col-start-2 sm:row-start-1 sm:max-h-none sm:overflow-visible sm:rounded-none sm:border-t-0 sm:border-b sm:py-3 sm:pb-3 sm:shadow-none`}
            >
              {/* Mobile sheet chrome: a drag handle + Done (dismiss to interact with the map). */}
              <div className="sm:hidden">
                <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300" />
                <div className="mb-2 flex justify-end">
                  <button type="button" onClick={() => setSheetOpen(false)} className="text-sm font-medium text-teal-700">Done</button>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                {/* Tab 1 - Layout */}
                {activeStep === 'rows' && (
                  <>
                    {/* Row 1 - heading */}
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-teal-400 bg-teal-50 text-teal-700"><MdEventSeat className="h-2.5 w-2.5" /></span>
                      Layout Settings
                    </div>
                    {/* Row 2 - Seating Capacity: configured (green when it matches, red when not) / total; a
                        mismatch shows an explicit error right here. */}
                    <div>
                      <div className="flex items-center gap-1.5" data-testid="capacity-badge">
                        <span className="text-slate-500">Seating Capacity</span>
                        <span className={matches ? 'font-medium text-green-600' : 'font-medium text-red-600'}>{totalSeats}</span>
                        <span className="text-slate-400">/</span>
                        <span className="font-medium text-slate-900">{cap}</span>
                      </div>
                      {cap > 0 && !matches && (
                        <p className="mt-0.5 text-xs font-medium text-red-600">Configured seats do not match the {cap} capacity.</p>
                      )}
                    </div>
                    {/* Row 3 - the calculator, its fields indented under the heading. */}
                    <div className="font-semibold text-slate-700">configure layout</div>
                    <div className="flex flex-col gap-2 pl-3">
                      <label className="flex items-center gap-2">
                        <span className="w-32 shrink-0 text-slate-500">Row Label</span>
                        <input type="text" value={genLabel} onChange={(e) => setGenLabel(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} disabled={locked} aria-label="Row Label" maxLength={3} placeholder="A" className="w-12 rounded border border-slate-300 p-1 text-center font-bold disabled:bg-slate-100" />
                        <span className="text-xs text-slate-400">
                          e.g. A, AA, VIP
                          <span className="block">front row, max 3 letters</span>
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="w-32 shrink-0 text-slate-500">Number Of Rows</span>
                        <input type="number" min="1" max="100" value={genRows} onChange={(e) => setGenRows(e.target.value)} disabled={locked} aria-label="Number Of Rows" className={`w-14 rounded border p-1 text-center disabled:bg-slate-100 ${rowsError ? 'border-red-400' : 'border-slate-300'}`} />
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="w-32 shrink-0 text-slate-500">Seats Per Row</span>
                        <input type="number" min="1" max="100" value={genSeats} onChange={(e) => setGenSeats(e.target.value)} disabled={locked} aria-label="Seats Per Row" className={`w-14 rounded border p-1 text-center disabled:bg-slate-100 ${seatsError ? 'border-red-400' : 'border-slate-300'}`} />
                      </label>
                      {(rowsError || seatsError) && (
                        <p className="text-xs font-medium text-red-600">Number Of Rows and Seats Per Row must each be a number from 1 to 100.</p>
                      )}
                      {/* Bulk Add builds the whole block (flips to Clear once rows exist); Add Single Row
                          appends one more row copying the last row's seats - same behaviour as before, just
                          relocated here from the Row/Seats Configuration list. */}
                      <div className="flex flex-wrap gap-2">
                        {rows.length > 0 ? (
                          <button type="button" onClick={clearLayout} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Clear</button>
                        ) : (
                          <button type="button" onClick={addLayout} disabled={!canAdd} className={`rounded px-3 py-1 text-xs font-medium ${canAdd ? 'bg-teal-700 text-white hover:bg-teal-800' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}>Add</button>
                        )}
                        {rows.length > 0 && (
                          <button type="button" onClick={addRow} disabled={atCapacity} title={atCapacity ? 'At capacity - no room for another row' : ''} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">Add Single Row</button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Tab 2 - Aisles */}
                {activeStep === 'aisles' && (
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
                          <input type="number" min="1" value={aisleSeat} onChange={(e) => setAisleSeat(e.target.value)} aria-label="Aisle seat number" className={`w-14 rounded border p-1 text-center ${aisleError ? 'border-red-400' : 'border-slate-300'}`} />
                          <button type="button" onClick={applyAisleToAll} className="rounded border border-amber-400 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">Apply to all rows</button>
                          <button type="button" onClick={removeAisleFromAll} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">Remove from all rows</button>
                          <button type="button" onClick={clearAllAisles} disabled={!rows.some((r) => (r.walkwayPositions || []).length)} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Clear all aisles</button>
                        </div>
                        {aisleError && (
                          <p className="mt-1 text-xs font-medium text-red-600">No row has a seat after {aisleSeat}.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Tab 3 - Reserved */}
                {activeStep === 'reserved' && (
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
                          <input type="text" value={bulkInput} onChange={(e) => { setBulkInput(e.target.value.toUpperCase()); if (bulkError) setBulkError(''); }} onBlur={checkBulkOnBlur} onKeyDown={(e) => { if (e.key === 'Enter') applyBulkReserve(); }} aria-label="Bulk reserve seats" placeholder="A1, A4-A6" className={`w-40 rounded border p-1 ${bulkError ? 'border-red-400' : 'border-slate-300'}`} />
                          <button type="button" onClick={applyBulkReserve} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Apply</button>
                        </div>
                        {bulkError ? (
                          <p className="mt-1 text-xs font-medium text-red-600">{bulkError}</p>
                        ) : (
                          <p className="mt-1 text-xs italic text-slate-400">Type seats (e.g. A1, A4-A6) and Apply to reserve them in one go.</p>
                        )}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
