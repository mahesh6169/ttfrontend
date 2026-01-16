'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import PartnerStoreForm from '@/components/dailydeals/admin/PartnerStoreForm';

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
    router.push('/users/profile/dailydeals');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Add Business</h1>
      <PartnerStoreForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
