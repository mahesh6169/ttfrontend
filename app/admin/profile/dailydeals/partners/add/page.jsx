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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Add Partner Store</h1>
          <p className="text-gray-600 mt-2">Create a new partner store for daily deals</p>
        </div>

        <PartnerStoreForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
