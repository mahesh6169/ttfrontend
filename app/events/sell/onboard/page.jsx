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
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkAccountStatus();
  }, []);

  useEffect(() => {
    let intervalId;
    if (accountStatus?.computedStatus && accountStatus.computedStatus !== 'fully_active') {
      intervalId = setInterval(() => {
        checkAccountStatus();
      }, 30000);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [accountStatus?.computedStatus]);

  const checkAccountStatus = async () => {
    setCheckingStatus(true);
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
      setCheckingStatus(false);
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
        { returnTo: '/events/sell/onboard' },
        { withCredentials: true }
      );

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Stripe onboarding error:', err);
      router.push('/users/profile/settings/stripeSetup?returnTo=/events/sell/onboard');
    }
  };

  const handleAddEvent = () => {
    router.push('/events/add-paid');
  };

  const stripeAccountStatus = user?.stripeAccountStatus || accountStatus?.computedStatus || 'no_account';
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
          buttonText: 'Stripe Setup Successful',
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
          message: 'Your account is still under review or pending verification.',
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
          message: 'Your account is still under review or pending verification.',
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
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Click Here to Get Started
          </h1>
          <p className="text-gray-600">
            Follow these steps to create your first paid event
          </p>
        </div>

        <div className="space-y-6">
          <div className={`border-2 ${statusConfig.borderColor} ${statusConfig.bgColor} rounded-lg p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200">
                  <span className="text-lg font-bold text-gray-700">1</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Stripe Account Setup
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">{statusConfig.icon}</span>
                    <span className={`text-sm font-medium ${statusConfig.textColor}`}>
                      {statusConfig.status}
                    </span>
                  </div>
                </div>
              </div>
              {checkingStatus && (
                <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              )}
            </div>

            <p className={`text-sm ${statusConfig.textColor} mb-4`}>
              {statusConfig.message}
            </p>

            {/* Action Required Section */}
            {hasActionRequired && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-orange-800 mb-2 text-sm">Action Required</h3>
                <div className="space-y-1">
                  {[...new Set(currentlyDue.map(getRequirementLabel))].slice(0, 3).map((label, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-orange-500 mr-2 text-xs">•</span>
                      <span className="text-xs text-gray-700">{label}</span>
                    </div>
                  ))}
                  {currentlyDue.length > 3 && (
                    <p className="text-xs text-orange-600 italic">
                      +{currentlyDue.length - 3} more items
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Verification in Progress Section */}
            {hasPendingOnly && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-yellow-800 mb-2 text-sm flex items-center">
                  <span className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Verification in Progress
                </h3>
                <div className="space-y-1">
                  {pendingVerification.slice(0, 3).map((req, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-yellow-500 mr-2 text-xs">•</span>
                      <span className="text-xs text-gray-700">{getRequirementLabel(req)}</span>
                    </div>
                  ))}
                  {pendingVerification.length > 3 && (
                    <p className="text-xs text-yellow-600 italic">
                      +{pendingVerification.length - 3} more items
                    </p>
                  )}
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  Verification typically completes within a few minutes to hours
                </p>
              </div>
            )}

            <button
              onClick={handleStripeSetup}
              className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-colors ${statusConfig.buttonColor} mb-4`}
            >
              {statusConfig.buttonText}
            </button>

            {/* Expandable Details Section */}
            {hasRequirements && (
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <span className="font-medium">
                    {showDetails ? '▼' : '▶'} View All Details
                  </span>
                  <span className="text-xs">
                    {currentlyDue.length + pendingVerification.length} items
                  </span>
                </button>

                {showDetails && (
                  <div className="mt-4 space-y-4 animate-slideDown">
                    {currentlyDue.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">
                          Currently Due ({currentlyDue.length})
                        </h4>
                        <div className="space-y-1 pl-2">
                          {currentlyDue.map((req, idx) => (
                            <div key={idx} className="flex items-start">
                              <span className="text-orange-500 mr-2 text-xs">•</span>
                              <span className="text-xs text-gray-600">{getRequirementLabel(req)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pendingVerification.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">
                          Pending Verification ({pendingVerification.length})
                        </h4>
                        <div className="space-y-1 pl-2">
                          {pendingVerification.map((req, idx) => (
                            <div key={idx} className="flex items-start">
                              <span className="text-yellow-500 mr-2 text-xs">•</span>
                              <span className="text-xs text-gray-600">{getRequirementLabel(req)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`border-2 rounded-lg p-6 ${
            isStripeFullyActive 
              ? 'border-blue-200 bg-blue-50' 
              : 'border-gray-200 bg-gray-100 opacity-60'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200">
                  <span className="text-lg font-bold text-gray-700">2</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Add Event
                  </h2>
                  {!isStripeFullyActive && (
                    <span className="inline-block mt-1 text-xs font-medium px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                      Complete Step 1 First
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-4">
              {isStripeFullyActive 
                ? 'Create your paid event and start selling tickets.'
                : 'Complete your Stripe account setup to enable paid event creation.'}
            </p>

            <button
              onClick={handleAddEvent}
              disabled={!isStripeFullyActive}
              className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-colors ${
                isStripeFullyActive
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Create Paid Event
            </button>
          </div>
        </div>

        {!isStripeFullyActive && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Auto-checking Stripe status every 30 seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
