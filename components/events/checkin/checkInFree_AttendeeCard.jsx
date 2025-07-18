// components/events/checkin/checkInFree_AttendeeCard.jsx

'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  checkInAttendee, 
  undoCheckInAttendee,
  updateLocalCheckIn 
} from '@/store/slices/events/checkInFreeSlice';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const CheckInFree_AttendeeCard = ({ 
  attendee, 
  ticketId, 
  registrationNumber,
  isHighlighted = false,
  enableSwipe = true,
  formResponses = []
}) => {
  const dispatch = useDispatch();
  const { selectedEvent, actionLoading } = useSelector((state) => state.checkInFree);
  const [showFormResponses, setShowFormResponses] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Handle check-in toggle
  const handleCheckInToggle = async () => {
    if (actionLoading || !selectedEvent) return;

    try {
      if (attendee.checkedIn) {
        // Undo check-in
        await dispatch(undoCheckInAttendee({
          eventId: selectedEvent._id,
          ticketId,
          attendeeId: attendee._id
        })).unwrap();
        
        // Update local state
        dispatch(updateLocalCheckIn({
          ticketId,
          attendeeId: attendee._id,
          checkedIn: false,
          checkInTime: null
        }));
        
        toast.success(`${attendee.name} checked out`);
      } else {
        // Check in
        await dispatch(checkInAttendee({
          eventId: selectedEvent._id,
          ticketId,
          attendeeId: attendee._id
        })).unwrap();
        
        // Update local state
        dispatch(updateLocalCheckIn({
          ticketId,
          attendeeId: attendee._id,
          checkedIn: true,
          checkInTime: new Date().toISOString()
        }));
        
        toast.success(`${attendee.name} checked in`);
      }
    } catch (error) {
      toast.error(error || 'Check-in operation failed');
    }
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e) => {
    if (!enableSwipe) return;
    setSwipeStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!enableSwipe || !swipeStartX) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - swipeStartX;
    setSwipeOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!enableSwipe) return;
    
    // If swiped more than 100px, trigger check-in toggle
    if (Math.abs(swipeOffset) > 100) {
      handleCheckInToggle();
    }
    
    setSwipeStartX(null);
    setSwipeOffset(0);
  };

  // Format check-in time
  const formatCheckInTime = (dateString) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border transition-all duration-200
        ${isHighlighted ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}
        ${attendee.checkedIn ? 'bg-green-50 border-green-300' : ''}
        ${swipeOffset !== 0 ? 'transform' : ''}
      `}
      style={{
        transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : '',
        opacity: Math.abs(swipeOffset) > 100 ? 0.7 : 1
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="p-4">
        {/* Main Content */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{attendee.name}</h4>
              {attendee.checkedIn && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Checked In
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-500 mt-1">
              Reg #: {registrationNumber}
              {attendee.checkedIn && attendee.checkInTime && (
                <span className="ml-2">
                  • Checked in at {formatCheckInTime(attendee.checkInTime)}
                </span>
              )}
            </div>
          </div>
          
          {/* Check-in/out Button */}
          <button
            onClick={handleCheckInToggle}
            disabled={actionLoading}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors min-w-[100px]
              ${attendee.checkedIn 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-teal-600 text-white hover:bg-teal-700'
              }
              ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {actionLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </span>
            ) : (
              attendee.checkedIn ? 'Check Out' : 'Check In'
            )}
          </button>
        </div>
        
        {/* Form Responses Toggle */}
        {formResponses && formResponses.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowFormResponses(!showFormResponses)}
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showFormResponses ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              View Registration Details
            </button>
            
            {/* Form Responses */}
            {showFormResponses && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                {formResponses.map((response, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-gray-700">{response.fieldName}:</span>
                    <span className="ml-2 text-gray-600">{response.fieldValue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Swipe Hint */}
        {enableSwipe && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Swipe left or right to check in/out
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckInFree_AttendeeCard;