'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import DealForm from '@/components/dailydeals/forms/DealForm';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
import SuccessView from '@/components/dailydeals/SuccessView';

export default function EditDealPage() {
  const router = useRouter();
  const { id } = useParams();
  const [deal, setDeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [updatedDeal, setUpdatedDeal] = useState(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await axios.get(`/user/dailydeals/${id}`);
        if (response.data.success) {
          setDeal(response.data.deal);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch deal');
        router.push('/users/profile/dailydeals');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDeal();
    }
  }, [id, router]);

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.put(`/user/dailydeals/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Deal updated successfully!');
        setUpdatedDeal(response.data.deal);
        setShowSuccessView(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update deal');
      throw error;
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div>
        <div className="w-full">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-slate-500">Loading deal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div>
        <div className="w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-600">Deal not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <RequireVerifiedAccount>
        {showSuccessView && updatedDeal ? (
          <SuccessView
            deal={updatedDeal}
            mode="edit"
          />
        ) : (
          <div className="w-full">
            {/* Top Toolbar — Cancel (left), above the title */}
            <div className="mb-4 flex items-center">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1 bg-teal-700 text-white hover:bg-teal-800 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
              >
                ✕ Cancel
              </button>
            </div>

            {/* Page Title — centered, below the toolbar (forms.md standard) */}
            <div className="text-center mb-6">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">Edit Deal</h1>
              <p className="mt-1 text-sm text-slate-500">Update your promotional deal</p>
            </div>

            {/* Form */}
            <DealForm
              initialData={deal}
              onSubmit={handleSubmit}
              partnersEndpoint="/user/dailydeals/mystores-dropdown"
              isAdmin={false}
            />
          </div>
        )}
      </RequireVerifiedAccount>
    </div>
  );
}
