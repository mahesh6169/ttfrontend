'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import StoreForm from '@/components/coupons/admin/StoreForm';
import { MdCampaign } from 'react-icons/md';

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();
  const { storeId } = params;
  
  const [store, setStore] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!storeId) return;

      try {
        const [storeResponse, campaignsResponse] = await Promise.all([
          axios.get(`/admin/stores/${storeId}`),
          axios.get(`/admin/stores/${storeId}/campaigns`)
        ]);

        if (storeResponse.data.success) {
          setStore(storeResponse.data.store);
        }

        if (campaignsResponse.data.success) {
          setCampaigns(campaignsResponse.data.campaigns);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch store data');
        router.push('/admin/profile/stores');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreData();
  }, [storeId, router]);

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.put(`/admin/stores/${storeId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Revalidate all campaigns for this store (for WhatsApp sharing metadata)
        if (campaigns.length > 0) {
          try {
            const frontendUrl = window.location.origin;
            const revalidatePromises = campaigns.map(campaign => 
              fetch(`${frontendUrl}/api/revalidate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag: `campaign-${campaign.slug}` })
              })
            );
            await Promise.all(revalidatePromises);
          } catch (error) {
            console.error('Failed to revalidate campaign metadata:', error);
          }
        }
        
        toast.success('Store updated successfully!');
        router.push('/admin/profile/stores');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update store');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/profile/stores');
  };

  if (isLoading || !store) {
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
          <h1 className="text-3xl font-bold text-gray-800">Edit Store</h1>
          <p className="text-gray-600 mt-2">
            Update store details for {store.storeName}
          </p>
        </div>

        <StoreForm 
          initialData={store} 
          onSubmit={handleSubmit} 
          onCancel={handleCancel} 
        />

        {campaigns.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Campaigns</h2>
              <button
                onClick={() => router.push(`/admin/profile/stores/${storeId}/campaigns`)}
                className="text-teal-600 hover:text-teal-700 font-medium text-sm"
              >
                Manage All →
              </button>
            </div>

            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <div
                  key={campaign._id}
                  className="flex items-center justify-between border-b pb-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <MdCampaign className="text-teal-600 w-5 h-5" />
                    <div>
                      <p className="font-medium text-gray-900">{campaign.discount}</p>
                      <p className="text-sm text-gray-600">{campaign.discountProduct}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {campaign.isActive ? 'Active' : 'Inactive'}
                    </span>
                    
                    <span className="text-sm text-gray-500">
                      {campaign.totalGenerated || 0} / {campaign.maxRedemptions || '∞'}
                    </span>
                  </div>
                </div>
              ))}
              
              {campaigns.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  and {campaigns.length - 5} more...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
