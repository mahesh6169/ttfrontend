'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import CampaignForm from '@/components/coupons/admin/CampaignForm';

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const { storeId, campaignId } = params;
  
  const [store, setStore] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!storeId || !campaignId) return;

      try {
        const [storeResponse, campaignResponse] = await Promise.all([
          axios.get(`/admin/stores/${storeId}`),
          axios.get(`/admin/campaigns/${campaignId}`)
        ]);

        if (storeResponse.data.success) {
          setStore(storeResponse.data.store);
        }

        if (campaignResponse.data.success) {
          setCampaign(campaignResponse.data.campaign);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch data');
        router.push(`/admin/profile/stores/${storeId}/campaigns`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId, campaignId, router]);

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.put(`/admin/campaigns/${campaignId}`, formData);

      if (response.data.success) {
        try {
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag: `campaign-${campaign.slug}` })
          });
        } catch (error) {
          console.error('Failed to revalidate metadata:', error);
        }
        
        toast.success('Campaign updated successfully!');
        router.push(`/admin/profile/stores/${storeId}/campaigns`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update campaign');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push(`/admin/profile/stores/${storeId}/campaigns`);
  };

  if (isLoading || !campaign || !store) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/profile/stores/${storeId}/campaigns`)}
            className="text-teal-600 hover:text-teal-700 mb-2 text-sm"
          >
            ← Back to Campaigns
          </button>
          
          <h1 className="text-3xl font-bold text-slate-800">Edit Campaign</h1>
          <p className="text-slate-600 mt-2">
            Update campaign for {store.storeName}
          </p>
        </div>

        <CampaignForm 
          initialData={campaign}
          onSubmit={handleSubmit} 
          onCancel={handleCancel}
          isEditing={true}
        />
      </div>
    </div>
  );
}
