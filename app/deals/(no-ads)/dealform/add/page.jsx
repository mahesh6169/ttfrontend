'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import DealForm from '@/components/dailydeals/forms/DealForm';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
import SuccessView from '@/components/dailydeals/SuccessView';

function AddDealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');

  const [showSuccessView, setShowSuccessView] = useState(false);
  const [createdDeal, setCreatedDeal] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post('/user/dailydeals', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Deal created successfully!');
        setCreatedDeal(response.data.deal);
        setShowSuccessView(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create deal');
      throw error;
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleAddAnother = () => {
    setShowSuccessView(false);
    setCreatedDeal(null);
  };

  return (
    <div>
      <RequireVerifiedAccount>
        {showSuccessView && createdDeal ? (
          <SuccessView
            deal={createdDeal}
            mode="add"
            onAddAnother={handleAddAnother}
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
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">Add Deal</h1>
              <p className="mt-1 text-sm text-slate-500">Create a promotional deal for your business</p>
            </div>

            {/* Form */}
            <DealForm
              initialData={businessId ? { partnerstoreId: businessId } : null}
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

export default function AddDealPage() {
  return (
    <Suspense fallback={
      <div>
        <div className="w-full">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-slate-500">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AddDealContent />
    </Suspense>
  );
}
