'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { MdAdd, MdEdit, MdDelete, MdLocationOn, MdMoreHoriz } from 'react-icons/md';
import { format } from 'date-fns';
import ConfirmModal from '@/components/ConfirmModal';

const DAYS_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

export default function ManageDailyDealsPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [deals, setDeals] = useState([]);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);
  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBusinesses();
    fetchDeals();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await axios.get('/user/partnerstores');
      if (response.data.success) {
        setBusinesses(response.data.stores || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch businesses');
    } finally {
      setIsLoadingBusinesses(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await axios.get('/user/dailydeals');
      if (response.data.success) {
        setDeals(response.data.deals || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch deals');
    } finally {
      setIsLoadingDeals(false);
    }
  };

  const handleDeleteBusiness = async () => {
    if (!businessToDelete) return;
    setIsDeleting(true);

    try {
      const response = await axios.delete(`/user/partnerstores/${businessToDelete._id}`);
      if (response.data.success) {
        toast.success('Business deleted successfully');
        setBusinesses(businesses.filter(b => b._id !== businessToDelete._id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete business');
    } finally {
      setIsDeleting(false);
      setBusinessToDelete(null);
    }
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;
    setIsDeleting(true);

    try {
      const response = await axios.delete(`/user/dailydeals/${dealToDelete._id}`);
      if (response.data.success) {
        toast.success('Deal deleted successfully');
        setDeals(deals.filter(d => d._id !== dealToDelete._id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete deal');
    } finally {
      setIsDeleting(false);
      setDealToDelete(null);
    }
  };

  const formatValidDays = (validDays) => {
    if (!validDays || validDays.length === 0) return 'Every Day';
    return validDays.map(d => DAYS_SHORT[d] || d).join(', ');
  };

  const isExpired = (endDate) => new Date(endDate) < new Date();

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Manage Daily Deals</h1>

      {/* ========== BUSINESSES SECTION ========== */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">My Businesses</h2>
            <p className="text-xs text-gray-500 mt-0.5">Add Business/Store here and create a deal in the My Deals section</p>
          </div>
          <button
            onClick={() => router.push('/users/profile/dailydeals/businesses/add')}
            className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm w-full sm:w-auto"
          >
            <MdAdd size={18} />
            Add Business
          </button>
        </div>

        {isLoadingBusinesses ? (
          <p className="text-gray-500 text-center py-4">Loading businesses...</p>
        ) : businesses.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-2">No businesses yet</p>
            <p className="text-sm text-gray-400">Add a business first before creating deals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.map((business) => (
              <div key={business._id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                {business.logo?.url ? (
                  <img
                    src={business.logo.url}
                    alt={business.businessName}
                    className="w-12 h-12 object-contain rounded bg-gray-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 font-bold flex-shrink-0">
                    {business.businessName?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{business.businessName}</div>
                  <div className="text-sm text-teal-600">{business.category}</div>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5">
                    <MdLocationOn className="mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {business.isNationwide
                        ? 'Nationwide'
                        : business.address?.suburb && business.address?.state
                          ? `${business.address.suburb}, ${business.address.state}`
                          : 'No location'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/users/profile/dailydeals/businesses/edit/${business._id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    onClick={() => setBusinessToDelete(business)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-2 text-gray-400">
            <MdMoreHoriz size={24} />
          </span>
        </div>
      </div>

      {/* ========== DEALS SECTION ========== */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">My Deals</h2>
            <p className="text-xs text-gray-500 mt-0.5">Create promotional deals for your businesses listed above</p>
          </div>
          <button
            onClick={() => router.push('/users/profile/dailydeals/add')}
            disabled={businesses.length === 0}
            className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm w-full sm:w-auto disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <MdAdd size={18} />
            Add Deal
          </button>
        </div>

        {businesses.length === 0 && !isLoadingBusinesses ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800 text-sm">Add a business first before creating deals</p>
          </div>
        ) : isLoadingDeals ? (
          <p className="text-gray-500 text-center py-4">Loading deals...</p>
        ) : deals.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">No deals yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
              <div key={deal._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start gap-3">
                  {deal.images && deal.images.length > 0 ? (
                    <img
                      src={deal.images[0].url}
                      alt={deal.dealTitle}
                      className="w-16 h-16 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{deal.dealTitle}</div>
                    <div className="text-sm text-gray-600 truncate">
                      {deal.partnerstoreId?.businessName || 'Unknown Business'}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {deal.validDays && deal.validDays.length > 0 && (
                        <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {formatValidDays(deal.validDays)}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isExpired(deal.endDate)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {isExpired(deal.endDate) ? 'Expired' : 'Live'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {format(new Date(deal.startDate), 'dd MMM')} - {format(new Date(deal.endDate), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => router.push(`/users/profile/dailydeals/edit/${deal._id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <MdEdit size={18} />
                    </button>
                    <button
                      onClick={() => setDealToDelete(deal)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Business Confirmation Modal */}
      <ConfirmModal
        isOpen={!!businessToDelete}
        onConfirm={handleDeleteBusiness}
        onCancel={() => setBusinessToDelete(null)}
        title="Delete Business"
        message={`Are you sure you want to delete "${businessToDelete?.businessName}"?`}
        isLoading={isDeleting}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete Deal Confirmation Modal */}
      <ConfirmModal
        isOpen={!!dealToDelete}
        onConfirm={handleDeleteDeal}
        onCancel={() => setDealToDelete(null)}
        title="Delete Deal"
        message={`Are you sure you want to delete "${dealToDelete?.dealTitle}"?`}
        isLoading={isDeleting}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
