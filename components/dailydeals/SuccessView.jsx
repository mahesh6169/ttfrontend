// components/dailydeals/SuccessView.jsx

import React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import ShareIcons from '@/components/shared/ShareIcons';
import { buildSlugUrl } from '@/utils/slugUtils';

const SuccessView = ({
  deal,
  mode = 'add', // 'add' | 'edit'
  onAddAnother
}) => {
  const router = useRouter();

  const isEdit = mode === 'edit';
  const dealId = deal?._id || deal?.id;
  const dealTitle = deal?.dealTitle || 'Untitled Deal';
  const businessName = deal?.partnerstoreId?.businessName || '';

  const formatDateRange = () => {
    if (!deal?.startDate || !deal?.endDate) return 'Not set';
    const start = format(new Date(deal.startDate), 'dd MMM');
    const end = format(new Date(deal.endDate), 'dd MMM yyyy');
    return `${start} - ${end}`;
  };

  const getValidDaysText = () => {
    if (!deal?.validDays || deal.validDays.length === 0) return 'Every day';
    if (deal.validDays.length === 7) return 'Every day';
    return deal.validDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Success Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Success Message */}
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-1">
        {isEdit ? 'Deal Updated' : 'Deal Created'}
      </h1>
      <p className="text-sm text-slate-500 text-center mb-6">
        {isEdit ? 'Your changes have been saved.' : 'Your deal is now live and ready to attract customers.'}
      </p>

      {/* Deal Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-slate-900 text-sm mb-1 line-clamp-2">{dealTitle}</h3>
        {businessName && (
          <span className="text-xs text-slate-500">{businessName}</span>
        )}

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Valid</span>
            <span className="text-slate-700">{formatDateRange()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Days</span>
            <span className="text-slate-700">{getValidDaysText()}</span>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="border-t border-slate-200 pt-4 mb-6">
        <p className="text-xs text-slate-500 text-center mb-3">Share this deal</p>
        <div className="flex items-center justify-center">
          <ShareIcons
            type="deal"
            title={dealTitle}
            id={dealId}
          />
        </div>
      </div>

      {/* Action Links */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => router.push(buildSlugUrl('deal', dealTitle, dealId))}
          className="text-teal-700 hover:text-teal-800 font-medium text-sm"
        >
          View deal page →
        </button>

        {isEdit ? (
          <button
            onClick={() => router.push('/users/profile/deals')}
            className="text-slate-600 hover:text-slate-700 font-medium text-sm"
          >
            Manage my deals →
          </button>
        ) : (
          <>
            <button
              onClick={onAddAnother}
              className="text-slate-600 hover:text-slate-700 font-medium text-sm"
            >
              Create another deal →
            </button>
            <button
              onClick={() => router.push('/users/profile/deals')}
              className="text-slate-600 hover:text-slate-700 font-medium text-sm"
            >
              Manage my deals →
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SuccessView;
