'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import CouponCard from '@/components/coupons/couponcomponents/CouponCard';
import { MdLocalOffer } from 'react-icons/md';

export default function MyCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await axios.get('/coupons/my-codes');
        
        if (response.data.success) {
          setCodes(response.data.codes);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch codes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCodes();
  }, []);

  useEffect(() => {
    let filtered = [...codes];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(code => getCodeStatus(code) === statusFilter);
    }

    // Apply sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.generatedAt) - new Date(b.generatedAt));
    }

    // Transform codes to campaign format for CouponCard
    const campaigns = filtered.map(code => ({
      _id: code.campaignId._id,
      discount: code.campaignId.discount,
      discountProduct: code.campaignId.discountProduct,
      expiryDate: code.campaignId.expiryDate,
      maxRedemptions: code.campaignId.maxRedemptions,
      totalGenerated: code.campaignId.totalGenerated,
      store: code.campaignId.storeId,
      slug: code.campaignId.slug,
      userHasCode: true,
      userCodeRedeemed: code.isRedeemed
    }));

    setFilteredCampaigns(campaigns);
  }, [codes, statusFilter, sortBy]);

  const getCodeStatus = (code) => {
    if (code.isRedeemed) return 'redeemed';
    
    const now = new Date();
    const expiry = new Date(code.campaignId?.expiryDate);
    
    if (expiry < now) return 'expired';
    return 'active';
  };

  const statusCounts = {
    all: codes.length,
    active: codes.filter(code => getCodeStatus(code) === 'active').length,
    redeemed: codes.filter(code => getCodeStatus(code) === 'redeemed').length,
    expired: codes.filter(code => getCodeStatus(code) === 'expired').length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p className="mt-4 text-gray-600">Loading your codes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">My Discount Codes</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            View and manage your discount codes
          </p>
        </div>

        {codes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-12 text-center">
            <MdLocalOffer className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No codes yet</h2>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
              Browse promotions to get your first discount code
            </p>
            <button
              onClick={() => router.push('/deals')}
              className="bg-teal-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-teal-700 transition-colors"
            >
              Browse Promotions
            </button>
          </div>
        ) : (
          <>
            {/* Filter and Sort Bar */}
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-3 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
                {/* Status Filter */}
                <div className="flex gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({statusCounts.all})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      statusFilter === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Active ({statusCounts.active})
                  </button>
                  <button
                    onClick={() => setStatusFilter('redeemed')}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      statusFilter === 'redeemed'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Redeemed ({statusCounts.redeemed})
                  </button>
                  <button
                    onClick={() => setStatusFilter('expired')}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      statusFilter === 'expired'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Expired ({statusCounts.expired})
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs sm:text-sm text-gray-600">Sort:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 sm:flex-initial px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Campaigns Grid */}
            {filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-4 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-gray-500">No codes found for this filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-stretch">
                {filteredCampaigns.map((campaign) => (
                  <CouponCard
                    key={campaign._id}
                    campaign={campaign}
                    onGenerateCode={() => {}}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
