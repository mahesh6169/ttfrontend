'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { MdEdit, MdDelete, MdStore } from 'react-icons/md';
import { format } from 'date-fns';

export default function AllCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive, expired

  useEffect(() => {
    const fetchData = async () => {
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
        toast.error(error.response?.data?.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const handleStoreFilter = (storeId) => {
    setSelectedStore(storeId);
    if (storeId === 'all') {
      setCampaigns(allCampaigns);
    } else {
      const filtered = allCampaigns.filter(c => c.storeId?._id === storeId);
      setCampaigns(filtered);
    }
  };

  const getFilteredCampaigns = () => {
    const now = new Date();
    
    switch (filter) {
      case 'active':
        return campaigns.filter(c => c.isActive && new Date(c.expiryDate) >= now);
      case 'inactive':
        return campaigns.filter(c => !c.isActive);
      case 'expired':
        return campaigns.filter(c => new Date(c.expiryDate) < now);
      default:
        return campaigns;
    }
  };

  const filteredCampaigns = getFilteredCampaigns();

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
          <h1 className="text-3xl font-bold text-gray-800">All Campaigns</h1>
          <p className="text-gray-600 mt-2">Manage all discount campaigns across all stores</p>
        </div>

        {/* Store Filter */}
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

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'all'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All ({campaigns.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'active'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Active ({campaigns.filter(c => c.isActive && new Date(c.expiryDate) >= new Date()).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'inactive'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Inactive ({campaigns.filter(c => !c.isActive).length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'expired'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Expired ({campaigns.filter(c => new Date(c.expiryDate) < new Date()).length})
          </button>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MdStore className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {filter === 'all' ? 'No campaigns yet' : `No ${filter} campaigns found`}
            </h2>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? 'Go to a store and create a campaign for it'
                : `No ${filter} campaigns found`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/admin/profile/stores')}
                className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                Go to Stores
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Redemptions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCampaigns.map((campaign) => {
                    const isExpired = new Date(campaign.expiryDate) < new Date();
                    const store = campaign.storeId;
                    
                    return (
                      <tr key={campaign._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {store?.logo ? (
                              <img
                                src={store.logo}
                                alt={store.storeName}
                                className="w-8 h-8 object-contain rounded border"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                <MdStore className="text-gray-400 w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{store?.storeName}</div>
                              <div className="text-xs text-gray-500 font-mono">{store?.storeIdentifier}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {campaign.discount}
                            </div>
                            <div className="text-sm text-gray-600">
                              {campaign.discountProduct}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              campaign.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {format(new Date(campaign.expiryDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {campaign.totalGenerated || 0}
                          {campaign.maxRedemptions > 0 && ` / ${campaign.maxRedemptions}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/admin/profile/stores/${store?._id}/campaigns/${campaign._id}`)}
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
