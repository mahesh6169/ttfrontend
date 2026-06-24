'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { MdLocationOn, MdExpandMore, MdExpandLess, MdEdit, MdDelete, MdAdd } from 'react-icons/md';
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
  const [isLoading, setIsLoading] = useState(true);
  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedBusinesses, setExpandedBusinesses] = useState({});

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

  // Auto-expand businesses that have deals
  useEffect(() => {
    if (businesses.length > 0) {
      const expanded = {};
      businesses.forEach(b => {
        const hasDeals = deals.some(d => d.partnerstoreId?._id === b._id);
        expanded[b._id] = hasDeals;
      });
      setExpandedBusinesses(expanded);
    }
  }, [businesses, deals]);

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

  const toggleExpand = (businessId) => {
    setExpandedBusinesses(prev => ({
      ...prev,
      [businessId]: !prev[businessId]
    }));
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
    localStorage.setItem('cancelRedirectUrl', '/users/profile/dailydeals');
    router.push('/dailydeals/businesses/add');
  };

  const navigateToEditBusiness = (businessId) => {
    localStorage.setItem('cancelRedirectUrl', '/users/profile/dailydeals');
    router.push(`/dailydeals/businesses/edit/${businessId}`);
  };

  const navigateToAddDeal = (businessId) => {
    localStorage.setItem('cancelRedirectUrl', '/users/profile/dailydeals');
    router.push(`/dailydeals/dealform/add?businessId=${businessId}`);
  };

  const navigateToEditDeal = (dealId) => {
    localStorage.setItem('cancelRedirectUrl', '/users/profile/dailydeals');
    router.push(`/dailydeals/dealform/edit/${dealId}`);
  };

  return (
    <div>
        {/* Page Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-3 py-1 md:px-4 md:py-2 rounded-full shadow font-semibold text-xs md:text-sm transition-colors mb-4"
          >
            <span>&lt;</span>
            <span>back</span>
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Manage Deals</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage promotional deals for your businesses</p>
        </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">Loading your businesses and deals...</p>
        </div>
      ) : businesses.length === 0 ? (
        /* No Businesses State */
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdAdd className="text-slate-400" size={32} />
          </div>
          <h3 className="font-semibold text-slate-600 text-sm sm:text-base mb-2">Get started with deals</h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-4">First, add your business. Then you can create promotional deals for it.</p>
          <button
            onClick={navigateToAddBusiness}
            className="inline-flex items-center justify-center gap-2 bg-teal-700 text-white px-5 py-2 rounded-full hover:bg-teal-800 font-semibold text-sm shadow-sm transition-colors"
          >
            <MdAdd size={18} />
            Add Business
          </button>
        </div>
      ) : (
        /* Businesses with Nested Deals */
        <div className="space-y-8 md:space-y-10">
          {businessesWithDeals.map((business) => (
            <div key={business._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {/* Business Header */}
              <div className="px-3 py-3 sm:p-4 bg-white">
                <div className="flex items-center gap-3">
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

                  {/* Business Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{business.businessName}</div>
                    <div className="text-sm text-teal-700">{business.subcategory ? `${business.category} › ${business.subcategory}` : business.category}</div>
                    <div className="flex items-center text-xs text-slate-500 mt-0.5">
                      <MdLocationOn className="mr-0.5 flex-shrink-0" size={14} />
                      <span className="truncate">
                        {business.isNationwide
                          ? 'Nationwide'
                          : business.address?.suburb && business.address?.state
                            ? `${business.address.suburb}, ${business.address.state}`
                            : 'No location'}
                      </span>
                    </div>
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

                {/* Expand/Collapse or Add Deal Button */}
                {business.deals.length === 0 ? (
                  <div className="flex justify-center mt-2 sm:mt-1 mb-1">
                    <button
                      onClick={() => navigateToAddDeal(business._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-teal-700 hover:bg-teal-50 rounded-full transition-colors font-medium"
                    >
                      <MdAdd size={16} />
                      <span>Add a deal</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center mt-2 sm:mt-1 mb-1">
                    <button
                      onClick={() => toggleExpand(business._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-full transition-colors font-medium"
                    >
                      {expandedBusinesses[business._id] ? (
                        <>
                          <MdExpandLess size={16} />
                          <span>Hide Deal(s)</span>
                        </>
                      ) : (
                        <>
                          <MdExpandMore size={16} />
                          <span>View Deal(s)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Deals Section Header */}
              {expandedBusinesses[business._id] && (
                <div className="border-t border-slate-200 px-3 sm:px-4 py-2 flex items-center justify-end bg-white">
                  <button
                    onClick={() => navigateToAddDeal(business._id)}
                    className="flex items-center gap-1 text-sm text-teal-700 hover:text-teal-800 font-medium"
                  >
                    <MdAdd size={16} />
                    Add Deal
                  </button>
                </div>
              )}

              {/* Deals Grid */}
              {expandedBusinesses[business._id] && business.deals.length > 0 && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 bg-white">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {business.deals.map((deal) => (
                      <div key={deal._id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
                        {/* Deal Image */}
                        {deal.images && deal.images.length > 0 ? (
                          <img
                            src={deal.images[0].url}
                            alt={deal.dealTitle}
                            className="w-full h-40 sm:h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 sm:h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                            No Image
                          </div>
                        )}

                        {/* Deal Content */}
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 min-h-[2.5rem]">{deal.dealTitle}</h3>

                          <div className="flex flex-wrap gap-1.5 mt-2">
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
                          </div>

                          <div className="text-xs text-slate-400 mt-2">
                            {format(new Date(deal.startDate), 'dd MMM')} - {format(new Date(deal.endDate), 'dd MMM yyyy')}
                          </div>

                          {/* Deal Actions */}
                          <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100">
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
