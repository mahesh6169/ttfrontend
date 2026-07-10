'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md';
import { format } from 'date-fns';
import ConfirmModal from '@/components/ConfirmModal';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';

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
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useDelayedLoading(isLoading);
  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Group deals under their businesses
  const businessesWithDeals = useMemo(() => {
    return businesses.map(business => ({
      ...business,
      deals: deals.filter(deal => deal.partnerstoreId?._id === business._id)
    }));
  }, [businesses, deals]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [businessRes, dealsRes] = await Promise.all([
        axios.get('/user/partnerstores'),
        axios.get('/user/dailydeals')
      ]);

      if (businessRes.data.success) {
        setBusinesses(businessRes.data.stores || []);
      }
      if (dealsRes.data.success) {
        setDeals(dealsRes.data.deals || []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
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

  const isExpired = (endDate) => {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return end < new Date();
  };

  const getDealsCountForBusiness = (businessId) => {
    return deals.filter(d => d.partnerstoreId?._id === businessId).length;
  };

  const businessHasDeals = (businessId) => {
    return deals.some(d => d.partnerstoreId?._id === businessId);
  };

  const navigateToAddBusiness = () => {
    localStorage.setItem('cancelRedirectUrl', '/users/profile/deals');
    router.push('/deals/businesses/add');
  };

  const navigateToEditBusiness = (businessId) => {
    localStorage.setItem('cancelRedirectUrl', '/users/profile/deals');
    router.push(`/deals/businesses/edit/${businessId}`);
  };

  const navigateToAddDeal = (businessId) => {
    localStorage.setItem('cancelRedirectUrl', '/users/profile/deals');
    router.push(`/deals/dealform/add?businessId=${businessId}`);
  };

  const navigateToEditDeal = (dealId) => {
    localStorage.setItem('cancelRedirectUrl', '/users/profile/deals');
    router.push(`/deals/dealform/edit/${dealId}`);
  };

  return (
    <div>
        {/* Page Header */}
        <ProfilePageHeading title="Manage Deals" description="Create and manage promotional deals for your businesses" />

      {/* Loading State */}
      {(isLoading || showSkeleton) ? (
        showSkeleton ? <PageSkeleton variant="card" rows={6} /> : null
      ) : businesses.length === 0 ? (
        /* No Businesses State */
        <EmptyState
          title="No businesses yet"
          description="Add your business to start creating deals."
          actionLabel="Add Business"
          actionOnClick={navigateToAddBusiness}
        />
      ) : (
        /* Businesses with Stacked Deal Rows */
        <div className="space-y-6 md:space-y-8">
          {businessesWithDeals.map((business) => (
            <div key={business._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {/* Business Header — logo + name + actions only */}
              <div className="px-4 py-3 flex items-center gap-3">
                {/* Logo */}
                {business.logo?.url ? (
                  <img
                    src={business.logo.url}
                    alt={business.businessName}
                    className="w-12 h-12 object-contain rounded-lg bg-white border border-slate-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 font-bold flex-shrink-0">
                    {business.businessName?.charAt(0)}
                  </div>
                )}

                {/* Business Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{business.businessName}</div>
                </div>

                {/* Business Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => navigateToEditBusiness(business._id)}
                    className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Edit Business"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    onClick={() => setBusinessToDelete(business)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Business"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              </div>

              {/* Deal Rows */}
              {business.deals.length > 0 ? (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {business.deals.map((deal) => (
                    <div key={deal._id} className="flex items-center gap-3 px-4 py-3">
                      {/* Thumbnail */}
                      {deal.images && deal.images.length > 0 ? (
                        <img
                          src={deal.images[0].url}
                          alt={deal.dealTitle}
                          className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px] flex-shrink-0">
                          No Image
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{deal.dealTitle}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            isExpired(deal.endDate)
                              ? 'bg-red-50 text-red-700'
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {isExpired(deal.endDate) ? 'Expired' : 'Live'}
                          </span>
                          {deal.validDays && deal.validDays.length > 0 && (
                            <span className="text-xs text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                              {formatValidDays(deal.validDays)}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {format(new Date(deal.startDate), 'dd MMM')} - {format(new Date(deal.endDate), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* Deal Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={() => navigateToEditDeal(deal._id)}
                          className="text-xs text-teal-700 hover:text-teal-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDealToDelete(deal)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-t border-slate-100 px-4 py-4 text-sm text-slate-400 text-center">
                  No deals yet
                </div>
              )}

              {/* Add Deal */}
              <button
                onClick={() => navigateToAddDeal(business._id)}
                className="w-full flex items-center justify-center gap-1 py-2.5 border-t border-slate-100 text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
              >
                <MdAdd size={18} />
                Add Deal
              </button>
            </div>
          ))}

          {/* Add Business Button */}
          <div className="text-center pt-4">
            <button
              onClick={navigateToAddBusiness}
              className="inline-flex items-center justify-center gap-2 bg-teal-700 text-white px-5 py-2 rounded-full hover:bg-teal-800 font-semibold text-sm shadow-sm transition-colors"
            >
              <MdAdd size={18} />
              Add New Business
            </button>
          </div>
        </div>
      )}

      {/* Delete Business Confirmation Modal */}
      <ConfirmModal
        isOpen={!!businessToDelete}
        onConfirm={handleDeleteBusiness}
        onCancel={() => setBusinessToDelete(null)}
        title="Delete Business"
        message={
          businessHasDeals(businessToDelete?._id)
            ? `Cannot delete "${businessToDelete?.businessName}" because it has ${getDealsCountForBusiness(businessToDelete?._id)} deal(s). Please delete the deals first.`
            : `Are you sure you want to delete "${businessToDelete?.businessName}"?`
        }
        isLoading={isDeleting}
        confirmText={businessHasDeals(businessToDelete?._id) ? null : "Delete"}
        cancelText={businessHasDeals(businessToDelete?._id) ? "OK" : "Cancel"}
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
