'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

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
  const [stripeTabOpen, setStripeTabOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    checkAccountStatus();
  }, []);
  
  // Reset stripeTabOpen when account becomes active
  useEffect(() => {
    if (accountStatus?.computedStatus === 'fully_active') {
      setStripeTabOpen(false);
    }
  }, [accountStatus?.computedStatus]);

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
    // For fully active accounts, open dashboard
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
        window.open(data.url, '_blank');
        setLoading(false);
        setStripeTabOpen(true);
        
        // Start checking status more frequently when Stripe tab is open
        const intervalId = setInterval(() => {
          checkAccountStatus();
        }, 5000); // Check every 5 seconds
        
        // Clean up interval after 5 minutes
        setTimeout(() => clearInterval(intervalId), 300000);
      }
    } catch (err) {
      console.error('Stripe onboarding error:', err);
      setLoading(false);
      // Error will be shown in UI through button state
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
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
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Stripe Payout Setup</h1>
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

        {/* Stripe Tab Open Notification */}
        {stripeTabOpen && status !== 'fully_active' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 animate-pulse">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Stripe setup opened in a new tab. Complete the form there.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This page will automatically update when you're done.
                </p>
              </div>
            </div>
          </div>
        )}

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