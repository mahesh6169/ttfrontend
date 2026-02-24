// app/events/add/page.jsx

'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs';
import StepManager from '@/components/events/addevents/StepManager';
import { setEventIntent, updateField } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';

// URL state parsers for event creation
const eventParsers = {
  intent: parseAsString, // 'promote' | 'host'
  type: parseAsString,   // 'free' | 'paid'
  step: parseAsInteger.withDefault(1),
};

// Inner component that uses useQueryStates (requires Suspense)
const AddEventContent = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [eventParams, setEventParams] = useQueryStates(eventParsers, {
    shallow: true,
    history: 'push'
  });

  // Sync URL params to Redux on mount and when params change
  useEffect(() => {
    if (eventParams.intent) {
      dispatch(setEventIntent(eventParams.intent));
    }
    if (eventParams.type) {
      // 'type' determines isPaid for both promotional and hosted events
      dispatch(updateField({ field: 'isPaid', value: eventParams.type === 'paid' }));
    }
  }, [eventParams.intent, eventParams.type, dispatch]);

  // Handle successful event creation
  const handleEventCreated = (eventData) => {
    console.log('Event created successfully:', eventData);
    // Clear URL params after successful creation
    setEventParams({ intent: null, type: null, step: null });
  };

  // Handle step changes - sync to URL
  const handleStepChange = (newStep) => {
    setEventParams({ step: newStep });
  };

  return (
    <StepManager
      mode="add"
      onComplete={handleEventCreated}
      allowCancel={true}
      initialIntent={eventParams.intent}
      initialType={eventParams.type}
      initialStep={eventParams.step}
      onStepChange={handleStepChange}
    />
  );
};

// Main page component with Suspense boundary
const AddEventPage = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    }>
      <AddEventContent />
    </Suspense>
  );
};

export default AddEventPage;
