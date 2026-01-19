'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import DealForm from '@/components/dailydeals/forms/DealForm';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';

export default function AddDealPage() {
  const router = useRouter();
  const [cancelUrl, setCancelUrl] = useState('/dailydeals/manage');

  useEffect(() => {
    const savedCancelUrl = localStorage.getItem('cancelRedirectUrl');
    if (savedCancelUrl) {
      setCancelUrl(savedCancelUrl);
    }
  }, []);

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post('/user/dailydeals', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Deal created successfully!');
        localStorage.removeItem('cancelRedirectUrl');
        router.push('/dailydeals/manage');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create deal');
      throw error;
    }
  };

  const handleCancel = () => {
    localStorage.removeItem('cancelRedirectUrl');
    router.push(cancelUrl);
  };

  return (
    <RequireVerifiedAccount>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Add Daily Deal</h1>
        <DealForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          partnersEndpoint="/user/dailydeals/mystores-dropdown"
          isAdmin={false}
        />
      </div>
    </RequireVerifiedAccount>
  );
}
