'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import MyCodesModal from '@/components/coupons/MyCodesModal';
import { MdStore, MdLocalOffer } from 'react-icons/md';
import { FaTag, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';

export default function MyCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
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

    setFilteredCodes(filtered);
  }, [codes, statusFilter, sortBy]);

  const handleViewCode = (code) => {
    setSelectedCode(code);
    setShowModal(true);
  };

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
      <div className="min-h-screen bg-gray-50 py-8">
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
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
              onClick={() => router.push('/promotions')}
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

            {/* Codes Grid */}
            {filteredCodes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-4 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-gray-500">No codes found for this filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 items-stretch">
                {filteredCodes.map((code) => (
                  <CodeCard
                    key={code._id}
                    code={code}
                    status={getCodeStatus(code)}
                    onViewCode={() => handleViewCode(code)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && selectedCode && (
        <MyCodesModal
          code={selectedCode}
          campaign={selectedCode.campaignId}
          store={selectedCode.campaignId.storeId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function CodeCard({ code, status, onViewCode }) {
  const store = code.storeId;
  const campaign = code.campaignId;

  const isExpired = new Date(campaign.expiryDate) < new Date();
  const isRedeemed = code.isRedeemed;

  const statusConfig = {
    active: {
      buttonClass: 'bg-teal-600 hover:bg-teal-700 text-white',
      buttonText: 'VIEW CODE',
      badgeClass: 'bg-green-100 text-green-700',
      badgeText: '✓ Active',
      borderClass: 'border-l-4 border-teal-700'
    },
    redeemed: {
      buttonClass: 'bg-gray-500 hover:bg-gray-600 text-white',
      buttonText: 'VIEW CODE',
      badgeClass: 'bg-gray-100 text-gray-700',
      badgeText: '✓ Redeemed',
      borderClass: 'border-l-4 border-gray-400'
    },
    expired: {
      buttonClass: 'bg-gray-500 hover:bg-gray-600 text-white',
      buttonText: 'VIEW CODE',
      badgeClass: 'bg-red-100 text-red-700',
      badgeText: '⚠ Expired',
      borderClass: 'border-l-4 border-gray-400'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`relative h-full flex flex-col border rounded-lg shadow-md bg-gradient-to-br from-teal-50 to-lime-50 hover:from-teal-100 hover:to-lime-100 transition-all ${config.borderClass}`}>
      {/* Status Badge */}
      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${config.badgeClass}`}>
          {config.badgeText}
        </span>
      </div>

      {/* Top Section: Store Name + Discount | Logo */}
      <div className="flex gap-2 sm:gap-3 p-2 sm:p-3 pb-1.5 sm:pb-2">
        {/* Column 1: Store Name + Discount */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-teal-800 mb-1 truncate uppercase tracking-tight">
            {store?.storeName}
          </h2>
          <div className="flex items-baseline gap-2 bg-teal-700 rounded-lg px-3 py-2 shadow-md">
            <FaTag className="text-lime-100 flex-shrink-0 text-lg" />
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-lime-100">
              {campaign?.discount}
            </p>
          </div>
        </div>

        {/* Column 2: Logo */}
        <div className="flex-1 md:max-w-[192px] flex-shrink-0">
          <div className="relative w-full h-20 sm:h-24 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-sm border border-teal-200">
            {store?.logo?.url ? (
              <img 
                src={store.logo.url} 
                alt={store.storeName}
                className="w-full h-full object-contain p-1.5 sm:p-2"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <MdStore className="text-3xl sm:text-4xl text-teal-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column 3: Full Width Details */}
      <div className="flex flex-col flex-1 px-2 sm:px-3 pb-2 sm:pb-3">
        {/* Product */}
        <div className="text-xs sm:text-base font-bold text-teal-800 my-1 sm:my-1.5 bg-white/60 rounded px-2 py-1">
          {campaign?.discountProduct}
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1"></div>

        {/* Bottom Details */}
        <div className="space-y-1">
          {/* Expiry Date */}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-gray-600">
            <FaClock className="flex-shrink-0 text-xs sm:text-sm" />
            <span>
              {isRedeemed 
                ? `Redeemed ${format(new Date(code.redeemedAt), 'dd MMM yyyy')}`
                : isExpired
                  ? `Expired ${format(new Date(campaign.expiryDate), 'dd MMM yyyy')}`
                  : `Valid until ${format(new Date(campaign.expiryDate), 'dd MMM yyyy')}`
              }
            </span>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={onViewCode}
              className={`inline-block py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-colors mt-1 sm:mt-2 ${config.buttonClass}`}
            >
              {config.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
