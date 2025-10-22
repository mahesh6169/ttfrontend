'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import CampaignForm from '@/components/coupons/admin/CampaignForm';

export default function AddCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const { storeId } = params;
  
  const [store, setStore] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      if (!storeId) return;

      try {
        const response = await axios.get(`/admin/stores/${storeId}`);
        
        if (response.data.success) {
          setStore(response.data.store);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch store');
        router.push('/admin/profile/stores');
      }
    };

    fetchStore();
  }, [storeId, router]);

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post(`/admin/stores/${storeId}/campaigns`, formData);

      if (response.data.success) {
        toast.success('Campaign created successfully!');
        router.push(`/admin/profile/stores/${storeId}/campaigns`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push(`/admin/profile/stores/${storeId}/campaigns`);
  };

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/profile/stores/${storeId}/campaigns`)}
            className="text-teal-600 hover:text-teal-700 mb-2 text-sm"
          >
            ← Back to Campaigns
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800">Add New Campaign</h1>
          <p className="text-gray-600 mt-2">
            Create a new discount campaign for {store.storeName}
          </p>
        </div>

        <CampaignForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
