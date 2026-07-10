// app/users/profile/checkInPaid/page.jsx

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatInTimeZone } from 'date-fns-tz';
import { BsQrCodeScan } from 'react-icons/bs';
import { FaRegCalendarAlt, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';

// Components
import CheckInPaid_EventSelector from '@/components/events/checkin/checkInPaid_EventSelector';
import CheckInPaid_SearchBar from '@/components/events/checkin/checkInPaid_SearchBar';
import CheckInPaid_CheckInStats from '@/components/events/checkin/checkInPaid_CheckInStats';
import CheckInPaid_GroupedAttendeeList from '@/components/events/checkin/checkInPaid_GroupedAttendeeList';
import CheckInPaid_VirtualizedAttendeeList from '@/components/events/checkin/checkInPaid_VirtualizedAttendeeList';
import CheckInPaid_QRScanner from '@/components/events/checkin/CheckInPaid_QRScanner';

// Redux
import { clearCheckInData } from '@/store/slices/events/checkInPaidSlice';

const CheckInPaidPage = () => {
  const dispatch = useDispatch();
  const { selectedEvent, attendees, pagination } = useSelector((state) => state.checkInPaid);
  const [showScanner, setShowScanner] = useState(false);

  // Draggable Scan-QR FAB (hold & move; a plain tap still opens the scanner)
  const fabRef = useRef(null);
  const [fabPos, setFabPos] = useState(null); // {x, y} px once dragged; null = default corner
  const fabDrag = useRef({ dragging: false, moved: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  const handleFabPointerDown = (e) => {
    const rect = fabRef.current.getBoundingClientRect();
    fabDrag.current = {
      dragging: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    fabRef.current.setPointerCapture?.(e.pointerId);
  };

  const handleFabPointerMove = (e) => {
    const s = fabDrag.current;
    if (!s.dragging) return;
    // ignore micro-movement so a tap isn't treated as a drag
    if (!s.moved && Math.hypot(e.clientX - s.startX, e.clientY - s.startY) < 5) return;
    s.moved = true;
    const size = 80;
    const x = Math.max(4, Math.min(e.clientX - s.offsetX, window.innerWidth - size - 4));
    const y = Math.max(4, Math.min(e.clientY - s.offsetY, window.innerHeight - size - 4));
    setFabPos({ x, y });
  };

  const handleFabPointerUp = (e) => {
    fabDrag.current.dragging = false;
    fabRef.current?.releasePointerCapture?.(e.pointerId);
  };

  const handleFabClick = () => {
    if (fabDrag.current.moved) {
      fabDrag.current.moved = false; // it was a drag, not a tap — don't open
      return;
    }
    setShowScanner(true);
  };

  // Use virtualized list for large datasets
  const useVirtualized = pagination.totalCount > 50;

  // Format event date with timezone support
  const formatEventDateTime = (dateTime, timeZone = 'Australia/Sydney') => {
    try {
      const date = formatInTimeZone(dateTime, timeZone, 'dd/MM/yyyy');
      const time = formatInTimeZone(dateTime, timeZone, 'h:mm a');
      return { date, time, combined: `${date} at ${time}` };
    } catch (error) {
      console.error('Error formatting date:', error);
      const fallbackDate = new Date(dateTime);
      return {
        date: fallbackDate.toLocaleDateString(),
        time: fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        combined: fallbackDate.toLocaleString()
      };
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
        <ProfilePageHeading title="Paid Event Check-In" />

        {/* Event Selector - floating panel (shiny white, no border) */}
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
          <CheckInPaid_EventSelector />
        </div>

        {/* Selected Event Details - Compact */}
        {selectedEvent && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {/* Event Title */}
              <h3 className="text-base sm:text-lg font-bold text-teal-700">
                {selectedEvent.title}
              </h3>

              {/* Event Code */}
              <span className="text-xs font-mono font-semibold bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full">
                {selectedEvent.eventCode || selectedEvent._id}
              </span>

              {/* Date & Time */}
              <div className="flex items-center gap-1.5 text-slate-600">
                <FaRegCalendarAlt className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{formatEventDateTime(selectedEvent.dateTime, selectedEvent.timeZone).combined} ({selectedEvent.timeZone})</span>
              </div>

              {/* Venue */}
              <div className="flex items-center gap-1.5 text-slate-600">
                <FaMapMarkerAlt className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{selectedEvent.venue}</span>
              </div>

              {/* Capacity if available */}
              {selectedEvent.capacity > 0 && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <FaUsers className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Capacity: {selectedEvent.capacity}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics - Compact spacing */}
        {selectedEvent && (
          <CheckInPaid_CheckInStats />
        )}

        {/* Mobile: inline Scan QR tile (desktop uses the draggable FAB) */}
        {selectedEvent && (
          <div className="sm:hidden pt-4">
            <button
              onClick={() => setShowScanner(true)}
              className="w-full h-28 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-sm flex flex-col items-center justify-center gap-1.5"
              aria-label="Scan QR Code"
            >
              <BsQrCodeScan className="text-3xl" />
              <span className="text-xs font-semibold">Scan QR</span>
            </button>
          </div>
        )}

        {/* Mobile: "or check in manually" divider between scan tile and search */}
        {selectedEvent && (
          <div className="sm:hidden flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200"></span>
            <span className="text-xs text-slate-500">or check in manually</span>
            <span className="h-px flex-1 bg-slate-200"></span>
          </div>
        )}

        {/* Search Bar - floating panel (shiny white, no border) */}
        {selectedEvent && (
          <div className="bg-white rounded-xl shadow-md p-3">
            <CheckInPaid_SearchBar />
          </div>
        )}

        {/* Attendee List - cards stand on their own (no outer frame) */}
        {selectedEvent && (
          <div>
            {attendees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">
                  No tickets found for this event
                </p>
              </div>
            ) : (
              <>
                {useVirtualized ? (
                  <CheckInPaid_VirtualizedAttendeeList />
                ) : (
                  <CheckInPaid_GroupedAttendeeList />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* FAB Button for QR Scanner */}
      {selectedEvent && !showScanner && (
        <button
          ref={fabRef}
          onPointerDown={handleFabPointerDown}
          onPointerMove={handleFabPointerMove}
          onPointerUp={handleFabPointerUp}
          onClick={handleFabClick}
          style={fabPos ? { left: fabPos.x, top: fabPos.y, right: 'auto', bottom: 'auto' } : undefined}
          className={`fixed ${fabPos ? '' : 'bottom-20 right-10'} w-20 h-20 bg-teal-700 rounded-xl shadow-lg hidden sm:flex flex-col items-center justify-center text-white z-30 hover:bg-teal-800 transition-colors touch-none select-none cursor-grab active:cursor-grabbing`}
          aria-label="Scan QR Code"
        >
          <BsQrCodeScan className="text-2xl" />
          <span className="text-xs mt-0.5">Scan QR</span>
        </button>
      )}

      {/* QR Scanner Modal */}
      {showScanner && selectedEvent && (
        <CheckInPaid_QRScanner onClose={() => setShowScanner(false)} />
      )}

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

export default CheckInPaidPage;