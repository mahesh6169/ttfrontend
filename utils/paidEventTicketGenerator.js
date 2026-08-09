import jsPDF from 'jspdf';
import { formatInTimeZone } from 'date-fns-tz';
import QRCode from 'qrcode';

/**
 * Generate a PDF for event tickets
 * @param {Array} tickets - Array of ticket objects
 * @param {Object} eventInfo - Event information (from ticket.eventSnapshot or event details)
 * @param {String} eventId - Event ID (fallback if eventCode not available)
 * @returns {void} - Downloads the PDF
 */
export const generateTicketsPDF = async (tickets, eventInfo, eventId = '') => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = 20;
  const midPoint = pageWidth / 2;
  let currentY = 20;
  
  // Format date and time
  let date = 'Date TBA';
  let time = 'Time TBA';
  if (eventInfo.dateTime && eventInfo.timeZone) {
    try {
      date = formatInTimeZone(eventInfo.dateTime, eventInfo.timeZone, 'dd/MM/yyyy');
      time = formatInTimeZone(eventInfo.dateTime, eventInfo.timeZone, 'h:mm a');
    } catch (error) {
      console.error('Date formatting error:', error);
      const fallbackDate = new Date(eventInfo.dateTime);
      date = fallbackDate.toLocaleDateString();
      time = fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  
  // Event Title [Large]
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(eventInfo.title || 'Event Ticket', pageWidth / 2, currentY, { align: 'center' });
  currentY += 12;
  
  // Event ID [Medium Font]
  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.text(`Event ID: ${eventInfo.eventCode || eventId}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 12;
  
  // First separator line
  doc.setDrawColor(150);
  doc.line(leftMargin, currentY, pageWidth - rightMargin, currentY);
  currentY += 10;
  
  // Two column layout - Details and Organiser [Small font]
  doc.setFontSize(10);
  
  // Left column - Details
  doc.setFont(undefined, 'bold');
  doc.text('Details:', leftMargin, currentY);
  doc.setFont(undefined, 'normal');
  
  let leftColY = currentY + 8;
  doc.text(`Date: ${date}`, leftMargin + 15, leftColY);
  leftColY += 6;
  doc.text(`Time/TimeZone: ${time} ${eventInfo.timeZone || ''}`, leftMargin + 15, leftColY);
  leftColY += 6;
  doc.text(`Venue: ${eventInfo.venue || 'TBA'}`, leftMargin + 15, leftColY);
  if (eventInfo.address) {
    leftColY += 6;
    // Handle long addresses
    const addressLines = doc.splitTextToSize(`Address: ${eventInfo.address}`, midPoint - leftMargin - 20);
    addressLines.forEach((line, index) => {
      doc.text(line, leftMargin + 15, leftColY + (index * 6));
    });
    leftColY += (addressLines.length * 6);
  }
  
  // Right column - Organiser
  doc.setFont(undefined, 'bold');
  doc.text('Organiser:', midPoint, currentY);
  doc.setFont(undefined, 'normal');
  
  let rightColY = currentY + 8;
  doc.text(`Name: ${eventInfo.organizer?.name || 'Event Organizer'}`, midPoint + 15, rightColY);
  rightColY += 6;
  if (eventInfo.organizer?.phone || eventInfo.organizer?.mobile) {
    doc.text(`Mobile: ${eventInfo.organizer.phone || eventInfo.organizer.mobile}`, midPoint + 15, rightColY);
    rightColY += 6;
  }
  if (eventInfo.organizer?.email) {
    doc.text(`Email: ${eventInfo.organizer.email}`, midPoint + 15, rightColY);
    rightColY += 6;
  }
  
  // Move to next section (use whichever column is longer)
  currentY = Math.max(leftColY, rightColY) + 10;
  
  // Second separator line
  doc.setDrawColor(150);
  doc.line(leftMargin, currentY, pageWidth - rightMargin, currentY);
  currentY += 10;
  
  // Tickets header [Large font]
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Tickets', leftMargin, currentY);
  currentY += 10;
  
  // Process each ticket - compact rows (QR on the left, details snug on the right), in ascending
  // ticket-number order. Large scannable QR, minimal gaps, one ticket block never split across pages.
  const orderedTickets = [...tickets].sort((a, b) =>
    String(a.ticketNumber || '').localeCompare(String(b.ticketNumber || ''))
  );
  const qrSize = 38;                       // mm - large + scannable, close to the on-screen My Tickets QR
  const textX = leftMargin + qrSize + 8;

  for (let index = 0; index < orderedTickets.length; index++) {
    const ticket = orderedTickets[index];
    const label = ticket.ticketNumber || `TICKET-${index + 1}`;
    const isRefunded = ticket.refundStatus === 'full' || ticket.checkInStatus === 'cancelled';

    // Keep a whole ticket block on one page.
    if (currentY + qrSize + 8 > pageHeight - 25) {
      doc.addPage();
      currentY = 20;
    }

    const qrY = currentY;

    // QR code on the left
    try {
      const qrDataURL = await QRCode.toDataURL(label, {
        width: 320,
        margin: 1,
        errorCorrectionLevel: 'H'
      });
      doc.addImage(qrDataURL, 'PNG', leftMargin, qrY, qrSize, qrSize);
      if (isRefunded) {
        doc.setDrawColor(220, 38, 38);
        doc.setLineWidth(1.5);
        doc.line(leftMargin, qrY, leftMargin + qrSize, qrY + qrSize);
        doc.line(leftMargin + qrSize, qrY, leftMargin, qrY + qrSize);
        doc.setLineWidth(0.2);
        doc.setDrawColor(0);
      }
    } catch (error) {
      console.error('QR code generation error:', error);
    }

    // Details on the right, stacked snug against the QR
    let ty = qrY + 6;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(label, textX, ty);
    if (isRefunded) {
      doc.setTextColor(220, 38, 38);
      doc.text(' [REFUNDED]', textX + doc.getTextWidth(label) + 2, ty);
      doc.setTextColor(0);
    }

    ty += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let ticketInfo = ticket.ticketType?.name || 'Standard';
    if (ticket.seats && ticket.seats.length > 0) {
      ticketInfo += ` (Seat: ${ticket.seats[0].row}-${ticket.seats[0].seatNumber})`;
    }
    doc.text(ticketInfo, textX, ty);

    ty += 7;
    doc.setFontSize(9);
    if (isRefunded) {
      doc.setTextColor(220, 38, 38);
      doc.setFont(undefined, 'bold');
      doc.text('NOT VALID FOR ENTRY', textX, ty);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0);
    } else {
      doc.setTextColor(100);
      doc.text('Scan at entrance', textX, ty);
      doc.setTextColor(0);
    }

    // Advance past the QR block, then a thin divider with a minimal gap.
    currentY = qrY + qrSize + 5;
    if (index < orderedTickets.length - 1) {
      doc.setDrawColor(220);
      doc.line(leftMargin, currentY, pageWidth - rightMargin, currentY);
      currentY += 5;
    }
  }
  
  // Footer
  currentY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, currentY, { align: 'center' });
  doc.setTextColor(0);
  
  // Save the PDF
  const fileName = `Tickets_${eventInfo.eventCode || eventId}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};