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
    <div className="px-2 py-6 sm:px-6 sm:py-8">
      <RequireVerifiedAccount>
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Add Business</h1>
            <p className="text-sm text-slate-500 mt-1">Register your business to start creating deals</p>
            <button
              onClick={handleCancel}
              className="mt-4 inline-flex items-center justify-center bg-amber-400 text-teal-800
                hover:bg-amber-500 hover:text-teal-900 px-5 py-2 rounded-full shadow font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Form */}
          <PartnerStoreForm onSubmit={handleSubmit} />
        </div>
      </RequireVerifiedAccount>
    </div>
  );
}
