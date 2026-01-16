'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import PartnerStoreForm from '@/components/dailydeals/admin/PartnerStoreForm';
import LoadingSpinner from '@/components/LoadingSpinner';

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
    router.push('/users/profile/dailydeals');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 flex justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500">Business not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Edit Business</h1>
      <PartnerStoreForm
        initialData={business}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
