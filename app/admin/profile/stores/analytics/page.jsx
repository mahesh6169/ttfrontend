'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { format } from 'date-fns';
import { MdChevronRight } from 'react-icons/md';

export default function AnalyticsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {

      try {
        const [campaignsResponse, storesResponse] = await Promise.all([
          axios.get('/admin/campaigns'),
          axios.get('/admin/stores')
        ]);
        
        if (campaignsResponse.data.success) {
          setAllCampaigns(campaignsResponse.data.campaigns);
          setCampaigns(campaignsResponse.data.campaigns);
        }
        
        if (storesResponse.data.success) {
          setStores(storesResponse.data.stores);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleStoreFilter = (storeId) => {
    setSelectedStore(storeId);
    if (storeId === 'all') {
      setCampaigns(allCampaigns);
    } else {
      const filtered = allCampaigns.filter(c => c.storeId?._id === storeId);
      setCampaigns(filtered);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Campaign Analytics</h1>
          <p className="text-gray-600 mt-2">
            View campaign performance and code redemption statistics
          </p>
        </div>

        {stores.length > 0 && (
          <div className="mb-6 flex items-center gap-4">
            <label htmlFor="storeFilter" className="text-sm font-medium text-gray-700">
              Filter by Store:
            </label>
            <select
              id="storeFilter"
              value={selectedStore}
              onChange={(e) => handleStoreFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Stores ({allCampaigns.length} campaigns)</option>
              {stores.map((store) => {
                const storeCount = allCampaigns.filter(c => c.storeId?._id === store._id).length;
                return (
                  <option key={store._id} value={store._id}>
                    {store.storeName} ({storeCount} campaigns)
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No campaigns yet</h2>
            <p className="text-gray-500 mb-6">
              Create stores and campaigns to see analytics
            </p>
            <button
              onClick={() => router.push('/admin/profile/stores')}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              Manage Stores
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const isExpired = new Date(campaign.expiryDate) < new Date();
              
              return (
                <div key={campaign._id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {campaign.campaignName}
                          </h3>
                          
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            campaign.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {campaign.isActive ? 'Active' : 'Inactive'}
                          </span>
                          
                          {isExpired && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                              Expired
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Discount:</strong> {campaign.discount} on {campaign.discountProduct}
                        </p>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-gray-600">Store:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {campaign.storeId?.storeName}
                          </span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {campaign.storeId?.storeIdentifier}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded p-3">
                            <p className="text-xs text-gray-600 mb-1">Codes Generated</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {campaign.stats?.totalGenerated || 0}
                            </p>
                          </div>

                          <div className="bg-green-50 rounded p-3">
                            <p className="text-xs text-gray-600 mb-1">Codes Redeemed</p>
                            <p className="text-2xl font-bold text-green-700">
                              {campaign.stats?.totalRedeemed || 0}
                            </p>
                          </div>

                          <div className="bg-purple-50 rounded p-3">
                            <p className="text-xs text-gray-600 mb-1">Redemption Rate</p>
                            <p className="text-2xl font-bold text-purple-700">
                              {campaign.stats?.totalGenerated > 0
                                ? Math.round((campaign.stats.totalRedeemed / campaign.stats.totalGenerated) * 100)
                                : 0}%
                            </p>
                          </div>

                          <div className="bg-orange-50 rounded p-3">
                            <p className="text-xs text-gray-600 mb-1">Expires</p>
                            <p className="text-sm font-semibold text-orange-700">
                              {format(new Date(campaign.expiryDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <button
                          onClick={() => router.push(`/admin/profile/stores/analytics/${campaign._id}`)}
                          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                        >
                          View Codes
                          <MdChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
