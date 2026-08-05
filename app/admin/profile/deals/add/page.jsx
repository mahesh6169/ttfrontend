'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import DealForm from '@/components/dailydeals/forms/DealForm';

export default function AddDealPage() {
  const router = useRouter();

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post('/admin/dailydeals', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Deal created successfully!');
        router.push('/admin/profile/deals');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create deal');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/profile/deals');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Add Daily Deal</h1>
      <DealForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
