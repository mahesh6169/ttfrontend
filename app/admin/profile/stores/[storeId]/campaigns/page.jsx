'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { MdAdd, MdEdit, MdDelete, MdStore } from 'react-icons/md';
import { format } from 'date-fns';

export default function CampaignManagementPage() {
  const router = useRouter();
  const params = useParams();
  const { storeId } = params;
  
  const [store, setStore] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
        toast.error(error.response?.data?.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  const handleDelete = async (campaignId, discount) => {
    if (!confirm(`Are you sure you want to delete the "${discount}" campaign?\n\nThis action cannot be undone. Campaigns with generated codes cannot be deleted.`)) {
      return;
    }

    try {
      const response = await axios.delete(`/admin/campaigns/${campaignId}`);
      
      if (response.data.success) {
        toast.success('Campaign deleted successfully');
        setCampaigns(campaigns.filter(c => c._id !== campaignId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete campaign');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/profile/stores')}
            className="text-teal-600 hover:text-teal-700 mb-2 text-sm"
          >
            ← Back to Stores
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Campaign Management</h1>
              <p className="text-slate-600 mt-2">
                Manage campaigns for {store?.storeName}
                <span className="ml-2 font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                  {store?.storeIdentifier}
                </span>
              </p>
            </div>
            
            <button
              onClick={() => router.push(`/admin/profile/stores/${storeId}/campaigns/add`)}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <MdAdd className="w-5 h-5" />
              Add Campaign
            </button>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MdStore className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No campaigns yet</h2>
            <p className="text-slate-500 mb-6">
              Create your first campaign for this store
            </p>
            <button
              onClick={() => router.push(`/admin/profile/stores/${storeId}/campaigns/add`)}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors inline-flex items-center gap-2"
            >
              <MdAdd className="w-5 h-5" />
              Add Campaign
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Generated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Redeemed
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {campaigns.map((campaign) => {
                    const isExpired = new Date(campaign.expiryDate) < new Date();
                    
                    return (
                      <tr key={campaign._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-slate-900">
                              {campaign.discount}
                            </div>
                            <div className="text-sm text-slate-600">
                              {campaign.discountProduct}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              campaign.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {campaign.isActive ? 'Active' : 'Inactive'}
                            </span>
                            
                            {campaign.isHidden && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Hidden
                              </span>
                            )}
                            
                            {isExpired && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Expired
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {format(new Date(campaign.expiryDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {campaign.totalGenerated || 0}
                          {campaign.maxRedemptions > 0 && ` / ${campaign.maxRedemptions}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {campaign.totalRedeemed || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/admin/profile/stores/${storeId}/campaigns/${campaign._id}`)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                              title="Edit campaign"
                            >
                              <MdEdit className="w-5 h-5" />
                            </button>
                            
                            <button
                              onClick={() => handleDelete(campaign._id, campaign.discount)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                              title="Delete campaign"
                            >
                              <MdDelete className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
