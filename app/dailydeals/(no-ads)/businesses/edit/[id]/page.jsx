'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import PartnerStoreForm from '@/components/dailydeals/forms/PartnerStoreForm';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';

export default function EditBusinessPage() {
  const router = useRouter();
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await axios.get(`/user/partnerstores/${id}`);
        if (response.data.success) {
          setBusiness(response.data.store);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch business');
        router.push('/users/profile/dailydeals');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBusiness();
    }
  }, [id, router]);

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.put(`/user/partnerstores/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Business updated successfully!');
        router.push('/users/profile/dailydeals');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update business');
      throw error;
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div>
        <div className="w-full">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-slate-500">Loading business...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div>
        <div className="w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-600">Business not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <RequireVerifiedAccount>
        <div className="w-full">
          {/* Top Toolbar — Cancel (left), above the title */}
          <div className="mb-4 flex items-center">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1 bg-teal-700 text-white hover:bg-teal-800 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              ✕ Cancel
            </button>
          </div>

          {/* Page Title — centered, below the toolbar (forms.md standard) */}
          <div className="text-center mb-6">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">Edit Business</h1>
            <p className="mt-1 text-sm text-slate-500">Update your business details</p>
          </div>

          {/* Form */}
          <PartnerStoreForm
            initialData={business}
            onSubmit={handleSubmit}
          />
        </div>
      </RequireVerifiedAccount>
    </div>
  );
}
