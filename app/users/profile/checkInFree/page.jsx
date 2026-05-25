// app/users/profile/checkInFree/page.jsx

'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { FaDownload } from 'react-icons/fa';
import axios from '@/utils/axiosConfig';

// Back button component
const BackButton = () => (
  <Link
    href="/users/profile"
    className="inline-flex items-center gap-1 text-teal-700 hover:bg-teal-50 hover:text-teal-800 px-3 py-1 md:px-4 md:py-2 rounded-full font-semibold text-xs md:text-base transition-colors"
  >
    <span>&lt;</span>
    <span>back</span>
  </Link>
);

// Components
import CheckInFree_EventSelector from '@/components/events/checkin/checkInFree_EventSelector';
import CheckInFree_SearchBar from '@/components/events/checkin/checkInFree_SearchBar';
import CheckInFree_CheckInStats from '@/components/events/checkin/checkInFree_CheckInStats';
import CheckInFree_AttendeeList from '@/components/events/checkin/checkInFree_AttendeeList';
import CheckInFree_VirtualizedAttendeeList from '@/components/events/checkin/checkInFree_VirtualizedAttendeeList';

// Redux
import { clearCheckInData } from '@/store/slices/events/checkInFreeSlice';

const CheckInFreePage = () => {
  const dispatch = useDispatch();
  const { selectedEvent, attendees, pagination } = useSelector((state) => state.checkInFree);
  const [isDownloading, setIsDownloading] = useState(false);

  // Use virtualized list for large datasets
  const useVirtualized = pagination.totalCount > 50;

  // Build a minimalist PDF attendee list for the selected event.
  // One row per attendee; Reg No / Contact / Form info repeat only on the
  // first row of each registration (blanks below to keep the table compact).
  const handleSavePDF = async () => {
    if (!selectedEvent || isDownloading) return;
    setIsDownloading(true);
    try {
      // Fetch all registrations (bypass pagination)
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${selectedEvent._id}/free/attendees?limit=10000`,
        { withCredentials: true }
      );
      const registrations = response.data?.registrations || [];

      if (registrations.length === 0) {
        toast.info('No attendees to export');
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const leftMargin = 10;
      const rightMargin = 10;

      let y = 15;

      // Event title header
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(selectedEvent.title, pageWidth / 2, y, { align: 'center' });
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

      // 8pt font in jsPDF renders at ~3.25mm per line. Slot at 3.5mm leaves a sliver
      // of padding without inflating gaps. Use doc.setLineHeightFactor in tandem so
      // wrapped multi-line text uses the same compact spacing.
      doc.setLineHeightFactor(1.05);
      const lineHeight = 3.5;
      const attendeeRowGap = 0.5;
      const answerGap = 1; // space between answer blocks in the Info column
      const blockTrailingGap = 2; // space below the registration block, before the divider
      const dividerTrailingGap = 4; // space below the divider, before the next registration

      for (const reg of registrations) {
        const attendeesList = reg.attendees || [];
        const responses = (reg.formResponses || []).filter((r) => r && r.response);

        // Pre-compute answer blocks (each answer = its own row, may wrap to multiple lines)
        const answerBlocks = responses.map((r) => {
          const text = String(r.response || '');
          const lines = doc.splitTextToSize(text, cols.info.width);
          return { lines, height: lines.length * lineHeight };
        });

        // Height needed for attendees column and answers column
        const attendeesHeight = attendeesList.length > 0
          ? attendeesList.length * lineHeight + (attendeesList.length - 1) * attendeeRowGap
          : 0;
        const answersHeight = answerBlocks.reduce(
          (sum, b, i) => sum + b.height + (i < answerBlocks.length - 1 ? answerGap : 0),
          0
        );
        const blockHeight = Math.max(attendeesHeight, answersHeight, lineHeight);

        // Page break before drawing the registration
        if (y + blockHeight + blockTrailingGap > pageHeight - 10) {
          doc.addPage();
          y = 15;
          drawHeader();
        }

        // Reg No + Contact on the top row
        doc.text(reg.registrationNumber || '', cols.regNo.x, y);
        doc.text(reg.mobile || '', cols.contact.x, y);

        // Attendees stacked vertically in their column
        let attendeeY = y;
        for (const att of attendeesList) {
          doc.text(att.name || '', cols.attendee.x, attendeeY);
          attendeeY += lineHeight + attendeeRowGap;
        }

        // Answers stacked vertically in info column — each answer own row, gap below
        let answerY = y;
        for (const block of answerBlocks) {
          doc.text(block.lines, cols.info.x, answerY);
          answerY += block.height + answerGap;
        }

        y += blockHeight + blockTrailingGap;

        // Subtle separator between registrations
        doc.setDrawColor(220);
        doc.line(leftMargin, y, pageWidth - rightMargin, y);
        y += dividerTrailingGap;
      }

      const safeTitle = (selectedEvent.title || 'attendees').replace(/[^a-z0-9\- ]/gi, '').trim() || 'attendees';
      doc.save(`${safeTitle}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      dispatch(clearCheckInData());
    };
  }, [dispatch]);

  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        {/* Top row: back button on left, title centered */}
        <div className="relative flex items-center">
          <BackButton />
          <h2 className="absolute left-1/2 -translate-x-1/2 text-base sm:text-lg font-bold text-forest-900">
            RSVP Events Check-In
          </h2>
        </div>

        {/* Event Selector - Reduced padding */}
        <div className="bg-white rounded-lg p-3 sm:p-4">
          <CheckInFree_EventSelector />
        </div>

        {/* Statistics - Compact spacing — Save to PDF inlined in the same row (right-aligned desktop, below center on mobile) */}
        {selectedEvent && (
          <CheckInFree_CheckInStats
            rightSlot={
              <button
                type="button"
                onClick={handleSavePDF}
                disabled={isDownloading}
                className="flex items-center gap-1.5 text-teal-700 hover:bg-teal-50 hover:text-teal-800 px-3 py-1.5 rounded-md font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaDownload size={12} />
                {isDownloading ? 'Generating...' : 'Save to PDF'}
              </button>
            }
          />
        )}

        {/* Attendee List - Only show when event is selected */}
        {selectedEvent && (
          <div>
            {/* Search Bar - No header needed */}
            <div className="p-3">
              <CheckInFree_SearchBar />
            </div>
            
            <div className="p-0 sm:p-2">
              {attendees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    No registrations found for this event
                  </p>
                </div>
              ) : (
                <>
                  {useVirtualized ? (
                    <CheckInFree_VirtualizedAttendeeList />
                  ) : (
                    <CheckInFree_AttendeeList />
                  )}
                </>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default CheckInFreePage;