'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import CodeModal from '@/components/coupons/CodeModal';
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Discount Codes</h1>
          <p className="text-gray-600 mt-2">
            View and manage your discount codes
          </p>
        </div>

        {codes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MdLocalOffer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No codes yet</h2>
            <p className="text-gray-500 mb-6">
              Browse promotions to get your first discount code
            </p>
            <button
              onClick={() => router.push('/promotions')}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              Browse Promotions
            </button>
          </div>
        ) : (
          <>
            {/* Filter and Sort Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Status Filter */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({statusCounts.all})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Active ({statusCounts.active})
                  </button>
                  <button
                    onClick={() => setStatusFilter('redeemed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'redeemed'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Redeemed ({statusCounts.redeemed})
                  </button>
                  <button
                    onClick={() => setStatusFilter('expired')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'expired'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Expired ({statusCounts.expired})
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Codes Grid */}
            {filteredCodes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No codes found for this filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <CodeModal
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
      buttonClass: 'bg-green-500 hover:bg-green-600 text-white',
      buttonText: 'VIEW CODE',
      badgeClass: 'bg-green-100 text-green-700',
      badgeText: '✓ Active'
    },
    redeemed: {
      buttonClass: 'bg-gray-500 hover:bg-gray-600 text-white',
      buttonText: 'VIEW CODE',
      badgeClass: 'bg-gray-100 text-gray-700',
      badgeText: '✓ Redeemed'
    },
    expired: {
      buttonClass: 'bg-gray-500 hover:bg-gray-600 text-white',
      buttonText: 'VIEW CODE',
      badgeClass: 'bg-red-100 text-red-700',
      badgeText: '⚠ Expired'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="relative border rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow">
      {/* Status Badge */}
      <div className="absolute top-2 right-2 z-10">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.badgeClass}`}>
          {config.badgeText}
        </span>
      </div>

      {/* Store Logo */}
      <div className="relative w-full h-32 bg-gray-100 rounded-t-lg overflow-hidden">
        {store?.logo ? (
          <img 
            src={store.logo} 
            alt={store.storeName}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <MdStore className="text-6xl text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Store Name */}
        <h3 className="text-sm font-semibold text-gray-800 truncate">
          {store?.storeName}
        </h3>

        {/* Discount */}
        <div className="flex items-start gap-2">
          <FaTag className="text-teal-600 mt-1 flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-teal-700">
              {campaign?.discount}
            </p>
            <p className="text-xs text-gray-600">
              on {campaign?.discountProduct}
            </p>
          </div>
        </div>

        {/* Expiry Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FaClock className="flex-shrink-0" />
          <span>
            {isRedeemed 
              ? `Redeemed ${format(new Date(code.redeemedAt), 'dd MMM yyyy')}`
              : isExpired
                ? `Expired ${format(new Date(campaign.expiryDate), 'dd MMM yyyy')}`
                : `Valid until ${format(new Date(campaign.expiryDate), 'dd MMM yyyy')}`
            }
          </span>
        </div>

        {/* View Code Button */}
        <button
          onClick={onViewCode}
          className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${config.buttonClass}`}
        >
          {config.buttonText}
        </button>
      </div>
    </div>
  );
}
