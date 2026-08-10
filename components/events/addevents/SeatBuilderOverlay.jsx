'use client';

// Full-screen one-canvas hall designer (featureplans/events-seatbuilder-redesign.md).
// An OVERLAY mounted inside the wizard step (no route change): Cancel/Save drop back to the exact
// wizard state. Generate the skeleton by numbers, then shape visually on a single zoomable canvas
// that shares the attendee map's colour vocabulary. Edits only walkwayPositions + organizerReservedSeats.
// Mobile layout (featureplans/events-seatbuilder-mobile.md): tabs -> MAP (primary) -> Row/Seats list,
// with the per-tab tool in a dismissible bottom sheet; desktop keeps the sidebar-left / canvas-right layout.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MdEventSeat, MdFitScreen, MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';
import { nextRowLabel, parseReservedLabels, formatReservedLabels, sanitizeRowLabel } from '@/utils/events/seatBuilder';

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
  // Not-for-sale (events-blocked-seats.md): grey with an X, unclickable outside its own tab.
  if (status === 'blocked') return 'bg-slate-200 text-slate-500 border-slate-400 cursor-not-allowed';
  // Hover gated to true hover devices ([@media(hover:hover)]) so a touch tap toggles the seat on the first
  // tap (a sticky-hover seat would only reveal the card first) - parity with the attendee SeatButton.
  return 'bg-teal-50 text-teal-700 border-teal-400 [@media(hover:hover)]:hover:bg-teal-100 cursor-pointer';
};

export default function SeatBuilderOverlay({
  initialLayout, initialReserved, initialBlocked, capacity, onSave, onClose,
}) {
  const [rows, setRows] = useState(() => JSON.parse(JSON.stringify(initialLayout || [])));
  const [reserved, setReserved] = useState(initialReserved || '');
  const [blocked, setBlocked] = useState(initialBlocked || ''); // not-for-sale list (events-blocked-seats.md)
  const [bulkBlockInput, setBulkBlockInput] = useState(''); // one-time Bulk "Not for sale" entry
  const [bulkBlockError, setBulkBlockError] = useState('');
  const [scale, setScale] = useState(1);
  const [genLabel, setGenLabel] = useState('A'); // starting row label for the Layout calculator
  const [genRows, setGenRows] = useState('');    // empty until the organiser types
  const [genSeats, setGenSeats] = useState('');
  const [aisleSeat, setAisleSeat] = useState('');
  const [aisleRow, setAisleRow] = useState(''); // Row label for the precise single-row Add/Clear
  const [aisleHelpOpen, setAisleHelpOpen] = useState(false); // the (i) that reveals the tap-a-seam how-to
  const [bulkInput, setBulkInput] = useState(''); // one-time Bulk Reserve entry (not the live reserved list)
  const [bulkError, setBulkError] = useState(''); // set on Apply/blur when tokens are not real seats
  const [activeStep, setActiveStep] = useState('rows'); // sidebar step in focus: rows | aisles | reserved
  const [sheetOpen, setSheetOpen] = useState(false);    // MOBILE: the per-tab tool bottom sheet (desktop shows the tool inline)
  const [confirmDiscard, setConfirmDiscard] = useState(false); // Cancel/Escape guard when there are unsaved edits

  // Dirty = the layout or the reserved list differs from what the builder opened with. memoised so the
  // frequent zoom/pan re-renders do not re-stringify the whole hall.
  const dirty = useMemo(
    () => JSON.stringify(rows) !== JSON.stringify(initialLayout || [])
      || reserved !== (initialReserved || '')
      || blocked !== (initialBlocked || ''),
    [rows, reserved, blocked, initialLayout, initialReserved, initialBlocked],
  );
  // Cancel/Escape route through here: prompt only when there is something to lose, else close straight away.
  const requestClose = () => { if (dirty) setConfirmDiscard(true); else onClose(); };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { if (dirty) setConfirmDiscard(true); else onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, onClose]);

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
  // Not-for-sale list mirrors reserved (events-blocked-seats.md).
  const blockedSet = useMemo(() => parseReservedLabels(blocked), [blocked]);
  const blockedTokens = useMemo(() => {
    const s = formatReservedLabels(blockedSet);
    return s ? s.split(',').map((t) => t.trim()).filter(Boolean) : [];
  }, [blockedSet]);
  const totalSeats = rows.reduce((t, r) => t + (r.seats?.length || 0), 0);
  const cap = Number(capacity) || 0;
  const matches = cap > 0 && totalSeats === cap;
  const atCapacity = cap > 0 && totalSeats >= cap; // configured seats reached capacity - no room for more rows
  // Reserved + not-for-sale are mutually exclusive (a seat is never in both), so their sizes sum. Every
  // seat held back one way or another = nothing left to sell.
  const heldBack = reservedSet.size + blockedSet.size;
  const allReserved = totalSeats > 0 && heldBack >= totalSeats;
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
  // Seated lock (events-edit-locking.md, revised): a seated event is a fixed room, so once a seat is
  // BOOKED the whole layout structure freezes - no adding, removing, resizing, renaming rows or aisles,
  // and the bulk calculator is off. The only live action is reserving/releasing the seats that are
  // still free. The server re-checks every rule at save.
  const hasBooked = (initialLayout || []).some((r) => (r.seats || []).some((s) => s.status === 'booked'));
  // Canvas edits are gated to their tab: aisles (seam clicks) only on the Aisles tab, reserving (seat
  // clicks) only on the Seat Reservations tab. Aisles freeze once sold; reserving free seats stays live.
  const canAisle = !hasBooked && activeStep === 'aisles';
  const canReserve = activeStep === 'reserved';
  const canBlock = activeStep === 'blocked'; // not-for-sale toggling is only editable on the Not for sale tab

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
    setBlocked(''); // ...and the not-for-sale list
  };

  // Layout calculator: ONE button with two faces. With no rows it reads "Add" and builds the skeleton
  // from the two numbers; once rows exist it reads "Clear" and wipes the rows (back to "Add"), leaving
  // the typed numbers in the boxes. No auto-create on typing or blur.
  const addLayout = () => {
    if (hasBooked) return; // the bulk calculator would renumber booked seats (D12)
    const r = Math.max(1, Math.min(100, parseInt(genRows, 10) || 0));
    const s = Math.max(1, Math.min(100, parseInt(genSeats, 10) || 0));
    if (!r || !s) return;
    const start = sanitizeRowLabel(genLabel) || 'A';
    generateDims(r, s, start);
  };
  const clearLayout = () => {
    if (hasBooked) return; // clearing would drop booked seats (D12)
    setRows([]);
    setReserved('');
    setBlocked('');
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
    const v = sanitizeRowLabel(value);
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, rowLabel: v } : r)));
  };

  const setRowCount = (idx, value) => {
    const requested = Math.max(1, Math.min(100, parseInt(value, 10) || 1));
    const label = rows[idx]?.rowLabel || '';
    // Preserve existing seats (incl. booked) and only append/truncate at the END - never below the
    // last booked seat in the row (edit-locking D12: booked seats can't be removed or renumbered).
    const existing = rows[idx]?.seats || [];
    const lastBooked = existing.reduce((m, s) => (s.status === 'booked' ? Math.max(m, Number(s.seatNumber)) : m), 0);
    const n = Math.max(requested, lastBooked);
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const seats = n >= existing.length
        ? [...existing, ...Array.from({ length: n - existing.length }, (_, k) => ({ seatNumber: existing.length + k + 1, status: 'available' }))]
        : existing.slice(0, n);
      const walkwayPositions = (r.walkwayPositions || []).filter((p) => p <= n - 1);
      return { ...r, seats, walkwayPositions };
    }));
    // Silent self-cleaning: a shrunk row drops any reserved/not-for-sale seat that no longer exists.
    if (label) {
      const dropOrphans = (prevList) => {
        const set = parseReservedLabels(prevList);
        const kept = [...set].filter((lbl) => {
          const m = lbl.match(/^([A-Z]+)(\d+)$/);
          return !(m && m[1] === label && Number(m[2]) > n);
        });
        return kept.length === set.size ? prevList : formatReservedLabels(new Set(kept));
      };
      setReserved(dropOrphans);
      setBlocked(dropOrphans);
    }
  };

  // Seat-count field: type freely (empty allowed) via a per-row draft; validate + apply only on
  // blur/Enter, so the field never fights the typist or snaps to a default nobody typed (item 12).
  const [countDrafts, setCountDrafts] = useState({});
  const rowCountValue = (i, r) => (countDrafts[i] !== undefined ? countDrafts[i] : String(r.seats?.length || 0));
  const onRowCountChange = (i, value) => setCountDrafts((d) => ({ ...d, [i]: value }));
  const commitRowCount = (i) => {
    const raw = countDrafts[i];
    const num = Number(raw);
    // Apply only a valid whole number 1-100; reject (never silently clamp) an out-of-range or decimal
    // count by KEEPING the draft, so the inline error stays and Save is blocked (AC16). Empty reverts.
    if (raw !== undefined && String(raw).trim() !== '' && Number.isInteger(num) && num >= 1 && num <= 100) {
      setRowCount(i, num);
      setCountDrafts((d) => { const c = { ...d }; delete c[i]; return c; });
    } else if (raw === undefined || String(raw).trim() === '') {
      setCountDrafts((d) => { const c = { ...d }; delete c[i]; return c; });
    }
    // else: invalid (0/negative/>100/decimal) - leave the draft so rowErrors flags it and Save blocks.
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
    const num = Number(raw);
    // A seat count must be a whole number 1-100 (reject 0/negative/decimal/>100 - AC16).
    const count = String(raw).trim() !== '' && (!Number.isInteger(num) || num < 1 || num > 100);
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
  // The precise Row+Seat button mirrors a seam click: if that row already has a lane at that seat it CLEARS,
  // otherwise it ADDS. Row must exist and the seat must fall inside it.
  const aisleRowIdx = rows.findIndex((r) => (r.rowLabel || '').toUpperCase() === aisleRow.trim().toUpperCase());
  const singleAislePresent = aisleRowIdx >= 0 && Number.isInteger(aislePos) && (rows[aisleRowIdx].walkwayPositions || []).includes(aislePos);
  const canAddSingle = aisleRowIdx >= 0 && Number.isInteger(aislePos) && aislePos >= 1 && aislePos <= ((rows[aisleRowIdx].seats?.length || 0) - 1);
  const canApplyAisle = Number.isInteger(aislePos) && aislePos >= 1 && !aisleError; // for "Apply to all rows"
  // Live validation for the precise Row+Seat control, checked against the layout being built: a row name
  // that is not in the hall, or a seat past that row's last seat, is flagged in red as the organiser types.
  const aisleRowMissing = aisleRow.trim() !== '' && aisleRowIdx < 0;
  const aisleSeatOutOfRow = aisleRowIdx >= 0 && Number.isInteger(aislePos) && aislePos >= 1
    && aislePos > ((rows[aisleRowIdx].seats?.length || 0) - 1);
  const singleAisleError = aisleRowMissing
    ? `Row ${aisleRow.trim()} does not exist.`
    : (aisleSeatOutOfRow ? `Row ${rows[aisleRowIdx].rowLabel} has only ${rows[aisleRowIdx].seats?.length || 0} seats.` : '');
  // Exactly one of Row / Seat filled - the "dead Add" case worth a gentle nudge.
  const aisleSinglePartial = (aisleRow.trim() !== '') !== (String(aisleSeat).trim() !== '');

  // ── Walkways ─────────────────────────────────────────────────────────────
  // A seam click STAGES the spot: it fills Row + Seat (and opens the sheet on mobile) but does not toggle
  // the aisle. The Add/Clear button then acts - Add on an empty gap, Clear on an active aisle - so placing
  // and removing go through the one control whether you clicked the map or typed Row + Seat.
  const stageSeam = (idx, pos) => {
    if (!canAisle) return; // aisles are only editable on the Aisles tab
    setAisleRow(rows[idx]?.rowLabel || '');
    setAisleSeat(String(pos));
    setSheetOpen(true);
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

  // Precise single-row Add/Clear: toggle the aisle after Seat in the one Row named in the fields.
  const addAisleToRow = () => {
    const pos = parseInt(aisleSeat, 10);
    const idx = rows.findIndex((r) => (r.rowLabel || '').toUpperCase() === aisleRow.toUpperCase());
    if (idx < 0 || !Number.isInteger(pos) || pos < 1) return;
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const max = (r.seats?.length || 0) - 1;
      if (pos > max) return r; // can't cut past this row's last seat
      const cur = r.walkwayPositions || [];
      return cur.includes(pos) ? r : { ...r, walkwayPositions: [...cur, pos].sort((a, b) => a - b) };
    }));
    setAisleSeat('');
  };
  const removeAisleFromRow = () => {
    const pos = parseInt(aisleSeat, 10);
    const idx = rows.findIndex((r) => (r.rowLabel || '').toUpperCase() === aisleRow.toUpperCase());
    if (idx < 0 || !Number.isInteger(pos) || pos < 1) return;
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, walkwayPositions: (r.walkwayPositions || []).filter((p) => p !== pos) } : r)));
    setAisleSeat('');
  };

  // Nuke every aisle from every row in one click.
  const clearAllAisles = () => setRows((prev) => prev.map((r) => ({ ...r, walkwayPositions: [] })));

  // ── Reserve (two-way with the typed box) ──────────────────────────────────
  const toggleReserve = (label, booked) => {
    if (!canReserve || booked) return; // reserving is only editable on the Seat Reservations tab (and never after a sale)
    if (blockedSet.has(label)) return; // a not-for-sale seat is never reservable
    const set = parseReservedLabels(reserved);
    if (set.has(label)) {
      set.delete(label);
    } else {
      if (heldBack + 1 >= totalSeats) { // holding this one back too would leave nothing to sell
        signpost('At least one seat must stay unreserved for sale.');
        setSheetOpen(true);
        return;
      }
      set.add(label);
    }
    setReserved(formatReservedLabels(set));
    setSheetOpen(true); // mobile: pop the sheet so the Seats Reserved summary + Bulk Reserve are visible
  };

  // ── Not for sale (two-way with the typed box) - mirrors reserve on the blocked list ────────
  const toggleBlock = (label, booked) => {
    if (!canBlock || booked) return; // editable only on the Not for sale tab; a booked seat is never markable
    if (reservedSet.has(label)) return; // a reserved (VIP) seat is never markable not-for-sale
    const set = parseReservedLabels(blocked);
    if (set.has(label)) {
      set.delete(label);
    } else {
      if (heldBack + 1 >= totalSeats) { // holding this one back too would leave nothing to sell
        signpost('At least one seat must stay for sale.');
        setSheetOpen(true);
        return;
      }
      set.add(label);
    }
    setBlocked(formatReservedLabels(set));
    setSheetOpen(true);
  };

  // Route a map seat click to the active tab's toggle (reserve on Reservations, block on Not for sale).
  const onSeatMapClick = (label, booked) => {
    if (canReserve) toggleReserve(label, booked);
    else if (canBlock) toggleBlock(label, booked);
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
    const merged = new Set([...reservedSet, ...add]);
    if (totalSeats > 0 && merged.size >= totalSeats) { // would hold back every seat
      setBulkError('At least one seat must stay unreserved for sale.');
      return;
    }
    if (add.size) setReserved(formatReservedLabels(merged));
    setBulkError('');
    setBulkInput('');
  };
  const checkBulkOnBlur = () => {
    if (String(bulkInput).trim() === '') { setBulkError(''); return; }
    const culprits = bulkCulprits();
    setBulkError(culprits.length ? `Not in your hall: ${culprits.join(', ')}` : '');
  };

  // Bulk "Not for sale": mirrors Bulk Reserve on the blocked list. Culprits = tokens not in the hall,
  // OR seats already reserved (a reserved seat can't also be not-for-sale).
  const bulkBlockCulprits = () => [...parseReservedLabels(bulkBlockInput)]
    .filter((lbl) => !allSeatLabels.has(lbl) || reservedSet.has(lbl));
  const applyBulkBlock = () => {
    if (String(bulkBlockInput).trim() === '') { setBulkBlockError(''); return; }
    const culprits = bulkBlockCulprits();
    if (culprits.length) { setBulkBlockError(`Not available to block: ${culprits.join(', ')}`); return; }
    const add = parseReservedLabels(bulkBlockInput);
    const merged = new Set([...blockedSet, ...add]);
    if (totalSeats > 0 && (merged.size + reservedSet.size) >= totalSeats) { // would hold back every seat
      setBulkBlockError('At least one seat must stay for sale.');
      return;
    }
    if (add.size) setBlocked(formatReservedLabels(merged));
    setBulkBlockError('');
    setBulkBlockInput('');
  };
  const checkBulkBlockOnBlur = () => {
    if (String(bulkBlockInput).trim() === '') { setBulkBlockError(''); return; }
    const culprits = bulkBlockCulprits();
    setBulkBlockError(culprits.length ? `Not available to block: ${culprits.join(', ')}` : '');
  };

  // Save - the ONE gate. Tab switches are always free; validation only blocks Save.
  const nameList = (arr) => (arr.length <= 1 ? (arr[0] || '') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`);
  // One signpost toast at a time (shared id = never stacked). Placed TOP-CENTER: the bottom is now taken
  // by the mobile tool sheet (Layout/Aisles/Reservations), and the top-right Save button is clear of a
  // centred toast - so the error blocks neither the controls being fixed nor re-saving after the fix.
  const signpost = (msg) => toast.error(msg, { toastId: 'seatbuilder-validation', position: 'top-center' });
  const save = () => {
    if (rows.length === 0) {
      // An empty layout is a valid saved state (no assigned seating): let the organiser clear the
      // hall, Save, and exit to check other steps (D12/AC17).
      onSave([], [], []);
      return;
    }
    // Structural field errors first (fix these before capacity is even meaningful).
    const badTabs = [];
    if (rowsError || seatsError || anyRowError) badTabs.push('Layout'); // the row list counts as Layout
    if (aisleError) badTabs.push('Aisles');
    if (bulkError || allReserved) badTabs.push('Reservations'); // all-held-back leaves nothing to sell
    if (bulkBlockError) badTabs.push('Not for sale');
    if (badTabs.length) {
      signpost(`${nameList(badTabs)} ${badTabs.length > 1 ? 'have' : 'has'} errors.`);
      return;
    }
    // Then capacity: configured seats must EXACTLY equal capacity - over AND under both block.
    if (cap > 0 && totalSeats !== cap) {
      const diff = Math.abs(totalSeats - cap);
      signpost(totalSeats > cap ? `Over capacity by ${diff} - remove ${diff} to save.` : `Under capacity by ${diff} - add ${diff} to save.`);
      return;
    }
    onSave(rows, reserved, blocked);
  };

  const steps = [
    { key: 'rows', n: '1', label: 'Layout' },
    { key: 'aisles', n: '2', label: 'Aisles' },
    { key: 'reserved', n: '3', label: 'Reservations' },
    { key: 'blocked', n: '4', label: 'Not for sale' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-x-clip bg-white" data-testid="seat-builder-overlay">
      {/* Header (kept above the mobile tool-sheet backdrop so Cancel/Save stay reachable) */}
      <div className="relative z-50 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="text-sm sm:text-base font-semibold text-slate-800">Seating layout</h2>
        <div className="ml-auto flex items-center gap-3">
          <button type="button" onClick={requestClose} className="text-sm font-medium text-slate-500 hover:text-slate-700">Cancel</button>
          <button type="button" onClick={save} className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800">Save</button>
        </div>
      </div>

      {/* Body: a responsive grid. Desktop (sm+) keeps the sidebar-left (tabs + Row/Seats list) /
          canvas-right (tool + map) layout. Mobile stacks tabs -> MAP (primary) -> Row/Seats list, and
          the per-tab tool opens as a dismissible bottom sheet (tab tap opens it; Done / backdrop dismiss).
          Seat editing, zoom, validation and Save are unchanged - only the arrangement moves. */}
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)] sm:grid-cols-[14rem_minmax(0,1fr)] sm:grid-rows-[auto_minmax(0,1fr)]">

        {/* Tabs - desktop col1/row1; mobile row1. Always shown; safe edits stay available after a sale. */}
        {(
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
          {cap > 0 && totalSeats > cap && (
            <div data-testid="capacity-error" className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-700">
              Over capacity by {totalSeats - cap} seat{totalSeats - cap === 1 ? '' : 's'} - remove {totalSeats - cap} to match the {cap}-seat capacity.
            </div>
          )}
          {rows.length === 0 ? (
            /* Empty hall: a short guide to the three tabs instead of a blank map. */
            <div data-testid="builder-empty" className="flex min-h-0 min-w-0 flex-1 items-center justify-center p-4">
              <div className="max-w-sm text-sm text-slate-600">
                <div className="mb-3 text-center font-semibold text-slate-800">Build your seating layout</div>
                <ul className="space-y-2">
                  <li><span className="font-medium text-slate-800">Layout</span> - set the number of rows and seats to build the hall; fine-tune each row in the Row/Seats list.</li>
                  <li><span className="font-medium text-slate-800">Aisles</span> - add walkways between seats (tap a gap on the map, or set Row + Seat).</li>
                  <li><span className="font-medium text-slate-800">Reservations</span> - hold seats back from public sale.</li>
                  <li><span className="font-medium text-slate-800">Not for sale</span> - mark seats that are never sold (a pillar, a broken seat, a buffer).</li>
                </ul>
                <div className="mt-3 text-center text-slate-500">Start in the Layout tab.</div>
              </div>
            </div>
          ) : (
            <>
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
                      <span className="flex items-center gap-1"><span className="flex h-3.5 w-3.5 items-center justify-center rounded border border-slate-400 bg-slate-200"><MdClose className="h-2 w-2 text-slate-500" /></span>Not for sale</span>
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
                            const isBlocked = blockedSet.has(label);
                            const isReserved = reservedSet.has(label);
                            const status = booked ? 'booked' : isBlocked ? 'blocked' : (isReserved ? 'reserved' : 'available');
                            // Clickable only on the matching tab, and never a seat owned by the other list.
                            const seatDisabled = booked || (!canReserve && !canBlock)
                              || (canReserve && isBlocked) || (canBlock && isReserved);
                            const hasWalkway = (row.walkwayPositions || []).includes(pos);
                            return (
                              <span key={label} className="flex items-center">
                                <div className="relative group">
                                  <button
                                    type="button"
                                    onClick={() => onSeatMapClick(label, booked)}
                                    disabled={seatDisabled}
                                    aria-label={`Seat ${label}`}
                                    data-status={status}
                                    className={`flex h-5 w-5 items-center justify-center rounded border text-[8px] font-medium ${seatClass(status)}`}
                                  >
                                    {status === 'blocked'
                                      ? <MdClose className="h-2.5 w-2.5" />
                                      : (showNumbers ? seat.seatNumber : <MdEventSeat className="h-2.5 w-2.5" />)}
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
                                      onClick={() => stageSeam(rowIndex, pos)}
                                      disabled={!canAisle}
                                      aria-label={`Remove walkway after seat ${pos} in row ${row.rowLabel}`}
                                      data-walkway="true"
                                      className="mx-0.5 h-5 w-3 self-stretch rounded-sm bg-amber-400 hover:bg-amber-500 disabled:hover:bg-amber-400"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => stageSeam(rowIndex, pos)}
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
            </>
          )}
        </div>

        {/* Row/Seats Configuration: the real per-row seat counts - desktop col1/row2; mobile row3, a
            capped scroll area below the map so a tall hall never crowds it. */}
        <div className="min-h-0 overflow-y-auto border-t border-slate-200 p-2 sm:col-start-1 sm:row-start-2 sm:border-r" data-testid="rows-panel">
          <div className="mb-1 flex items-center justify-between gap-2 px-1">
            <h3 className="text-xs font-semibold text-slate-600">Row/Seats Configuration</h3>
            {!hasBooked && rows.length > 0 && (
              <button type="button" onClick={addRow} disabled={atCapacity} title={atCapacity ? 'At capacity - no room for another row' : ''} className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:hover:bg-transparent">Add Single Row</button>
            )}
          </div>
          {rows.length === 0 && <p className="px-1 py-1 text-xs text-slate-400">No rows yet - use configure layout to set Number Of Rows and Seats Per Row.</p>}
          {rows.map((r, i) => (
            <div key={i} className="mb-1">
              <div className="flex items-center gap-1">
                <input
                  value={r.rowLabel || ''} onChange={(e) => setRowLabel(i, e.target.value)}
                  disabled={hasBooked} aria-label={`Row ${i + 1} label`} maxLength={3}
                  className={`w-10 rounded border p-1 text-center text-xs font-bold ${rowErrors[i]?.label ? 'border-red-400' : 'border-slate-300'} ${hasBooked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                />
                <input
                  type="number" min="1" max="100"
                  value={rowCountValue(i, r)}
                  onChange={(e) => onRowCountChange(i, e.target.value)}
                  onBlur={() => commitRowCount(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { commitRowCount(i); e.currentTarget.blur(); } }}
                  disabled={hasBooked} aria-label={`Row ${i + 1} seat count`}
                  className={`w-14 rounded border p-1 text-center text-xs ${rowErrors[i]?.count ? 'border-red-400' : 'border-slate-300'} ${hasBooked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                />
                {!hasBooked && (
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
            tap. Always shown; after a sale the Aisles/Reservations tools still work and only the Layout
            bulk calculator is disabled. */}
        {(
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
                        <input type="text" value={genLabel} onChange={(e) => setGenLabel(sanitizeRowLabel(e.target.value))} disabled={hasBooked} aria-label="Row Label" maxLength={3} placeholder="A" className="w-12 rounded border border-slate-300 p-1 text-center font-bold disabled:bg-slate-100" />
                        <span className="text-xs text-slate-400">
                          e.g. A, AA, VIP
                          <span className="block">front row, max 3 letters</span>
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="w-32 shrink-0 text-slate-500">Number Of Rows</span>
                        <input type="number" min="1" max="100" value={genRows} onChange={(e) => setGenRows(e.target.value)} disabled={hasBooked} aria-label="Number Of Rows" className={`w-14 rounded border p-1 text-center disabled:bg-slate-100 ${rowsError ? 'border-red-400' : 'border-slate-300'}`} />
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="w-32 shrink-0 text-slate-500">Seats Per Row</span>
                        <input type="number" min="1" max="100" value={genSeats} onChange={(e) => setGenSeats(e.target.value)} disabled={hasBooked} aria-label="Seats Per Row" className={`w-14 rounded border p-1 text-center disabled:bg-slate-100 ${seatsError ? 'border-red-400' : 'border-slate-300'}`} />
                      </label>
                      {(rowsError || seatsError) && (
                        <p className="text-xs font-medium text-red-600">Number Of Rows and Seats Per Row must each be a number from 1 to 100.</p>
                      )}
                      {/* Bulk Add builds the whole block (flips to Clear once rows exist); Add Single Row
                          appends one more row copying the last row's seats - same behaviour as before, just
                          relocated here from the Row/Seats Configuration list. */}
                      <div className="flex flex-wrap gap-2">
                        {rows.length > 0 ? (
                          <button type="button" onClick={clearLayout} disabled={hasBooked} title={hasBooked ? 'Seats are sold - the bulk layout tool is off' : ''} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:hover:bg-transparent">Clear</button>
                        ) : (
                          <button type="button" onClick={addLayout} disabled={!canAdd || hasBooked} className={`rounded px-3 py-1 text-xs font-medium ${canAdd && !hasBooked ? 'bg-teal-700 text-white hover:bg-teal-800' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}>Add</button>
                        )}
                        {rows.length > 0 && !hasBooked && (
                          <button type="button" onClick={addRow} disabled={atCapacity} title={atCapacity ? 'At capacity - no room for another row' : ''} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:hover:bg-transparent">Add Single Row</button>
                        )}
                      </div>
                      {/* Why the bulk tool is off - shown here beside it, not floating on the map. */}
                      {hasBooked && (
                        <p data-testid="builder-locked" className="mt-2 text-xs text-amber-600">
                          Some seats are sold, so the seating layout is locked. You can still reserve or release the seats that are still free.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Tab 2 - Aisles */}
                {activeStep === 'aisles' && (
                  <>
                    {/* Heading + a help (i): the "tap a seam to add/remove one aisle" how-to lives on demand,
                        not as standing text, to keep the mobile sheet compact. */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span className="h-4 w-3 rounded-sm bg-amber-400" />
                        Aisle Settings
                      </div>
                      <button
                        type="button"
                        onClick={() => setAisleHelpOpen((v) => !v)}
                        aria-label="How aisles work"
                        aria-expanded={aisleHelpOpen}
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                      >
                        {aisleHelpOpen ? 'x' : 'i'}
                      </button>
                    </div>
                    {aisleHelpOpen && (
                      <p className="text-xs text-slate-500">Tap between two seats on the map to add or remove a single aisle. The controls below add or remove an aisle across every row at once; Apply to all rows skips any row too short for that seat.</p>
                    )}
                    {/* Precise Row + Seat, with a single button that mirrors a seam click: Add when that seat
                        in that row has no lane, Clear when it already does. Tap a seam on the map to prefill. */}
                    <p className="text-xs text-slate-500">Click a gap on the map, or set Row and Seat below.</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-1"><span className="text-slate-500">Row</span>
                        <input type="text" value={aisleRow} onChange={(e) => setAisleRow(sanitizeRowLabel(e.target.value))} aria-label="Aisle row" maxLength={3} placeholder="A" className={`w-12 rounded border p-1 text-center font-bold ${aisleRowMissing ? 'border-red-400' : 'border-slate-300'}`} /></label>
                      <label className="flex items-center gap-1"><span className="text-slate-500">Seat</span>
                        <input type="number" min="1" value={aisleSeat} onChange={(e) => setAisleSeat(e.target.value)} aria-label="Aisle seat number" placeholder="20" className={`w-14 rounded border p-1 text-center ${aisleError || aisleSeatOutOfRow ? 'border-red-400' : 'border-slate-300'}`} /></label>
                      {singleAislePresent ? (
                        <button type="button" onClick={removeAisleFromRow} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Clear</button>
                      ) : (
                        <button type="button" onClick={addAisleToRow} disabled={!canAddSingle} className={`rounded px-3 py-1 text-xs font-medium ${canAddSingle ? 'border border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}>Add</button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={applyAisleToAll} disabled={!canApplyAisle} className={`rounded px-2 py-1 text-xs font-medium ${canApplyAisle ? 'border border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}>Apply to all rows</button>
                      <button type="button" onClick={clearAllAisles} disabled={!rows.some((r) => (r.walkwayPositions || []).length)} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed">Clear all aisles</button>
                    </div>
                    {singleAisleError ? (
                      <p className="text-xs font-medium text-red-600">{singleAisleError}</p>
                    ) : aisleError ? (
                      <p className="text-xs font-medium text-red-600">No row has a seat after {aisleSeat}.</p>
                    ) : aisleSinglePartial ? (
                      <p className="text-xs text-slate-400">Enter both a Row and a Seat.</p>
                    ) : null}
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

                {/* Tab 4 - Not for sale (cloned from Reservations; grey/X list) */}
                {activeStep === 'blocked' && (
                  <>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-400 bg-slate-200 text-slate-500"><MdClose className="h-2.5 w-2.5" /></span>
                      Not for sale
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="sm:pr-4">
                        <div className="font-medium text-teal-700">Manual Selection</div>
                        <p className="text-xs text-slate-500">Click an available seat to mark it not for sale (turns grey with an X). Click again to release.</p>
                      </div>
                      <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                        <div className="mb-1 font-medium text-slate-700">Bulk Not for sale</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <input type="text" value={bulkBlockInput} onChange={(e) => { setBulkBlockInput(e.target.value.toUpperCase()); if (bulkBlockError) setBulkBlockError(''); }} onBlur={checkBulkBlockOnBlur} onKeyDown={(e) => { if (e.key === 'Enter') applyBulkBlock(); }} aria-label="Bulk not for sale seats" placeholder="A1, A4-A6" className={`w-40 rounded border p-1 ${bulkBlockError ? 'border-red-400' : 'border-slate-300'}`} />
                          <button type="button" onClick={applyBulkBlock} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Apply</button>
                        </div>
                        {bulkBlockError ? (
                          <p className="mt-1 text-xs font-medium text-red-600">{bulkBlockError}</p>
                        ) : (
                          <p className="mt-1 text-xs italic text-slate-400">Type seats (e.g. A1, A4-A6) and Apply to mark them not for sale in one go.</p>
                        )}
                      </div>
                    </div>
                    {/* Not-for-sale summary - compact ranges, wraps as the list grows */}
                    <div className="border-t border-slate-200 pt-2">
                      <div className="mb-1 font-medium text-slate-700">Not for sale{blockedSet.size ? ` (${blockedSet.size})` : ''}</div>
                      {blockedTokens.length === 0 ? (
                        <p className="text-xs text-slate-400">None yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {blockedTokens.map((t) => (
                            <span key={t} className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{t}</span>
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

      {/* Unsaved-changes guard: Cancel/Escape with edits pending prompts before dropping the work. */}
      {confirmDiscard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-800">Discard changes?</h3>
            <p className="mt-1 text-sm text-slate-500">You have unsaved seating changes. Leave without saving?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDiscard(false)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Keep editing</button>
              <button type="button" onClick={onClose} className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
