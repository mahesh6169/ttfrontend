'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function StripeSetupPage() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountStatus, setAccountStatus] = useState(null);
  const [stripeSuccess, setStripeSuccess] = useState(false);
  const [isPopupWindow, setIsPopupWindow] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get return URL from query params
  const returnTo = searchParams.get('returnTo');

  // Check if this is a popup window
  useEffect(() => {
    const isPopup = window.opener && !window.opener.closed;
    setIsPopupWindow(isPopup);
  }, []);

  // Check account status on component mount
  useEffect(() => {
    checkAccountStatus();
  }, []);

  useEffect(() => {
    // Check for ?success=true in URL after Stripe onboarding
    if (searchParams.get('success') === 'true') {
      setStripeSuccess(true);
      // Refresh account status after successful onboarding
      setTimeout(() => {
        checkAccountStatus();
        // Remove success param but keep returnTo
        const newUrl = returnTo 
          ? `/users/profile/settings/stripeSetup?returnTo=${encodeURIComponent(returnTo)}`
          : '/users/profile/settings/stripeSetup';
        router.replace(newUrl);
      }, 2000);
    }
  }, [searchParams, router, returnTo]);

  // ✅ AUTO-CLOSE FUNCTIONALITY - This is the key addition
  useEffect(() => {
    // Auto-close window when setup is complete (for popup windows)
    if (accountStatus?.charges_enabled && accountStatus?.payouts_enabled && isPopupWindow) {
      // Show success message briefly, then auto-close
      const closeTimer = setTimeout(() => {
        try {
          window.close();
        } catch (error) {
          console.log('Could not auto-close window:', error);
          // Fallback: try to notify parent window
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'STRIPE_SETUP_COMPLETE' }, '*');
          }
        }
      }, 3000); // Give user 3 seconds to see the success message

      return () => clearTimeout(closeTimer);
    }
  }, [accountStatus, isPopupWindow]);

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
      setAccountStatus({ hasAccount: false });
    } finally {
      setCheckingStatus(false);
    }
  };

  const getStatusBadge = () => {
    if (!accountStatus?.hasAccount) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Account
        </span>
      );
    }

    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Fully Enabled
        </span>
      );
    }

    if (accountStatus.details_submitted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Under Review
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        ⚠️ Setup Required
      </span>
    );
  };

  const handleConnectStripe = async () => {
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
        
        // If popup, close it, otherwise redirect
        if (isPopupWindow) {
          window.close();
        } else {
          const redirectUrl = data.returnTo || returnTo;
          if (redirectUrl) {
            router.push(redirectUrl);
          }
        }
        return;
      } else if (data.url) {
        // Redirect to Stripe onboarding (URL now includes returnTo)
        window.location.href = data.url;
      }
    } catch (err) {
      alert('Stripe onboarding failed. Please try again.');
      console.error('Stripe onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle return to original page
  const handleReturnToOriginalPage = () => {
    if (isPopupWindow) {
      window.close();
    } else if (returnTo) {
      router.push(returnTo);
    } else {
      router.push('/events/add'); // Default fallback
    }
  };

  const handleViewDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/stripe/dashboard-link`,
        {},
        { withCredentials: true }
      );
      
      if (data.success && data.url) {
        window.open(data.url, '_blank');
      } else {
        alert(data.error || 'Failed to generate dashboard link. Please try again.');
      }
    } catch (err) {
      console.error('Dashboard link error:', err);
      alert(err.response?.data?.error || 'Failed to generate dashboard link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getActionButton = () => {
    if (!accountStatus?.hasAccount) {
      return (
        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleConnectStripe}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Connect with Stripe'}
        </button>
      );
    }

    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return (
        <div className="space-y-3">
          <div className="text-green-600 font-medium text-center py-4 bg-green-50 rounded-lg border border-green-200">
            🎉 Your Stripe account is fully set up and ready to receive payments!
            {isPopupWindow && (
              <div className="text-sm text-green-700 mt-2">
                This window will close automatically in a few seconds...
              </div>
            )}
          </div>
          
          {/* Return button - different behavior for popup vs regular page */}
          {(returnTo || isPopupWindow) && (
            <button
              className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
              onClick={handleReturnToOriginalPage}
            >
              {isPopupWindow ? '✅ Close & Continue' : '✅ Continue Creating Event'}
            </button>
          )}
          
          {/* Dashboard Access Buttons - only show if not popup */}
          {!isPopupWindow && (
            <div className="flex space-x-3">
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                onClick={handleViewDashboard}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generating Link...
                  </>
                ) : (
                  <>
                    📊 View Dashboard
                  </>
                )}
              </button>
              
              <button
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-600 rounded cursor-not-allowed"
                disabled
              >
                ✅ Connected
              </button>
            </div>
          )}
          
          {/* Info section - only show if not popup */}
          {!isPopupWindow && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p className="font-medium text-blue-800 mb-1">💡 Your Dashboard</p>
              <ul className="text-blue-700 space-y-1">
                <li>• View all your ticket sales and earnings</li>
                <li>• Track payouts to your bank account</li>
                <li>• Download tax documents and reports</li>
                <li>• Update your payment settings</li>
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (accountStatus.details_submitted) {
      return (
        <div className="space-y-2">
          <div className="text-yellow-600 font-medium">
            ⏳ Your account is under review by Stripe. This usually takes 1-2 business days.
          </div>
          {(returnTo || isPopupWindow) && (
            <button
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 mb-2"
              onClick={handleReturnToOriginalPage}
            >
              {isPopupWindow ? 'Close Window' : 'Return to Event Creation'}
            </button>
          )}
          <button
            className="w-full px-4 py-2 bg-gray-200 text-gray-600 rounded cursor-not-allowed"
            disabled
          >
            Under Review
          </button>
        </div>
      );
    }

    return (
      <button
        className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        onClick={handleConnectStripe}
        disabled={loading}
      >
        {loading ? 'Redirecting...' : 'Complete Stripe Setup'}
      </button>
    );
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

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded shadow">
      {/* Show return breadcrumb if we have a return URL and it's not a popup */}
      {returnTo && !isPopupWindow && (
        <div className="mb-4 text-sm text-gray-600">
          <button
            onClick={handleReturnToOriginalPage}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Event Creation
          </button>
        </div>
      )}
      
      {/* Popup indicator */}
      {isPopupWindow && (
        <div className="mb-4 text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
          📱 Setup opened in popup - your event form is preserved in the main window
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Stripe Payout Setup</h2>
        {getStatusBadge()}
      </div>
      
      <p className="mb-6 text-gray-600">
        Connect your Stripe account to receive ticket sales payouts as an organiser.
      </p>

      {/* Success Message */}
      {stripeSuccess && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 font-medium">
          Stripe onboarding step completed! Checking final status...
        </div>
      )}

      {/* Account Status Details - simplified for popup */}
      {accountStatus?.hasAccount && !isPopupWindow && (
        <div className="bg-gray-50 p-4 rounded mb-6">
          <h3 className="font-medium mb-3 text-gray-800">Account Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Account ID:</span>
              <span className="font-mono text-xs">{accountStatus.accountId}</span>
            </div>
            <div className="flex justify-between">
              <span>Details Submitted:</span>
              <span className={accountStatus.details_submitted ? 'text-green-600' : 'text-red-600'}>
                {accountStatus.details_submitted ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Charges Enabled:</span>
              <span className={accountStatus.charges_enabled ? 'text-green-600' : 'text-red-600'}>
                {accountStatus.charges_enabled ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payouts Enabled:</span>
              <span className={accountStatus.payouts_enabled ? 'text-green-600' : 'text-red-600'}>
                {accountStatus.payouts_enabled ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mb-4">
        {getActionButton()}
      </div>

      {/* Refresh Button - only show if not popup or setup incomplete */}
      {(!isPopupWindow || !accountStatus?.charges_enabled || !accountStatus?.payouts_enabled) && (
        <button
          className="text-sm text-gray-500 hover:text-gray-700 underline"
          onClick={checkAccountStatus}
          disabled={checkingStatus}
        >
          {checkingStatus ? 'Checking...' : 'Refresh Status'}
        </button>
      )}

      {/* Requirements Section - only show if not popup */}
      {!isPopupWindow && accountStatus?.requirements && accountStatus.requirements.currently_due?.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800 mb-2">Required Information</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {accountStatus.requirements.currently_due.map((req, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                {req.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}