'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper function to format Stripe requirement names into user-friendly text
const formatRequirementName = (requirement) => {
  const formatters = {
    'individual.verification.document': 'Government-issued photo ID',
    'individual.verification.additional_document': 'Additional identity document',
    'individual.first_name': 'First name',
    'individual.last_name': 'Last name',
    'individual.dob.day': 'Date of birth (day)',
    'individual.dob.month': 'Date of birth (month)', 
    'individual.dob.year': 'Date of birth (year)',
    'individual.address.line1': 'Street address',
    'individual.address.city': 'City',
    'individual.address.state': 'State',
    'individual.address.postal_code': 'Postal code',
    'individual.phone': 'Phone number',
    'individual.email': 'Email address',
    'business_profile.name': 'Business name',
    'business_profile.url': 'Business website',
    'business_profile.mcc': 'Business category',
    'external_account': 'Bank account details',
    'tos_acceptance.date': 'Terms of service acceptance',
    'tos_acceptance.ip': 'Terms acceptance IP address'
  };
  
  return formatters[requirement] || requirement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

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
    setIsPopupWindow(false);
  }, []);

// Check account status on component mount
useEffect(() => {
  checkAccountStatus();
}, []);

// Auto-refresh when account is under review
useEffect(() => {
  let intervalId;
  
  // Only auto-refresh if account is under review or has pending verification
  if (accountStatus?.accountStatus === 'under_review' || 
      accountStatus?.statusAnalysis?.hasPendingVerification) {
    
    intervalId = setInterval(async () => {
      console.log('🔄 Auto-refreshing account status (under review)...');
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
}, [accountStatus?.accountStatus, accountStatus?.statusAnalysis?.hasPendingVerification]);

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

  // Handle completion and show success message
useEffect(() => {
  if (accountStatus?.charges_enabled && accountStatus?.payouts_enabled) {
    console.log('🎉 Stripe setup completed! Stopping auto-refresh.');
    // The auto-refresh will stop automatically due to status change
  }
}, [accountStatus?.charges_enabled, accountStatus?.payouts_enabled]);

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

  // Use enhanced status analysis if available
  const status = accountStatus.accountStatus || 'unknown';
  
  switch (status) {
    case 'fully_enabled':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Fully Enabled
        </span>
      );
      
    case 'under_review':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Under Review
        </span>
      );
      
    case 'setup_required':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          🔧 Setup Required
        </span>
      );
      
    case 'past_due':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ⚠️ Action Required
        </span>
      );
      
    case 'initial_setup_required':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          🚀 Setup Required
        </span>
      );
      
    default:
      // Fallback to old logic
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
  }
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
    if (isPopupWindow) {
      window.close();
    } else if (returnTo) {
      router.push(returnTo);
    } else {
      router.push('/events/add'); // Default fallback
    }
  };



  const handleDeleteAccount = async () => {
  // Confirmation dialog
  const confirmed = window.confirm(
    'Are you sure you want to delete your Stripe account?\n\n' +
    'This action cannot be undone. You will need to create a new account to receive payments.\n\n' +
    'Click OK to proceed with deletion.'
  );
  
  if (!confirmed) return;

  setLoading(true);
  try {
    const { data } = await axios.delete(
      `${API_BASE_URL}/stripe/account`,
      { withCredentials: true }
    );
    
    if (data.success) {
      alert('✅ Stripe account deleted successfully! You can create a new account anytime.');
      
      // Refresh status to show "No Account" state
      await checkAccountStatus();
      
      // If in popup, you might want to close it
      if (isPopupWindow) {
        setTimeout(() => {
          try {
            window.close();
          } catch (error) {
            console.log('Could not close popup:', error);
          }
        }, 2000);
      }
    } else {
      alert('❌ ' + (data.error || 'Failed to delete account. Please try again.'));
    }
  } catch (err) {
    console.error('Delete account error:', err);
    const errorMessage = err.response?.data?.error || 'Failed to delete account. Please try again.';
    alert('❌ ' + errorMessage);
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

  const status = accountStatus.accountStatus || 'unknown';
  const nextActions = accountStatus.nextActions || [];

  // Fully operational account
  if (status === 'fully_enabled') {
    return (
      <div className="space-y-3">
        <div className="text-green-600 font-medium text-center py-4 bg-green-50 rounded-lg border border-green-200">
  🎉 Your Stripe account is fully set up and ready to receive payments!
  <div className="text-sm text-green-700 mt-2">
    You can now log into dashboard.stripe.com with your Stripe credentials.
  </div>
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
     <a
      href="https://dashboard.stripe.com"
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center flex items-center justify-center"
    >
      📊 Open Stripe Dashboard
    </a>
    
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
    <p className="font-medium text-blue-800 mb-1">💡 Your Stripe Dashboard</p>
    <ul className="text-blue-700 space-y-1">
      <li>• View all your ticket sales and earnings</li>
      <li>• Track payouts to your bank account</li>
      <li>• Download tax documents and reports</li>
      <li>• Update your payment settings</li>
      <li>• Access Stripe support directly</li>
      <li>• Log in anytime at dashboard.stripe.com</li>
    </ul>
  </div>
)}
      </div>
    );
  }

  // Account needs action (setup_required, past_due)
  if (status === 'setup_required' || status === 'past_due' || status === 'initial_setup_required') {
    const primaryAction = nextActions[0];
    const urgencyClass = status === 'past_due' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700';
    
    return (
      <div className="space-y-3">
        {/* Status message */}
        <div className={`p-4 rounded-lg border ${
          status === 'past_due' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-orange-50 border-orange-200 text-orange-800'
        }`}>
          <div className="font-medium mb-2">
            {status === 'past_due' && '🚨 Immediate Action Required'}
            {status === 'setup_required' && '🔧 Setup Incomplete'}
            {status === 'initial_setup_required' && '🚀 Complete Initial Setup'}
          </div>
          
          {/* Show specific action guidance */}
          {primaryAction && (
            <div className="text-sm">
              <strong>{primaryAction.title}:</strong> {primaryAction.description}
            </div>
          )}
          
          {/* Show all missing items if not popup */}
          {!isPopupWindow && nextActions.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Missing:</div>
              <ul className="text-xs space-y-1">
                {nextActions.map((action, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-current rounded-full mr-2"></span>
                    {action.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            className={`w-full px-4 py-3 text-white rounded font-medium disabled:opacity-50 ${urgencyClass}`}
            onClick={handleConnectStripe}
            disabled={loading}
          >
            {loading ? 'Redirecting to Stripe...' : 'Complete Missing Requirements'}
          </button>
          
          {/* Return button for popup/redirect scenarios */}
          {(returnTo || isPopupWindow) && (
            <button
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick={handleReturnToOriginalPage}
            >
              {isPopupWindow ? 'Close Window' : 'Return Later'}
            </button>
          )}
          
          {/* Delete option for problematic accounts */}
          {!isPopupWindow && accountStatus.canDelete && (
            <button
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Account & Start Over'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Under review (genuinely waiting for Stripe)
  if (status === 'under_review') {
    return (
      <div className="space-y-3">
        <div className="text-yellow-600 font-medium p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center mb-2">
            ⏳ <span className="ml-2">Under Review by Stripe</span>
          </div>
          <div className="text-sm">
            Your account is being reviewed. This usually takes a few minutes, but can take up to 24 hours in some cases.
          </div>
          {accountStatus.statusAnalysis?.hasPendingVerification && (
  <div className="text-xs mt-2 text-yellow-700">
    <div>Pending verification items: {accountStatus.statusAnalysis.allRequirements.pending_verification.length}</div>
    <div className="flex items-center mt-1">
      <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
      Auto-checking every 30 seconds...
    </div>
  </div>
)}
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
          Under Review - Please Wait
        </button>
      </div>
    );
  }

  // Fallback for unknown status
  return (
    <button
      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      onClick={handleConnectStripe}
      disabled={loading}
    >
      {loading ? 'Checking Status...' : 'Continue Setup'}
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

{/* Enhanced Account Status Details - simplified for popup */}
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
            
            {/* Enhanced status information */}
            {accountStatus.accountStatus && (
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium capitalize text-blue-600">
                  {accountStatus.accountStatus.replace(/_/g, ' ')}
                </span>
              </div>
            )}
            
            {/* Show verification status */}
            {accountStatus.statusAnalysis && (
              <>
                {accountStatus.statusAnalysis.hasCurrentlyDue && (
                  <div className="flex justify-between">
                    <span>Missing Items:</span>
                    <span className="text-orange-600 font-medium">
                      {accountStatus.statusAnalysis.allRequirements.currently_due.length} required
                    </span>
                  </div>
                )}
                
                {accountStatus.statusAnalysis.hasPendingVerification && (
                  <div className="flex justify-between">
                    <span>Under Review:</span>
                    <span className="text-yellow-600 font-medium">
                      {accountStatus.statusAnalysis.allRequirements.pending_verification.length} items
                    </span>
                  </div>
                )}
              </>
            )}
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

{/* Enhanced Requirements Section - only show if not popup */}
      {!isPopupWindow && accountStatus?.statusAnalysis?.hasCurrentlyDue && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            Required Actions ({accountStatus.statusAnalysis.allRequirements.currently_due.length})
          </h4>
          
          {/* Categorized requirements */}
          {accountStatus.statusAnalysis.categories.idVerification.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-medium text-red-700 mb-1">🆔 ID Verification Required</div>
              <ul className="text-sm text-red-600 space-y-1 ml-4">
                {accountStatus.statusAnalysis.categories.idVerification.map((req, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    {formatRequirementName(req)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {accountStatus.statusAnalysis.categories.businessInfo.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-medium text-orange-700 mb-1">🏢 Business Information</div>
              <ul className="text-sm text-orange-600 space-y-1 ml-4">
                {accountStatus.statusAnalysis.categories.businessInfo.map((req, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                    {formatRequirementName(req)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {accountStatus.statusAnalysis.categories.banking.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-medium text-blue-700 mb-1">🏦 Banking Information</div>
              <ul className="text-sm text-blue-600 space-y-1 ml-4">
                {accountStatus.statusAnalysis.categories.banking.map((req, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {formatRequirementName(req)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {accountStatus.statusAnalysis.categories.other.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-1">📋 Other Requirements</div>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                {accountStatus.statusAnalysis.categories.other.map((req, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    {formatRequirementName(req)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-3 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
            💡 Click "Complete Missing Requirements" above to fix these issues through Stripe's secure verification process.
          </div>
        </div>
      )}
      
      {/* Pending verification section */}
      {!isPopupWindow && accountStatus?.statusAnalysis?.hasPendingVerification && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center">
            <span className="mr-2">⏳</span>
            Under Review ({accountStatus.statusAnalysis.allRequirements.pending_verification.length} items)
          </h4>
          <div className="text-sm text-blue-700">
            These items are currently being reviewed by Stripe. No action needed from you.
          </div>
          <ul className="text-xs text-blue-600 space-y-1 mt-2 ml-4">
            {accountStatus.statusAnalysis.allRequirements.pending_verification.map((req, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                {formatRequirementName(req)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}