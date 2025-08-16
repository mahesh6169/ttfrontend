// app/events/add/page.jsx

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import StepManager from '@/components/events/addevents/StepManager';

const AddEventPage = () => {
  const router = useRouter();

  // Handle successful event creation
  const handleEventCreated = (eventData) => {
    console.log('Event created successfully:', eventData);
    // Additional logic can be added here if needed
    // For example: analytics tracking, redirects, etc.
  };

  return (
    <StepManager 
      mode="add"
      onComplete={handleEventCreated}
      allowCancel={true}
    />
  );
};

export default AddEventPage;