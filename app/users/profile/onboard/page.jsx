'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper to format requirement field names into user-friendly labels
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
        checkAccountStatus(true); // Auto-refresh uses manual refresh mode
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
    // If fully active, open Stripe dashboard in new tab
    if (stripeAccountStatus === 'fully_active') {
      window.open('https://dashboard.stripe.com', '_blank');
      return;
    }

    // For all other statuses (no account, in progress, action needed), go to Stripe onboarding
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
  const hasActionRequired = currentlyDue.length > 0;
  const hasPendingOnly = pendingVerification.length > 0 && currentlyDue.length === 0;
  const hasRequirements = currentlyDue.length > 0 || pendingVerification.length > 0;

  const getStripeStatusConfig = () => {
    switch (stripeAccountStatus) {
      case 'fully_active':
        return {
          icon: '✅',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          buttonText: 'Go to Stripe Dashboard',
          status: 'Fully Active',
          message: 'Your account successfully setup. Create events!',
          showDetailsLink: false,
        };
      case 'under_review':
      case 'capabilities_pending':
        return {
          icon: '⏳',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          buttonColor: 'bg-orange-600 hover:bg-orange-700',
          buttonText: 'Complete Stripe Setup',
          status: 'In Progress',
          message: 'Your account is being processed by Stripe. This may take a few hours to 3 days.',
          showDetailsLink: false,
        };
      case 'incomplete_setup':
      case 'action_required':
      case 'account_restricted':
        return {
          icon: '⚠️',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          buttonColor: 'bg-orange-600 hover:bg-orange-700',
          buttonText: 'Complete Stripe Setup',
          status: 'Action Needed',
          message: 'Your account requires additional information. Please review and submit missing details.',
          showDetailsLink: false,
        };
      default:
        return {
          icon: '⚪',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          buttonText: 'Setup Stripe Account',
          status: 'Not Started',
          message: 'Set up your Stripe account to start selling tickets.',
          showDetailsLink: false,
        };
    }
  };

  const statusConfig = getStripeStatusConfig();

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 md:px-4 py-4 md:py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1">
            Welcome to Organiser Onboarding
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            Follow these steps to create your first paid event
          </p>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className={`border-2 ${statusConfig.borderColor} ${statusConfig.bgColor} rounded-lg p-3 md:p-4`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border-2 border-gray-200">
                  <span className="text-sm md:text-base font-bold text-gray-700">1</span>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">
                    Stripe Account Setup
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-lg md:text-xl">{statusConfig.icon}</span>
                    <span className={`text-xs font-medium ${statusConfig.textColor}`}>
                      {statusConfig.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => checkAccountStatus(true)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isRefreshing}
              >
                <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <p className={`text-xs md:text-sm ${statusConfig.textColor} mb-3`}>
              {statusConfig.message}
            </p>

            {/* Info note for pending verification */}
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

            <button
              onClick={handleStripeSetup}
              className={`w-full py-2.5 md:py-3 px-4 text-sm md:text-base text-white font-medium rounded-lg transition-colors ${statusConfig.buttonColor}`}
            >
              {statusConfig.buttonText}
            </button>

            {!isStripeFullyActive && (
              <div className="text-center mt-2">
                <p className="text-xs text-gray-500">
                  Auto-checking every 30 seconds...
                </p>
              </div>
            )}

            {/* Expandable Details Section */}
            {hasRequirements && (
              <div className="border-t border-gray-200 pt-3 mt-3">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between text-xs text-gray-600 hover:text-gray-800 transition-colors py-1"
                >
                  <span className="font-medium">
                    {showDetails ? '▼' : '▶'} View Details
                  </span>
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                    {currentlyDue.length + pendingVerification.length}
                  </span>
                </button>

                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    showDetails ? 'max-h-[500px] mt-3' : 'max-h-0 overflow-hidden'
                  }`}
                >
                  <div className="bg-gray-50 rounded-lg p-2.5 md:p-3 max-h-60 md:max-h-72 overflow-y-auto border border-gray-200">
                    <div className="space-y-4">
                      {/* Action Required Section */}
                      {currentlyDue.length > 0 && (
                        <div>
                          <h4 className="text-sm md:text-base font-semibold text-gray-900 pb-2 mb-2 border-b border-gray-300">
                            Action Required ({currentlyDue.length})
                          </h4>
                          <div className="space-y-2 pl-2">
                            {[...new Set(currentlyDue.map(getRequirementLabel))].map((label, idx) => (
                              <div key={idx} className="flex items-start">
                                <span className="text-orange-500 mr-2 text-sm">•</span>
                                <span className="text-xs md:text-sm text-gray-700">{label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pending Verification Section */}
                      {pendingVerification.length > 0 && (
                        <div>
                          <h4 className="text-sm md:text-base font-semibold text-gray-900 pb-2 mb-2 border-b border-gray-300">
                            Pending Verification ({pendingVerification.length})
                          </h4>
                          <div className="space-y-2 pl-2">
                            {pendingVerification.map((req, idx) => (
                              <div key={idx} className="flex items-start">
                                <span className="text-blue-500 mr-2 text-sm">•</span>
                                <span className="text-xs md:text-sm text-gray-700">{getRequirementLabel(req)}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 mt-3 pl-2 italic">
                            ⓘ Verification typically completes within a few minutes to a few hours
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Note - Only show when fully_active */}
            {isStripeFullyActive && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mt-4">
                <h4 className="text-xs md:text-sm font-semibold text-blue-900 mb-2 md:mb-3">Note:</h4>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-blue-800 mb-3 md:mb-4">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Desify does not process your sales transactions; all sales are handled directly by Stripe.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>The Desify Platform Fee is automatically deducted from each transaction.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You can view your sales transactions in your Stripe Dashboard.</span>
                  </li>
                </ul>
                
                <h4 className="text-xs md:text-sm font-semibold text-blue-900 mb-2">Useful Links:</h4>
                <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                  <a
                    href="/users/profile/checkInPaid"
                    className="text-blue-700 hover:text-blue-900 underline"
                  >
                    Check-in Page
                  </a>
                  <span className="text-blue-300">|</span>
                  <a
                    href="/users/profile/refunds"
                    className="text-blue-700 hover:text-blue-900 underline"
                  >
                    Refund Page
                  </a>
                  <span className="text-blue-300">|</span>
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-900 underline"
                  >
                    Stripe Dashboard
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className={`border-2 rounded-lg p-3 md:p-4 ${
            isStripeFullyActive 
              ? 'border-blue-200 bg-blue-50' 
              : 'border-gray-200 bg-gray-100 opacity-60'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border-2 border-gray-200">
                  <span className="text-sm md:text-base font-bold text-gray-700">2</span>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">
                    Add Event
                  </h2>
                  {!isStripeFullyActive && (
                    <span className="inline-block mt-0.5 text-xs font-medium px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                      Complete Step 1 First
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs md:text-sm text-gray-700 mb-3">
              {isStripeFullyActive 
                ? 'Create your paid event and start selling tickets.'
                : 'Complete your Stripe account setup to enable paid event creation.'}
            </p>

            <button
              onClick={handleAddEvent}
              disabled={!isStripeFullyActive}
              className={`w-full py-2.5 md:py-3 px-4 text-sm md:text-base text-white font-medium rounded-lg transition-colors ${
                isStripeFullyActive
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Create Paid Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
