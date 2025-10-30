'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import StepManager from '@/components/events/addevents/StepManager';

const AddPaidEventPage = () => {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const stripeAccountStatus = user?.stripeAccountStatus || 'no_account';

    if (stripeAccountStatus !== 'fully_active') {
      router.push('/users/profile/settings/stripeSetup?returnTo=/users/profile/onboard');
    } else {
      setIsChecking(false);
    }
  }, [user, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your Stripe account...</p>
        </div>
      </div>
    );
  }

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
