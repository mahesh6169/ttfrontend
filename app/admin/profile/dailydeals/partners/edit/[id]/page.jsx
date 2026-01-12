'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import PartnerStoreForm from '@/components/dailydeals/admin/PartnerStoreForm';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditPartnerStorePage() {
  const router = useRouter();
  const { id } = useParams();
  const [partnerStore, setPartnerStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPartnerStore = async () => {
      try {
        const response = await axios.get(`/admin/dailydeals/partners/${id}`);
        if (response.data.success) {
          setPartnerStore(response.data.partnerStore);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch partner store');
        router.push('/admin/profile/dailydeals/partners');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPartnerStore();
    }
  }, [id, router]);

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.put(`/admin/dailydeals/partners/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Partner store updated successfully!');
        router.push('/admin/profile/dailydeals/partners');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update partner store');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/profile/dailydeals/partners');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 flex justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!partnerStore) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500">Partner store not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Edit Partner Store</h1>
          <p className="text-gray-600 mt-2">Update partner store details</p>
        </div>

        <PartnerStoreForm
          initialData={partnerStore}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
