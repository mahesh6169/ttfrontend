'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from '@/utils/axiosConfig';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper to format requirement field names into user-friendly labels
const getRequirementLabel = (field) => {
  const labelMap = {
    // Common fields that appear during initial onboarding
    'business_profile.mcc': 'Business category',
    'business_profile.product_description': 'Product description',
    'business_profile.url': 'Website URL',
    'business_type': 'Business type',
    'external_account': 'Bank account details',
    'tos_acceptance.date': 'Terms of service',
    'tos_acceptance.ip': 'Terms of service',
    
    // Company-specific fields (only for company business type)
    'company.name': 'Company name',
    'company.tax_id': 'ABN (Australian Business Number)',
    
    // Identity verification (appears later in the process)
    'individual.verification.document': 'Identity document',
    'representative.verification.document': 'Identity document',
  };

  // Handle person_ prefixed fields (for identity verification later)
  if (field.includes('person_') && field.includes('.verification.document')) {
    return 'Identity document';
  }

  // Default formatting for unmapped fields
  return labelMap[field] || field.replace(/_/g, ' ').replace(/\./g, ' ');
};

export default function StripeSetupPage() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountStatus, setAccountStatus] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    checkAccountStatus();
  }, []);
  
  // Auto-redirect when account becomes active
  useEffect(() => {
    if (accountStatus?.computedStatus === 'fully_active' && returnTo) {
      setTimeout(() => {
        router.push(returnTo);
      }, 2000);
    }
  }, [accountStatus?.computedStatus, returnTo, router]);

  // Auto-refresh when pending verification
  useEffect(() => {
    let intervalId;
    if (accountStatus?.requirements?.pending_verification?.length > 0 && 
        accountStatus?.requirements?.currently_due?.length === 0) {
      intervalId = setInterval(() => {
        checkAccountStatus();
      }, 30000); // 30 seconds
    }
    return () => intervalId && clearInterval(intervalId);
  }, [accountStatus]);

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

  const handleAction = async () => {
    // For fully active accounts, open dashboard in new tab
    if (accountStatus?.computedStatus === 'fully_active') {
      window.open('https://dashboard.stripe.com', '_blank');
      return;
    }

    setLoading(true);
    try {
      const payload = returnTo ? { returnTo } : {};
      const { data } = await axios.post(
        `${API_BASE_URL}/stripe/onboard`,
        payload,
        { withCredentials: true }
      );

      if (data.url) {
        // Redirect to Stripe onboarding (will come back via returnTo)
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Stripe onboarding error:', err);
      setLoading(false);
    }
  };

  const showSkeleton = useDelayedLoading(checkingStatus);

  if (checkingStatus || showSkeleton) {
    return (
      <div>
        <ProfilePageHeading title="Stripe Payout Setup" />
        {showSkeleton && <PageSkeleton variant="form" rows={4} />}
      </div>
    );
  }

  const status = accountStatus?.computedStatus || 'no_account';
  const currentlyDue = accountStatus?.requirements?.currently_due || [];
  const pendingVerification = accountStatus?.requirements?.pending_verification || [];
  const hasActionRequired = currentlyDue.length > 0;
  const hasPendingOnly = pendingVerification.length > 0 && currentlyDue.length === 0;

  // Simplified button configuration
  const getButtonConfig = () => {
    if (loading) {
      return { 
        text: 'Loading...', 
        disabled: true, 
        className: 'bg-gray-400' 
      };
    }

    // No account yet
    if (status === 'no_account') {
      return { 
        text: 'Connect with Stripe', 
        disabled: false, 
        className: 'bg-blue-600 hover:bg-blue-700' 
      };
    }
    
    // Fully active - can access dashboard
    if (status === 'fully_active') {
      return { 
        text: '✅ Open Stripe Dashboard', 
        disabled: false, 
        className: 'bg-green-600 hover:bg-green-700' 
      };
    }
    
    // Has requirements to complete
    if (hasActionRequired) {
      return { 
        text: 'Complete Setup', 
        disabled: false, 
        className: 'bg-orange-600 hover:bg-orange-700' 
      };
    }
    
    // Only pending verification
    if (hasPendingOnly) {
      return { 
        text: '⏳ Verification in Progress', 
        disabled: true, 
        className: 'bg-gray-400' 
      };
    }
    
    // Default - continue setup
    return { 
      text: 'Continue Setup', 
      disabled: false, 
      className: 'bg-blue-600 hover:bg-blue-700' 
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div>
      <div>
        <ProfilePageHeading title="Stripe Payout Setup" />

        {/* Refresh */}
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={checkAccountStatus}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            disabled={checkingStatus}
          >
            <svg className={`w-5 h-5 ${checkingStatus ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-gray-600 mb-6">
          Setup Stripe account to receive payments for your paid events
        </p>


        {/* Action Required Section */}
        {hasActionRequired && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-orange-800 mb-3">Action Required</h2>
            <div className="space-y-2">
              {/* Simple list without grouping */}
              {[...new Set(currentlyDue.map(getRequirementLabel))].map((label, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification in Progress Section */}
        {hasPendingOnly && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-yellow-800 mb-3 flex items-center">
              <span className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Verification in Progress
            </h2>
            <div className="space-y-2">
              {pendingVerification.map((req, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span className="text-sm text-gray-700">{getRequirementLabel(req)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-yellow-700 mt-3">
              Verification typically completes within a few minutes to a few hours
            </p>
          </div>
        )}

        {/* Success Message */}
        {status === 'fully_active' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">
              ✅ Your Stripe setup is complete. You can now receive payments for your events.
            </p>
            {returnTo && (
              <p className="text-sm text-green-700 mt-2">
                Redirecting you back in 2 seconds...
              </p>
            )}
          </div>
        )}

        {/* Main Action Button */}
        <button
          onClick={handleAction}
          disabled={buttonConfig.disabled}
          className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-colors ${buttonConfig.className} ${
            buttonConfig.disabled ? 'cursor-not-allowed' : ''
          }`}
        >
          {buttonConfig.text}
        </button>

        {/* Return Link */}
        {returnTo && (
          <button
            onClick={() => router.push(returnTo)}
            className="w-full mt-3 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
          >
            ← Return to {returnTo.includes('event') ? 'event creation' : 'previous page'}
          </button>
        )}

        {/* Auto-refresh indicator */}
        {hasPendingOnly && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Auto-checking status every 30 seconds...
          </p>
        )}
      </div>
    </div>
  );
}