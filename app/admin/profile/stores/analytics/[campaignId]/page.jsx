'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { format } from 'date-fns';
import { MdArrowBack } from 'react-icons/md';

export default function CampaignCodesPage() {
  const router = useRouter();
  const params = useParams();
  const { campaignId } = params;

  const [campaign, setCampaign] = useState(null);
  const [codes, setCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCodes, setTotalCodes] = useState(0);
  const codesPerPage = 20;

  useEffect(() => {
    fetchCampaignCodes();
  }, [campaignId, currentPage]);

  const fetchCampaignCodes = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/admin/campaigns/${campaignId}/codes`, {
        params: {
          page: currentPage,
          limit: codesPerPage
        }
      });

      if (response.data.success) {
        setCampaign(response.data.campaign);
        setCodes(response.data.codes);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCodes(response.data.pagination.total);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch campaign codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <button
          onClick={() => router.push('/admin/profile/stores/analytics')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 font-medium"
        >
          <MdArrowBack className="w-5 h-5" />
          Back to Analytics
        </button>

        {campaign && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
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
                    
                    {new Date(campaign.expiryDate) < new Date() && (
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
              </div>
            </div>
          </div>
        )}

        {codes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No codes generated yet</h2>
            <p className="text-gray-500">Codes will appear here once users generate them</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Generated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Redeemed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {codes.map((code) => (
                      <tr key={code._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {code.fullCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {code.userId?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {code.userId?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {format(new Date(code.generatedAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            code.isRedeemed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {code.isRedeemed ? 'Redeemed' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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

            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {currentPage} of {totalPages} ({totalCodes} total codes)
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                                currentPage === page
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 3 || page === currentPage + 3) {
                          return <span key={page} className="px-2 py-2">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
