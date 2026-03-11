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
    <div className="px-2 py-6 sm:px-6 sm:py-8">
      <RequireVerifiedAccount>
        {showSuccessView && createdDeal ? (
          <SuccessView
            deal={createdDeal}
            mode="add"
            onAddAnother={handleAddAnother}
          />
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Page Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Add Deal</h1>
              <p className="text-sm text-slate-500 mt-1">Create a promotional deal for your business</p>
              <button
                onClick={handleCancel}
                className="mt-4 inline-flex items-center justify-center bg-amber-400 text-teal-800
                  hover:bg-amber-500 hover:text-teal-900 px-5 py-2 rounded-full shadow font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
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
      <div className="px-2 py-6 sm:px-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
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
