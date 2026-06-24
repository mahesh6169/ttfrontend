// app/events/edit/[id]/page.jsx

'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import StepManager from '@/components/events/addevents/StepManager';
import LoadingSpinner from '@/components/LoadingSpinner';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';

const EditEventPage = ({ params: paramsPromise }) => {
  const params = use(paramsPromise); // Unwrap the Promise
  const router = useRouter();
  const { myEvents, status } = useSelector((state) => state.events);
  const [eventExists, setEventExists] = useState(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  // Validate that the user owns this event
  useEffect(() => {
    const checkEventOwnership = async () => {
      try {
        setIsCheckingPermissions(true);
        
        // Wait for myEvents to load if not already loaded
        if (status === 'idle' && (!myEvents || myEvents.length === 0)) {
          // Will be handled by StepManager's initialization
          setEventExists(true);
          return;
        }
        
        if (status === 'loading') {
          // Still loading, wait
          return;
        }
        
        if (status === 'failed') {
          toast.error('Failed to verify event ownership');
          setEventExists(false);
          return;
        }
        
        // Check if user owns this event
        if (myEvents && myEvents.length > 0) {
          const ownsEvent = myEvents.some(event => event._id === params.id);
          if (!ownsEvent) {
            toast.error('You do not have permission to edit this event');
            setEventExists(false);
            return;
          }
        }
        
        setEventExists(true);
      } catch (error) {
        console.error('Error checking event ownership:', error);
        toast.error('Failed to verify event permissions');
        setEventExists(false);
      } finally {
        setIsCheckingPermissions(false);
      }
    };

    if (params.id) {
      checkEventOwnership();
    } else {
      setEventExists(false);
      setIsCheckingPermissions(false);
    }
  }, [params.id, myEvents, status]);

  // Handle successful event update
  const handleEventUpdated = (eventData) => {
    console.log('Event updated successfully:', eventData);
  };

  // Handle edit cancellation
  const handleEditCancelled = () => {
    // Redirect back to manage events or event details
      dispatch(resetForm());
    router.push('/users/profile/manageevents');
  };

  // Show loading while checking permissions
  if (isCheckingPermissions) {
    return (
      <RequireVerifiedAccount>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-64">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-slate-600">Verifying permissions...</p>
        </div>
      </div>
      </RequireVerifiedAccount>
    );
  }

  // Show error if event doesn't exist or user doesn't have permission
  if (eventExists === false) {
    return (
      <RequireVerifiedAccount>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Unable to Edit Event
              </h2>
              <p className="text-red-600 mb-4">
                {!params.id
                  ? 'No event ID provided'
                  : 'Event not found or you do not have permission to edit this event'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => router.push('/users/profile/manageevents')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Manage My Events
                </button>
                <button
                  onClick={() => router.push('/events')}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Browse Events
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </RequireVerifiedAccount>
    );
  }

  // Validate event ID
  if (!params.id) {
    return (
      <RequireVerifiedAccount>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Invalid Event ID</h2>
            <p className="text-yellow-600 mb-4">No event ID was provided for editing.</p>
            <button
              onClick={() => router.push('/users/profile/manageevents')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Manage My Events
            </button>
          </div>
        </div>
      </div>
      </RequireVerifiedAccount>
    );
  }

  // Render the StepManager for edit mode
  return (
    <StepManager
      mode="edit"
      eventId={params.id}
      onComplete={handleEventUpdated}
      allowCancel={true}
      customTitle="Edit Event"
      customDescription="Update your event details below"
    />
  );
};

export default EditEventPage;