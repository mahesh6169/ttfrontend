'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import StoreForm from '@/components/coupons/admin/StoreForm';

export default function AddStorePage() {
  const router = useRouter();

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post('/admin/stores', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Store created successfully!');
        router.push('/admin/profile/stores');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create store');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/profile/stores');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Add New Store</h1>
          <p className="text-gray-600 mt-2">Create a new store for discount campaigns</p>
        </div>

        <StoreForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
