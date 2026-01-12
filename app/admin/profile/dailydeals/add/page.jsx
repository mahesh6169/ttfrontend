'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import DealForm from '@/components/dailydeals/admin/DealForm';

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
        router.push('/admin/profile/dailydeals');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create deal');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/profile/dailydeals');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Add Daily Deal</h1>
          <p className="text-gray-600 mt-2">Create a new daily deal</p>
        </div>

        <DealForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
