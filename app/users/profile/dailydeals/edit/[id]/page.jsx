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
        const response = await axios.get(`/user/dailydeals/${id}`);
        if (response.data.success) {
          setDeal(response.data.deal);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch deal');
        router.push('/users/profile/dailydeals');
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
      const response = await axios.put(`/user/dailydeals/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Deal updated successfully!');
        router.push('/users/profile/dailydeals');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update deal');
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

  if (!deal) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500">Deal not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Edit Daily Deal</h1>
      <DealForm
        initialData={deal}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        partnersEndpoint="/user/dailydeals/mystores-dropdown"
        isAdmin={false}
      />
    </div>
  );
}
