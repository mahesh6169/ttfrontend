'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Map backend status to user-friendly labels
const getStatusLabel = (backendStatus) => {
  const statusMap = {
    no_account: 'Not Connected',
    account_restricted: 'Action Required',
    action_required: 'Setup Incomplete',
    incomplete_setup: 'Setup Incomplete',
    under_review: 'Under Review',
    capabilities_pending: 'Processing',
    fully_active: 'Connected & Active',
    unknown: 'Status Unknown',
  };

  return statusMap[backendStatus] || 'Status Unknown';
};

// Get status badge styling
const getStatusBadge = (backendStatus) => {
  const label = getStatusLabel(backendStatus);

  switch (backendStatus) {
    case 'fully_active':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ {label}
        </span>
      );
    case 'account_restricted':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ⚠️ {label}
        </span>
      );
    case 'action_required':
    case 'incomplete_setup':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          🔧 {label}
        </span>
      );
    case 'under_review':
    case 'capabilities_pending':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ {label}
        </span>
      );
    case 'no_account':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {label}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {label}
        </span>
      );
  }
};

// Get status message
const getStatusMessage = (backendStatus) => {
  switch (backendStatus) {
    case 'no_account':
      return 'To create paid events, you need to set up your Stripe payment account.';
    case 'account_restricted':
      return '🚨 Your payment account has restrictions that need to be resolved before you can accept payments.';
    case 'action_required':
      return 'Your payment account requires additional information. Please complete the required actions.';
    case 'incomplete_setup':
      return 'Complete your Stripe payment account setup to enable paid events.';
    case 'under_review':
      return 'Your account is currently being reviewed by Stripe. This usually takes a few minutes.';
    case 'capabilities_pending':
      return 'Your account is being processed. This usually takes a few minutes.';
    case 'fully_active':
      return '🎉 Your Stripe setup is successfully completed.';
    default:
      return 'Please check your account status and complete any required setup.';
  }
};

// Get button text
const getButtonText = (backendStatus, loading) => {
  if (loading) {
    return backendStatus === 'no_account'
      ? 'Creating Account...'
      : 'Redirecting to Stripe...';
  }

  switch (backendStatus) {
    case 'no_account':
      return 'Connect with Stripe';
    case 'account_restricted':
      return 'Fix Issues Now';
    case 'action_required':
    case 'incomplete_setup':
      return 'Complete Setup';
    case 'under_review':
    case 'capabilities_pending':
      return 'Under Review - Please Wait';
    case 'fully_active':
      return 'View Stripe Dashboard';
    default:
      return 'Continue Setup';
  }
};

// Get button styling
const getButtonStyle = (backendStatus) => {
  switch (backendStatus) {
    case 'fully_active':
      return 'w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
    case 'account_restricted':
      return 'w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50';
    case 'action_required':
    case 'incomplete_setup':
      return 'w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50';
    case 'under_review':
    case 'capabilities_pending':
      return 'w-full px-4 py-2 bg-gray-200 text-gray-600 rounded cursor-not-allowed';
    default:
      return 'w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50';
  }
};

export default function StripeSetupPage() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountStatus, setAccountStatus] = useState(null);
  const [stripeSuccess, setStripeSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get return URL from query params
  const returnTo = searchParams.get('returnTo');

  // Check account status on component mount
  useEffect(() => {
    checkAccountStatus();
  }, []);

  // Auto-refresh when account is under review
  useEffect(() => {
    let intervalId;

    // Only auto-refresh if account is under review or capabilities pending
    if (
      accountStatus?.computedStatus === 'under_review' ||
      accountStatus?.computedStatus === 'capabilities_pending'
    ) {
      intervalId = setInterval(async () => {
        console.log('🔄 Auto-refreshing account status...');
        await checkAccountStatus();
      }, 30000); // Check every 30 seconds

      console.log('⏱️ Started auto-refresh for under review account');
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('🛑 Stopped auto-refresh');
      }
    };
  }, [accountStatus?.computedStatus]);

  useEffect(() => {
    // Check for ?success=true in URL after Stripe onboarding
    if (searchParams.get('success') === 'true') {
      setStripeSuccess(true);
      // Refresh account status after successful onboarding
      setTimeout(() => {
        checkAccountStatus();
        // Remove success param but keep returnTo
        const newUrl = returnTo
          ? `/users/profile/settings/stripeSetup?returnTo=${encodeURIComponent(
              returnTo
            )}`
          : '/users/profile/settings/stripeSetup';
        router.replace(newUrl);
      }, 2000);
    }
  }, [searchParams, router, returnTo]);

  // Handle completion and show success message
  useEffect(() => {
    if (accountStatus?.computedStatus === 'fully_active') {
      console.log('🎉 Stripe setup completed! Stopping auto-refresh.');
    }
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

  const handleAction = async () => {
    const status = accountStatus?.computedStatus || 'no_account';

    // For fully active accounts, redirect to Stripe dashboard
    if (status === 'fully_active') {
      window.open('https://dashboard.stripe.com', '_blank');
      return;
    }

    // For all other statuses, start/continue onboarding
    setLoading(true);
    try {
      // Include return URL in Stripe onboard request
      const payload = returnTo ? { returnTo } : {};

      const { data } = await axios.post(
        `${API_BASE_URL}/stripe/onboard`,
        payload,
        { withCredentials: true }
      );

      if (data.status === 'complete') {
        // Account is already set up - redirect back immediately
        alert('Your Stripe account is already fully set up!');
        await checkAccountStatus();

        const redirectUrl = data.returnTo || returnTo;
        if (redirectUrl) {
          router.push(redirectUrl);
        }
        return;
      } else if (data.url) {
        // Redirect to Stripe onboarding (URL now includes returnTo)
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      alert('Stripe onboarding failed. Please try again.');
      console.error('Stripe onboarding error:', err);
      setLoading(false);
    }
  };

  // Handle return to original page
  const handleReturnToOriginalPage = () => {
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.push('/events/add'); // Default fallback
    }
  };

  if (checkingStatus) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded shadow">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const currentStatus = accountStatus?.computedStatus || 'no_account';

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded shadow">
      {/* Show return breadcrumb if we have a return URL */}
      {returnTo && (
        <div className="mb-4 text-sm text-gray-600">
          <button
            onClick={handleReturnToOriginalPage}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Event Creation
          </button>
        </div>
      )}

      {/* Header with Status and Refresh */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold">Stripe Payout Setup</h2>
          {getStatusBadge(currentStatus)}
        </div>
        <button
          className="text-gray-400 hover:text-gray-600 transition-colors"
          onClick={checkAccountStatus}
          disabled={checkingStatus}
          title="Refresh Status"
        >
          <svg
            className={`w-5 h-5 ${checkingStatus ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Account ID - only show if account exists */}
      {accountStatus?.hasAccount && accountStatus?.accountId && (
        <div className="mb-4 text-sm text-gray-600">
          <span className="font-medium">Account ID:</span>
          <span className="font-mono ml-2">{accountStatus.accountId}</span>
        </div>
      )}

      {/* Success Message */}
      {stripeSuccess && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 font-medium">
          Stripe onboarding step completed! Checking final status...
        </div>
      )}

      {/* Auto-refresh indicator for under review */}
      {(currentStatus === 'under_review' ||
        currentStatus === 'capabilities_pending') && (
        <div className="mb-4 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
          <div className="flex items-center">
            <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
            Auto-checking status every 30 seconds...
          </div>
        </div>
      )}

      {/* Status Message */}
      <p className="mb-6 text-gray-600">{getStatusMessage(currentStatus)}</p>

      {/* Action Button */}
      <div className="mb-4">
        <button
          className={getButtonStyle(currentStatus)}
          onClick={handleAction}
          disabled={
            loading ||
            currentStatus === 'under_review' ||
            currentStatus === 'capabilities_pending'
          }
        >
          {getButtonText(currentStatus, loading)}
        </button>
      </div>

      {/* Create New Event Button - only for fully active accounts */}
      {currentStatus === 'fully_active' && (
        <div className="mb-4">
          <button
            className="w-full px-4 py-3 bg-teal-600 text-white rounded hover:bg-teal-700 font-medium"
            onClick={() => window.location.href = '/events/add'}
          >
            Create New Event
          </button>
        </div>
      )}

      {/* Return button for non-fully-active accounts */}
      {returnTo && currentStatus !== 'fully_active' && (
        <button
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mb-4"
          onClick={handleReturnToOriginalPage}
        >
          Return Later
        </button>
      )}

      {/* Continue button for fully active accounts */}
      {currentStatus === 'fully_active' && returnTo && (
        <button
          className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium mb-4"
          onClick={handleReturnToOriginalPage}
        >
          ✅ Continue Creating Event
        </button>
      )}

      {/* Additional info for fully active accounts */}
      {currentStatus === 'fully_active' && (
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <p className="font-medium text-blue-800 mb-1">
            💡 Your Stripe Dashboard Access
          </p>
          <ul className="text-blue-700 space-y-1">
            <li>
              • Log in anytime at dashboard.stripe.com using the username and
              password configured during your Stripe onboarding
            </li>
            <li>
              • View all ticket purchases and sales transactions for your events
            </li>
            <li>• Track refunds and process refund requests from attendees</li>
            <li>
              • Configure payout settings to control when funds are transferred
              to your bank account
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}