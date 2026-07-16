// Shared formatters for a campaign's valid days + hours (display only).

const DAY_LABELS = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
};
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ["monday","thursday"] -> "Mon, Thu". Empty/undefined -> null (means every day).
export const formatValidDays = (validDays) => {
  if (!Array.isArray(validDays) || validDays.length === 0) return null;
  const label = DAY_ORDER.filter(d => validDays.includes(d)).map(d => DAY_LABELS[d]).join(', ');
  return label || null;
};

// "16:30" -> "4:30pm". Whole hours drop the ":00" ("16:00" -> "4pm").
const formatTime = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return hhmm || '';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  return m === 0 ? `${h}${period}` : `${h}:${String(m).padStart(2, '0')}${period}`;
};

// [{start:"11:00",end:"15:00"},{start:"16:00",end:"02:00"}] -> "11am–3pm, 4pm–2am".
// Empty/undefined -> null.
export const formatValidHours = (validHours) => {
  if (!Array.isArray(validHours) || validHours.length === 0) return null;
  const windows = validHours
    .filter(w => w && w.start && w.end)
    .slice()
    .sort((a, b) => String(a.start).localeCompare(String(b.start))) // earliest-first, regardless of stored order
    .map(w => `${formatTime(w.start)}–${formatTime(w.end)}`);
  return windows.length ? windows.join(', ') : null;
};
