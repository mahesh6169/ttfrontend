'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import DealForm from '@/components/dailydeals/forms/DealForm';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';

export default function EditDealPage() {
  const router = useRouter();
  const { id } = useParams();
  const [deal, setDeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await axios.get(`/user/dailydeals/${id}`);
        if (response.data.success) {
          setDeal(response.data.deal);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch deal');
        router.push('/users/profile/dailydeals');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDeal();
    }
  }, [id, router]);

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.put(`/user/dailydeals/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Deal updated successfully!');
        router.push('/users/profile/dailydeals');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update deal');
      throw error;
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="px-2 py-6 sm:px-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-slate-500">Loading deal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="px-2 py-6 sm:px-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-600">Deal not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-6 sm:px-6 sm:py-8">
      <RequireVerifiedAccount>
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Edit Deal</h1>
            <p className="text-sm text-slate-500 mt-1">Update your promotional deal</p>
            <button
              onClick={handleCancel}
              className="mt-4 inline-flex items-center justify-center bg-amber-400 text-teal-800
                hover:bg-amber-500 hover:text-teal-900 px-5 py-2 rounded-full shadow font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Form */}
          <DealForm
            initialData={deal}
            onSubmit={handleSubmit}
            partnersEndpoint="/user/dailydeals/mystores-dropdown"
            isAdmin={false}
          />
        </div>
      </RequireVerifiedAccount>
    </div>
  );
}
