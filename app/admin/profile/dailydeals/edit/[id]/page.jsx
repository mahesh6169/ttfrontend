'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import DealForm from '@/components/dailydeals/admin/DealForm';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditDealPage() {
  const router = useRouter();
  const { id } = useParams();
  const [deal, setDeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await axios.get(`/admin/dailydeals/${id}`);
        if (response.data.success) {
          setDeal(response.data.dailyDeal);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch deal');
        router.push('/admin/profile/dailydeals');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDeal();
    }
  }, [id, router]);

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.put(`/admin/dailydeals/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Deal updated successfully!');
        router.push('/admin/profile/dailydeals');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update deal');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/profile/dailydeals');
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

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500">Deal not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Edit Deal</h1>
          <p className="text-gray-600 mt-2">Update deal details</p>
        </div>

        <DealForm
          initialData={deal}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
