'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import PartnerStoreForm from '@/components/dailydeals/admin/PartnerStoreForm';

export default function AddPartnerStorePage() {
  const router = useRouter();

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post('/admin/dailydeals/partners', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Partner store created successfully!');
        router.push('/admin/profile/dailydeals/partners');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create partner store');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/profile/dailydeals/partners');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Add Business</h1>
      <PartnerStoreForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
