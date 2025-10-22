'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { format } from 'date-fns';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';

export default function AnalyticsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);
  const [codes, setCodes] = useState({});
  const [loadingCodes, setLoadingCodes] = useState({});

  useEffect(() => {
    const fetchAnalytics = async () => {

      try {
        const response = await axios.get('/admin/campaigns');
        
        if (response.data.success) {
          setCampaigns(response.data.campaigns);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const toggleExpand = async (campaignId) => {
    if (expandedCampaignId === campaignId) {
      setExpandedCampaignId(null);
      return;
    }

    setExpandedCampaignId(campaignId);

    if (!codes[campaignId]) {
      setLoadingCodes({ ...loadingCodes, [campaignId]: true });
      
      try {
        const response = await axios.get(`/admin/campaigns/${campaignId}/codes`);
        
        if (response.data.success) {
          setCodes({ ...codes, [campaignId]: response.data.codes });
        }
      } catch (error) {
        toast.error('Failed to fetch campaign codes');
      } finally {
        setLoadingCodes({ ...loadingCodes, [campaignId]: false });
      }
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
              const isExpanded = expandedCampaignId === campaign._id;
              const campaignCodes = codes[campaign._id] || [];
              
              return (
                <div key={campaign._id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(campaign._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {campaign.discount}
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

                        <p className="text-sm text-gray-600 mb-3">
                          {campaign.discountProduct}
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
                        {isExpanded ? (
                          <MdExpandLess className="text-gray-500 w-6 h-6" />
                        ) : (
                          <MdExpandMore className="text-gray-500 w-6 h-6" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-6">
                      <h4 className="font-semibold text-gray-800 mb-4">
                        Generated Codes ({campaignCodes.length})
                      </h4>

                      {loadingCodes[campaign._id] ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        </div>
                      ) : campaignCodes.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No codes generated yet</p>
                      ) : (
                        <div className="bg-white rounded border overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Code
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    User
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Generated
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Redeemed
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {campaignCodes.map((code) => (
                                  <tr key={code._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="font-mono text-sm font-semibold text-gray-900">
                                        {code.fullCode}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {code.userId?.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {code.userId?.email}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                      {format(new Date(code.generatedAt), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        code.isRedeemed
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                      }`}>
                                        {code.isRedeemed ? 'Redeemed' : 'Pending'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                      {code.redeemedAt
                                        ? format(new Date(code.redeemedAt), 'MMM dd, yyyy')
                                        : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
