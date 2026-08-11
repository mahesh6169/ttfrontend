// Pure helpers for the one-canvas seat builder (featureplans/events-seatbuilder-redesign.md).

// Bijective base-26 (spreadsheet columns): A=1 ... Z=26, AA=27, AZ=52, BA=53, ...
const labelToNum = (s) => {
  let n = 0;
  for (const ch of s) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
};
const numToLabel = (n) => {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

/**
 * The next row label after `lastLabel`. A one/two-letter sequence label increments in spreadsheet
 * order (A->B, Z->AA, AA->AB, AZ->BA). A custom label (e.g. "VIP") has no sensible successor, so we
 * fall back to the next free single letter not already used - no cleverness attempted.
 * `skip` (events-layout-tools.md) omits chosen letters from the AUTO-generated sequence - the walk
 * jumps over any label matching a skip entry (default I, O). A never-reached entry is silently ignored.
 * @param {string} lastLabel
 * @param {string[]} existingLabels - labels already in the layout (to pick a free letter)
 * @param {string[]} skip - labels to omit from generation (e.g. ["I","O"])
 * @returns {string}
 */
export const nextRowLabel = (lastLabel = '', existingLabels = [], skip = []) => {
  const skipSet = new Set((skip || []).map((s) => String(s).toUpperCase()));
  if (/^[A-Z]{1,2}$/.test(lastLabel)) {
    let n = labelToNum(lastLabel) + 1;
    let candidate = numToLabel(n);
    while (skipSet.has(candidate)) candidate = numToLabel(++n); // jump over I, O, ...
    return candidate;
  }
  const used = new Set(existingLabels);
  for (let n = 1; ; n++) {
    const candidate = numToLabel(n);
    if (!used.has(candidate) && !skipSet.has(candidate)) return candidate;
  }
};

/** Parse a Skip-rows field ("I, O") into a deduped array of valid uppercase labels (["I","O"]).
 *  Uses the shared label rule, so entries are letters-only, max 3 (events-layout-tools.md). */
export const parseSkipRows = (str = '') =>
  [...new Set(String(str).split(',').map((s) => sanitizeRowLabel(s)).filter(Boolean))];

/**
 * Render orientation for one row (events-layout-tools.md). A horizontal flip reverses the seat draw
 * order (A3, A2, A1) and MIRRORS each walkway position ("after seat N" becomes "after seat len-N") so
 * the aisle lands on the correct side. It is a RENDER transform only - seat ids/numbers are untouched.
 * Both the builder map and the attendee map call this, so they always flip together.
 * @param {{seats?: any[], walkwayPositions?: number[]}} row
 * @param {boolean} flipH
 * @returns {{seats: any[], walkwayPositions: number[]}}
 */
export const orientRowForRender = (row = {}, flipH = false) => {
  const seats = row.seats || [];
  const walkwayPositions = row.walkwayPositions || [];
  if (!flipH) return { seats, walkwayPositions };
  const len = seats.length;
  return {
    seats: [...seats].reverse(),
    walkwayPositions: walkwayPositions.map((p) => len - p),
  };
};

/** The one row-label rule used everywhere (Layout calculator, per-row list, aisle Row): uppercase A-Z
 *  letters only, max 3 characters (A, AA, VIP). Keep this the single source so the panes never drift. */
export const sanitizeRowLabel = (raw = '') => String(raw).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);

// Organiser-reserved seats share the existing typed-box format ("A1,A4-A6,B2"). These convert between
// that string and a Set of seat labels ("A13") so the typed box and click-to-reserve edit one list.

/** Parse "A1,A4-A6,B2" -> Set of seat labels {"A1","A4","A5","A6","B2"}. */
export const parseReservedLabels = (str) => {
  const set = new Set();
  if (!str || typeof str !== 'string') return set;
  str.split(',').map((p) => p.trim().toUpperCase()).filter(Boolean).forEach((part) => {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map((x) => x.trim());
      const ma = a.match(/^([A-Z]+)(\d+)$/);
      const mb = b.match(/^([A-Z]+)(\d+)$/);
      if (ma && mb && ma[1] === mb[1]) {
        const row = ma[1];
        const lo = Math.min(+ma[2], +mb[2]);
        const hi = Math.max(+ma[2], +mb[2]);
        for (let i = lo; i <= hi; i++) set.add(`${row}${i}`);
      }
    } else if (/^[A-Z]+\d+$/.test(part)) {
      set.add(part);
    }
  });
  return set;
};

/** Format a set/array of seat labels back to the compact "A1,A4-A6,B2" string, ranges collapsed. */
export const formatReservedLabels = (labels) => {
  const byRow = {};
  for (const lab of labels) {
    const m = String(lab).match(/^([A-Z]+)(\d+)$/);
    if (m) (byRow[m[1]] = byRow[m[1]] || []).push(parseInt(m[2], 10));
  }
  const parts = [];
  Object.keys(byRow).sort().forEach((row) => {
    const nums = [...new Set(byRow[row])].sort((a, b) => a - b);
    let start = nums[0];
    let end = nums[0];
    const flush = () => parts.push(start === end ? `${row}${start}` : `${row}${start}-${row}${end}`);
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === end + 1) end = nums[i];
      else { flush(); start = nums[i]; end = nums[i]; }
    }
    if (nums.length) flush();
  });
  return parts.join(',');
};
