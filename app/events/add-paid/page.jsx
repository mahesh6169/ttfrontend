// app/events/add-paid/page.jsx

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import StepManager from '@/components/events/addevents/StepManager';

const AddPaidEventPage = () => {
  const router = useRouter();

  return (
    <div>
      <StepManager 
        mode="add" 
        initialFormData={{ isPaid: true }}
        onComplete={() => {}} 
        allowCancel={true} 
      />
    </div>
  );
};

export default AddPaidEventPage;