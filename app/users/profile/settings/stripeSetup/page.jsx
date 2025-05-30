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
  const searchParams = useSearchParams();
  const router = useRouter();

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
        router.replace('/users/profile/settings/stripeSetup');
      }, 2000);
    }
  }, [searchParams, router]);

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

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/stripe/onboard`,
        {},
        { withCredentials: true }
      );
      
      if (data.status === 'complete') {
        // Account is already set up
        alert('Your Stripe account is already fully set up!');
        await checkAccountStatus(); // Refresh status
      } else if (data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      }
    } catch (err) {
      alert('Stripe onboarding failed. Please try again.');
      console.error('Stripe onboarding error:', err);
    } finally {
      setLoading(false);
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

  const getActionButton = () => {
    if (!accountStatus?.hasAccount) {
      return (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleConnectStripe}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Connect with Stripe'}
        </button>
      );
    }

    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return (
        <div className="space-y-2">
          <div className="text-green-600 font-medium">
            🎉 Your Stripe account is fully set up and ready to receive payments!
          </div>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-600 rounded cursor-not-allowed"
            disabled
          >
            Account Connected
          </button>
        </div>
      );
    }

    if (accountStatus.details_submitted) {
      return (
        <div className="space-y-2">
          <div className="text-yellow-600 font-medium">
            ⏳ Your account is under review by Stripe. This usually takes 1-2 business days.
          </div>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-600 rounded cursor-not-allowed"
            disabled
          >
            Under Review
          </button>
        </div>
      );
    }

    return (
      <button
        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
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

      {/* Account Status Details */}
      {accountStatus?.hasAccount && (
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

      {/* Refresh Button */}
      <button
        className="text-sm text-gray-500 hover:text-gray-700 underline"
        onClick={checkAccountStatus}
        disabled={checkingStatus}
      >
        {checkingStatus ? 'Checking...' : 'Refresh Status'}
      </button>

      {/* Requirements Section */}
      {accountStatus?.requirements && accountStatus.requirements.currently_due?.length > 0 && (
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