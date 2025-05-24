'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import {
  fetchEventById,
  setEditMode,
  resetForm,
  updateEvent,
  clearEditMode,
} from '@/store/slices/events/eventSlice';
import StepManager from '@/components/events/addevents/StepManager'; // Same as Add Event
import LoadingSpinner from '@/components/LoadingSpinner';
import RequireLogin from '@/components/Auth/RequireLogin';

const EditEventPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();
  const {
    selectedEvent,
    status,
    formStatus,
    formErrors,
    isEditMode,
    editingEventId,
    formData,
  } = useSelector((state) => state.events);

  // 1. Fetch event and populate Redux for editing
  useEffect(() => {
    // Clear form/redux state when unmounting or switching event
    dispatch(resetForm());
    dispatch(clearEditMode());
    // Fetch event and set into edit mode
    if (id) {
      dispatch(fetchEventById(id)).then((res) => {
        if (res.payload) {
          dispatch(setEditMode({ isEdit: true, eventId: id, eventData: res.payload }));
        } else {
          router.push('/404'); // Not found
        }
      });
    }
    // Cleanup on unmount
    return () => {
      dispatch(resetForm());
      dispatch(clearEditMode());
    };
  }, [dispatch, id, router]);

  // 2. Handle submit (same as Add Event, just calls updateEvent thunk)
  const handleSubmit = async () => {
    if (!editingEventId) return;
    // Build FormData as per Add flow (let your step manager or form logic prepare the data)
    // The prepare logic can live in StepManager, or here if you want to keep it explicit
    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      // Handle file arrays and complex fields as per your AddEvent logic
      if (key === 'images') {
        value.forEach((img) => {
          if (img.isNew && img.file) {
            formPayload.append('images', img.file);
          } else if (img.isExisting) {
            formPayload.append('existingImages', JSON.stringify(img));
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        formPayload.append(key, JSON.stringify(value));
      } else {
        formPayload.append(key, value ?? '');
      }
    });

    // Dispatch the update thunk
    const result = await dispatch(updateEvent({ eventId: editingEventId, formData: formPayload }));
    if (updateEvent.fulfilled.match(result)) {
      // Success: Navigate away, toast, reset form, etc.
      router.push('/users/profile/manageevents');
    } else {
      // Errors are in formErrors/formStatus handled by redux state/UI
    }
  };

  // 3. Show spinner while loading
  if (status === 'loading' || !isEditMode || !editingEventId) {
    return (
      <div className="flex justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Event</h1>
      <RequireLogin message="You must be logged in to edit an event.">
        <StepManager
          isEditMode={true}
          onSubmit={handleSubmit}
          submitLabel="Update Event"
        />
      </RequireLogin>
    </div>
  );
};

export default EditEventPage;
