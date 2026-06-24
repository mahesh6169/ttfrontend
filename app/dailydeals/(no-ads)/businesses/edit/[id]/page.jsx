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
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Edit Business</h1>
            <p className="text-sm text-slate-500 mt-1">Update your business details</p>
            <button
              onClick={handleCancel}
              className="mt-4 inline-flex items-center justify-center bg-amber-400 text-teal-800
                hover:bg-amber-500 hover:text-teal-900 px-5 py-2 rounded-full shadow font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
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
