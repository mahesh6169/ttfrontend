// utils/events/attendeePdf.js
//
// Standalone attendee-PDF builder for the free-event check-in console (checkinrsvp).
// Lifted verbatim from the legacy /checkInFree page so the new list card's "Save PDF"
// (events-rsvp-checkin-redesign.md D6) reuses the same output without depending on the
// doomed legacy page. One row per registration; Reg No / Contact repeat on the top row,
// attendees and answers stack in their columns; compact 8pt table with page breaks.
//
// Fetches the full attendee list for the event (bypassing pagination) and saves a PDF
// named after the event. Returns nothing; throws on fetch/generation failure so the
// caller can toast.

import jsPDF from 'jspdf';
import axios from '@/utils/axiosConfig';

// Build + download the attendee PDF for one event.
//   event: { _id, title }
// Throws if the fetch or generation fails; returns { empty: true } when there are no
// attendees to export (caller decides how to signpost that).
export async function saveAttendeePdf(event) {
  if (!event?._id) return { empty: true };

  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${event._id}/free/attendees?limit=10000`,
    { withCredentials: true }
  );
  const registrations = response.data?.registrations || [];
  if (registrations.length === 0) return { empty: true };

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const leftMargin = 10;
  const rightMargin = 10;

  let y = 15;

  // Event title header
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(event.title || 'Attendees', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Column layout (Status removed; more room redistributed to attendee + info)
  const cols = {
    regNo:    { x: leftMargin,        width: 25 },
    contact:  { x: leftMargin + 25,   width: 25 },
    attendee: { x: leftMargin + 50,   width: 45 },
    info:     { x: leftMargin + 95,   width: pageWidth - rightMargin - (leftMargin + 95) },
  };

  const drawHeader = () => {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Reg No', cols.regNo.x, y);
    doc.text('Contact', cols.contact.x, y);
    doc.text('Attendee', cols.attendee.x, y);
    doc.text('Additional Information', cols.info.x, y);
    y += 2;
    doc.setDrawColor(120);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 4;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
  };

  drawHeader();

  // 8pt font renders at ~3.25mm per line; slot at 3.5mm leaves a sliver of padding.
  doc.setLineHeightFactor(1.05);
  const lineHeight = 3.5;
  const attendeeRowGap = 0.5;
  const answerGap = 1;
  const blockTrailingGap = 2;
  const dividerTrailingGap = 4;

  for (const reg of registrations) {
    const attendeesList = reg.attendees || [];
    const responses = (reg.formResponses || []).filter((r) => r && r.response);

    const answerBlocks = responses.map((r) => {
      const text = String(r.response || '');
      const lines = doc.splitTextToSize(text, cols.info.width);
      return { lines, height: lines.length * lineHeight };
    });

    const attendeesHeight = attendeesList.length > 0
      ? attendeesList.length * lineHeight + (attendeesList.length - 1) * attendeeRowGap
      : 0;
    const answersHeight = answerBlocks.reduce(
      (sum, b, i) => sum + b.height + (i < answerBlocks.length - 1 ? answerGap : 0),
      0
    );
    const blockHeight = Math.max(attendeesHeight, answersHeight, lineHeight);

    if (y + blockHeight + blockTrailingGap > pageHeight - 10) {
      doc.addPage();
      y = 15;
      drawHeader();
    }

    doc.text(reg.registrationNumber || '', cols.regNo.x, y);
    doc.text(reg.mobile || '', cols.contact.x, y);

    let attendeeY = y;
    for (const att of attendeesList) {
      doc.text(att.name || '', cols.attendee.x, attendeeY);
      attendeeY += lineHeight + attendeeRowGap;
    }

    let answerY = y;
    for (const block of answerBlocks) {
      doc.text(block.lines, cols.info.x, answerY);
      answerY += block.height + answerGap;
    }

    y += blockHeight + blockTrailingGap;

    doc.setDrawColor(220);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += dividerTrailingGap;
  }

  const safeTitle = (event.title || 'attendees').replace(/[^a-z0-9\- ]/gi, '').trim() || 'attendees';
  doc.save(`${safeTitle}.pdf`);
  return { empty: false };
}
