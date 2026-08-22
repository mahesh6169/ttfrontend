// utils/events/attendeeCsv.js
//
// Attendee-CSV builder for the free-event check-in list card (events-rsvp-question-types.md D12).
// Fully automatic - no column choices. One row per registration; columns: registration number,
// contact mobile, attendee names (one cell), then one column per event question in builder order,
// headed by the full question text. Empty cell for an unanswered question; a pick-many answer joins
// its values with "; ". Built client-side with no extra libraries, like the PDF (attendeePdf.js).
//
// Encoded so double-clicking opens correctly in Excel (Windows + Mac), Google Sheets and Numbers:
// UTF-8 with the Excel byte-order marker and CRLF line ends. Mobile numbers are written as an Excel
// text formula (="04..."), so Excel keeps the leading zero instead of treating it as a number.

import axios from '@/utils/axiosConfig';
import { formatAnswerForExport } from '@/utils/events/exportAnswer';

// Quote a CSV field per RFC 4180: wrap in double quotes when it contains a comma, quote, CR or LF,
// or a leading '=' (so the Excel text formula survives), doubling any embedded quote.
const csvField = (value) => {
  const s = value == null ? '' : String(value);
  if (/[",\r\n]/.test(s) || s.startsWith('=')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

// Excel keeps the leading zero on a mobile only if the cell is text. ="04..." is the portable way.
const mobileCell = (mobile) => {
  const m = String(mobile || '').trim();
  return m ? `="${m}"` : '';
};

// Build + download the attendee CSV for one event.
//   event: { _id, title, registrationFields }
// Throws if the fetch fails; returns { empty: true } when there are no attendees to export.
export async function saveAttendeeCsv(event) {
  if (!event?._id) return { empty: true };

  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${event._id}/free/attendees?limit=10000`,
    { withCredentials: true }
  );
  const fetched = response.data?.registrations || [];
  if (fetched.length === 0) return { empty: true };

  // Export in sign-up order: oldest registration on top (the console shows newest-first, but a roster
  // reads top-to-bottom in the order people registered, with reg numbers ascending). Tie-break by
  // registration number so same-timestamp rows stay stable.
  const registrations = [...fetched].sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    if (ta !== tb) return ta - tb;
    return String(a.registrationNumber || '').localeCompare(String(b.registrationNumber || ''));
  });

  const nameKey = (v) => String(v ?? '').trim().toLowerCase();

  // One column per event question in builder order, keyed by the stable id and headed by the CURRENT
  // label (events-rsvp-question-editing.md D7). Prefer the questions the attendees endpoint returns
  // (freshest), else the event's own. If neither is available (an event reachable only via a ticket
  // snapshot), fall back to the answered labels in first-seen order so nothing answered is dropped.
  let columns = (response.data?.registrationFields || event.registrationFields || []).map((q) => ({
    qid: q.qid,
    label: q.fieldName,
  }));
  if (columns.length === 0) {
    const seen = new Set();
    for (const reg of registrations) {
      for (const r of reg.formResponses || []) {
        const k = nameKey(r?.fieldName);
        if (r?.fieldName && !seen.has(k)) {
          seen.add(k);
          columns.push({ qid: undefined, label: r.fieldName });
        }
      }
    }
  }

  const header = ['Registration Number', 'Mobile', 'Attendees', ...columns.map((c) => c.label)];

  const rows = registrations.map((reg) => {
    const responses = reg.formResponses || [];
    // Resolve an answer for a column by qid first (D3), then by the current label as a fallback.
    const cellFor = (col) => {
      const hit = responses.find(
        (r) =>
          (col.qid && r?.qid && String(r.qid) === String(col.qid)) ||
          nameKey(r?.fieldName) === nameKey(col.label)
      );
      return hit ? formatAnswerForExport(hit.response) : '';
    };
    const attendeeNames = (reg.attendees || []).map((a) => a.name || '').filter(Boolean).join('; ');
    return [
      reg.registrationNumber || '',
      mobileCell(reg.mobile),
      attendeeNames,
      ...columns.map(cellFor),
    ];
  });

  // CRLF line ends (Excel-friendly); UTF-8 BOM prepended below.
  const csvBody = [header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });

  const safeTitle = (event.title || 'attendees').replace(/[^a-z0-9\- ]/gi, '').trim() || 'attendees';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeTitle}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { empty: false };
}
