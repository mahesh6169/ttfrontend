'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import PartnerStoreForm from '@/components/dailydeals/forms/PartnerStoreForm';
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
        router.push('/admin/profile/deals/partners');
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
        router.push('/admin/profile/deals/partners');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update partner store');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/profile/deals/partners');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4 flex justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!partnerStore) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-slate-500">Partner store not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Edit Business</h1>
      <PartnerStoreForm
        initialData={partnerStore}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
