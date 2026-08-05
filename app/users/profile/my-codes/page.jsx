'use client';

import { useEffect, useState, Fragment } from 'react';
import { toast } from 'react-toastify';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import axios from '@/utils/axiosConfig';
import CouponCard from '@/components/coupons/couponcomponents/CouponCard';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

export default function MyCodesPage() {
  const [codes, setCodes] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useDelayedLoading(isLoading);
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

  if (isLoading || showSkeleton) {
    return (
      <div className="space-y-4">
        <ProfilePageHeading title="My Coupons" />
        {showSkeleton && <PageSkeleton variant="list" rows={6} />}
      </div>
    );
  }

  return (
    <div>
      <div>
        <ProfilePageHeading title="My Coupons" />

        {codes.length === 0 ? (
          <EmptyState
            title="No codes yet"
            description="You haven't collected any coupons yet."
          />
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
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({statusCounts.all})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      statusFilter === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Active ({statusCounts.active})
                  </button>
                  <button
                    onClick={() => setStatusFilter('redeemed')}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      statusFilter === 'redeemed'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Redeemed ({statusCounts.redeemed})
                  </button>
                  <button
                    onClick={() => setStatusFilter('expired')}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      statusFilter === 'expired'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Expired ({statusCounts.expired})
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs sm:text-sm text-slate-600">Sort:</label>
                  <Listbox value={sortBy} onChange={setSortBy}>
                    <div className="relative flex-1 sm:flex-initial">
                      <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 sm:px-3 sm:py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer text-left">
                        <span className="block truncate text-slate-900">
                          {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                        </span>
                        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </ListboxButton>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <ListboxOptions
                          anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                          className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                        >
                          {SORT_OPTIONS.map((option) => (
                            <ListboxOption
                              key={option.value}
                              value={option.value}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                    {option.label}
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </span>
                                  )}
                                </>
                              )}
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </Transition>
                    </div>
                  </Listbox>
                </div>
              </div>
            </div>

            {/* Campaigns Grid */}
            {filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-4 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-slate-500">No codes found for this filter</p>
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
