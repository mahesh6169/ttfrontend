'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from '@/utils/axiosConfig';
import Link from 'next/link';

const BackButton = () => (
  <div className="mb-4">
    <Link
      href="/users/profile"
      className="inline-flex items-center gap-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-3 py-1 md:px-4 md:py-2 rounded-full shadow font-semibold text-xs md:text-sm transition-colors"
    >
      <span>&lt;</span>
      <span>back</span>
    </Link>
  </div>
);

const RefreshIcon = ({ spinning = false }) => (
  <svg className={`w-4 h-4 md:w-5 md:h-5 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const getRequirementLabel = (field) => {
  const labelMap = {
    'business_profile.mcc': 'Business category',
    'business_profile.product_description': 'Product description',
    'business_profile.url': 'Website URL',
    'business_type': 'Business type',
    'external_account': 'Bank account details',
    'tos_acceptance.date': 'Terms of service',
    'tos_acceptance.ip': 'Terms of service',
    'company.name': 'Company name',
    'company.tax_id': 'ABN (Australian Business Number)',
    'individual.verification.document': 'Identity document',
    'representative.verification.document': 'Identity document',
  };

  if (field.includes('person_') && field.includes('.verification.document')) {
    return 'Identity document';
  }

  return labelMap[field] || field.replace(/_/g, ' ').replace(/\./g, ' ');
};

export default function OnboardPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);
  const [accountStatus, setAccountStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkAccountStatus();
  }, []);

  useEffect(() => {
    let intervalId;
    if (accountStatus?.computedStatus && accountStatus.computedStatus !== 'fully_active') {
      intervalId = setInterval(() => {
        checkAccountStatus(true);
      }, 30000);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [accountStatus?.computedStatus]);

  const checkAccountStatus = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setCheckingStatus(true);
    }

    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/stripe/account-status`,
        { withCredentials: true }
      );
      setAccountStatus(data);
    } catch (err) {
      console.error('Failed to check account status:', err);
      setAccountStatus({ hasAccount: false, computedStatus: 'no_account' });
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false);
      } else {
        setCheckingStatus(false);
      }
    }
  };

  const handleStripeSetup = async () => {
    if (stripeAccountStatus === 'fully_active') {
      window.open('https://dashboard.stripe.com', '_blank');
      return;
    }

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/stripe/onboard`,
        { returnTo: '/users/profile/onboard' },
        { withCredentials: true }
      );

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Stripe onboarding error:', err);
      router.push('/users/profile/settings/stripeSetup?returnTo=/users/profile/onboard');
    }
  };

  const handleAddEvent = () => {
    router.push('/events/add?intent=host&type=paid');
  };

  const stripeAccountStatus = accountStatus?.computedStatus || 'no_account';
  const isStripeFullyActive = stripeAccountStatus === 'fully_active';

  const currentlyDue = accountStatus?.requirements?.currently_due || [];
  const pendingVerification = accountStatus?.requirements?.pending_verification || [];
  const hasRequirements = currentlyDue.length > 0 || pendingVerification.length > 0;

  const getStripeStatusConfig = () => {
    switch (stripeAccountStatus) {
      case 'under_review':
      case 'capabilities_pending':
        return {
          accentBorder: 'border-l-blue-600',
          numberBg: 'bg-blue-100 text-blue-800 ring-blue-200',
          pillBg: 'bg-blue-50 text-blue-800 ring-blue-200',
          status: 'In progress',
          message: 'Your account is being processed by Stripe. This may take a few hours to 3 days.',
          buttonText: 'Complete Stripe setup →',
        };
      case 'incomplete_setup':
      case 'action_required':
      case 'account_restricted':
        return {
          accentBorder: 'border-l-amber-500',
          numberBg: 'bg-amber-100 text-amber-800 ring-amber-200',
          pillBg: 'bg-amber-50 text-amber-800 ring-amber-200',
          status: 'Action needed',
          message: 'Your account requires additional information. Please review and submit missing details.',
          buttonText: 'Complete Stripe setup →',
        };
      default:
        return {
          accentBorder: 'border-l-amber-500',
          numberBg: 'bg-amber-100 text-amber-800 ring-amber-200',
          pillBg: 'bg-amber-50 text-amber-800 ring-amber-200',
          status: 'Action needed',
          message: 'Set up your Stripe account to start selling tickets.',
          buttonText: 'Setup Stripe account →',
        };
    }
  };

  const statusConfig = getStripeStatusConfig();

  if (checkingStatus) {
    return (
      <div>
        <div className="max-w-3xl mx-auto">
          <BackButton />
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded mb-8"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <BackButton />

        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-2xl font-bold text-slate-900 mb-1">
            Welcome to Organiser Onboarding
          </h1>
          <p className="text-xs md:text-sm text-slate-600">
            {isStripeFullyActive
              ? "You're ready to sell tickets"
              : 'Follow these steps to create your first paid event'}
          </p>
        </div>

        <div className="space-y-3 md:space-y-4">
          {/* Step 1 — Stripe account setup */}
          {isStripeFullyActive ? (
            <div className="bg-white border border-slate-200 border-l-4 border-l-green-600 shadow-sm rounded-xl p-3 md:p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-green-100 text-green-800 font-bold text-sm md:text-base ring-1 ring-green-200">
                    1
                  </div>
                  <h2 className="text-base md:text-lg font-semibold text-slate-900">
                    Stripe account setup
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-800 ring-1 ring-green-200">
                    Active
                  </span>
                  <button
                    onClick={() => checkAccountStatus(true)}
                    className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100"
                    disabled={isRefreshing}
                    aria-label="Refresh status"
                  >
                    <RefreshIcon spinning={isRefreshing} />
                  </button>
                </div>
              </div>

              <p className="text-xs md:text-sm text-slate-700 mb-3 md:mb-4 pl-11 md:pl-12">
                Account fully active. View payouts in Stripe.
              </p>

              <div className="flex justify-end">
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full md:w-auto py-2.5 px-4 md:px-5 text-sm md:text-base bg-white border border-teal-700 text-teal-700 hover:bg-teal-50 font-semibold rounded-lg transition-colors"
                >
                  Stripe Dashboard ↗
                </a>
              </div>
            </div>
          ) : (
            <div className={`bg-white border border-slate-200 border-l-4 ${statusConfig.accentBorder} shadow-sm rounded-xl p-3 md:p-4`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full font-bold text-sm md:text-base ring-1 ${statusConfig.numberBg}`}>
                    1
                  </div>
                  <h2 className="text-base md:text-lg font-semibold text-slate-900">
                    Stripe account setup
                  </h2>
                </div>
                <span className={`inline-flex items-center text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${statusConfig.pillBg} shrink-0`}>
                  {statusConfig.status}
                </span>
              </div>

              <p className="text-xs md:text-sm text-slate-700 mb-3 md:mb-4 pl-11 md:pl-12">
                {statusConfig.message}
              </p>

              {(stripeAccountStatus === 'under_review' || stripeAccountStatus === 'capabilities_pending') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3 mb-3">
                  <p className="text-xs text-blue-800">
                    <span className="font-semibold">ℹ️ Note:</span> If you've already submitted your details, please check back here later or alternatively check{' '}
                    <a
                      href="https://dashboard.stripe.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-900 underline font-medium"
                    >
                      Stripe Dashboard
                    </a>.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => checkAccountStatus(true)}
                    className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100"
                    disabled={isRefreshing}
                    aria-label="Refresh status"
                  >
                    <RefreshIcon spinning={isRefreshing} />
                  </button>
                  <span className="text-[11px] md:text-xs text-slate-500">
                    Auto-checking every 30 seconds…
                  </span>
                </div>
                <button
                  onClick={handleStripeSetup}
                  className="w-full md:w-auto py-2.5 px-4 md:px-5 text-sm md:text-base bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {statusConfig.buttonText}
                </button>
              </div>

              {hasRequirements && (
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 transition-colors py-1"
                  >
                    <span className="font-medium">
                      {showDetails ? '▼' : '▶'} View details
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full ring-1 ring-slate-200">
                      {currentlyDue.length + pendingVerification.length}
                    </span>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      showDetails ? 'max-h-[500px] mt-3' : 'max-h-0 overflow-hidden'
                    }`}
                  >
                    <div className="bg-slate-50 rounded-lg p-2.5 md:p-3 max-h-60 md:max-h-72 overflow-y-auto border border-slate-200">
                      <div className="space-y-4">
                        {currentlyDue.length > 0 && (
                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-slate-900 pb-2 mb-2 border-b border-slate-200">
                              Action required ({currentlyDue.length})
                            </h4>
                            <div className="space-y-2 pl-2">
                              {[...new Set(currentlyDue.map(getRequirementLabel))].map((label, idx) => (
                                <div key={idx} className="flex items-start">
                                  <span className="text-amber-500 mr-2 text-sm">•</span>
                                  <span className="text-xs md:text-sm text-slate-700">{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {pendingVerification.length > 0 && (
                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-slate-900 pb-2 mb-2 border-b border-slate-200">
                              Pending verification ({pendingVerification.length})
                            </h4>
                            <div className="space-y-2 pl-2">
                              {pendingVerification.map((req, idx) => (
                                <div key={idx} className="flex items-start">
                                  <span className="text-blue-500 mr-2 text-sm">•</span>
                                  <span className="text-xs md:text-sm text-slate-700">{getRequirementLabel(req)}</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-slate-600 mt-3 pl-2 italic">
                              ⓘ Verification typically completes within a few minutes to a few hours
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Add event */}
          {isStripeFullyActive ? (
            <div className="bg-white border border-slate-200 border-l-4 border-l-teal-700 shadow-sm rounded-xl p-3 md:p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-teal-50 text-teal-800 font-bold text-sm md:text-base ring-1 ring-teal-200">
                    2
                  </div>
                  <h2 className="text-base md:text-lg font-semibold text-slate-900">
                    Add event
                  </h2>
                </div>
                <span className="inline-flex items-center text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 ring-1 ring-teal-200 shrink-0">
                  Next step
                </span>
              </div>

              <p className="text-xs md:text-sm text-slate-700 mb-3 md:mb-4 pl-11 md:pl-12">
                Create your paid event and start selling tickets.
              </p>

              <div className="flex justify-end">
                <button
                  onClick={handleAddEvent}
                  className="w-full md:w-auto py-2.5 px-4 md:px-5 text-sm md:text-base bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Create paid event →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-3 md:p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100 text-slate-400 font-bold text-sm md:text-base ring-1 ring-slate-200">
                    2
                  </div>
                  <h2 className="text-base md:text-lg font-semibold text-slate-500">
                    Add event
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] md:text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200 shrink-0">
                  <LockIcon />
                  Locked
                </span>
              </div>

              <p className="text-xs md:text-sm text-slate-500 mb-3 md:mb-4 pl-11 md:pl-12">
                Complete step 1 to unlock paid events.
              </p>

              <div className="flex justify-end">
                <button
                  onClick={handleAddEvent}
                  disabled
                  className="w-full md:w-auto py-2.5 px-4 md:px-5 text-sm md:text-base bg-slate-100 text-slate-400 font-medium rounded-lg border border-slate-200 cursor-not-allowed"
                >
                  Create paid event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
