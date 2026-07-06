'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import PartnerStoreForm from '@/components/dailydeals/forms/PartnerStoreForm';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';

export default function AddBusinessPage() {
  const router = useRouter();

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post('/user/partnerstores', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Business created successfully!');
        router.push('/users/profile/dailydeals');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create business');
      throw error;
    }
  };

  const handleCancel = () => {
    router.back();
  };

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
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">Add Business</h1>
            <p className="mt-1 text-sm text-slate-500">Register your business to start creating deals</p>
          </div>

          {/* Form */}
          <PartnerStoreForm onSubmit={handleSubmit} />
        </div>
      </RequireVerifiedAccount>
    </div>
  );
}
