// app/events/add-paid/page.jsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { updateField, setStep, resetForm } from '@/store/slices/events/eventSlice';
import StepManager from '@/components/events/addevents/StepManager';

const PaidEventStepManager = () => {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);
  const { formData } = useSelector((state) => state.events);

  useEffect(() => {
    // Initialize form for paid event
    const initializePaidEvent = async () => {
      // First reset to ensure clean state
      dispatch(resetForm());
      
      // Then set paid event type
      setTimeout(() => {
        dispatch(updateField({ isPaid: true }));
        dispatch(setStep(2)); // Skip to step 2
        setIsReady(true);
      }, 50);
    };

    initializePaidEvent();
  }, [dispatch]);

  if (!isReady) {
    return <div className="text-center py-8">Initializing paid event form...</div>;
  }

  return <StepManager mode="add" onComplete={() => {}} allowCancel={true} />;
};

const AddPaidEventPage = () => {
  const router = useRouter();

  return (
    <div>
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
        <p className="text-amber-700">
          <strong>Creating a Paid Event</strong> - You'll be able to sell tickets and manage registrations.
        </p>
      </div>
      
      <PaidEventStepManager />
    </div>
  );
};

export default AddPaidEventPage;