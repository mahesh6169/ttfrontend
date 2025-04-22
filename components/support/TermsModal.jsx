'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CURRENT_TERMS_VERSION } from '@/constants/terms';
import { acceptUpdatedTerms } from '@/store/slices/users/userSlice';
import { toast } from 'react-toastify';

const TermsModal = () => {
  const dispatch = useDispatch();
  const { user, status, profileLoaded } = useSelector((state) => state.user);

  const needsToAccept =
    profileLoaded &&
    user &&
    user.role !== 'guest' &&
    (!user.acceptedTermsVersion ||
      user.acceptedTermsVersion !== CURRENT_TERMS_VERSION);

  console.log('Frontend check:', {
    current: CURRENT_TERMS_VERSION,
    userAccepted: user?.acceptedTermsVersion,
  });

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      await dispatch(acceptUpdatedTerms()).unwrap();
      toast.success('Terms accepted successfully!');
    } catch (err) {
      toast.error('Failed to accept terms');
    } finally {
      setLoading(false);
    }
  };

  if (!profileLoaded || !needsToAccept) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 text-center">
        <h2 className="text-xl font-bold mb-2">
          Updated Terms & Privacy Policy
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          We’ve updated our{' '}
          <Link
            href="/legal/terms"
            target="_blank"
            className="underline text-blue-600"
          >
            Terms
          </Link>{' '}
          and{' '}
          <Link
            href="/legal/privacy"
            target="_blank"
            className="underline text-blue-600"
          >
            Privacy Policy
          </Link>
          . Please review and accept them to continue using the site.
        </p>

        <div className="flex items-center justify-center gap-2 mb-4">
          <input
            type="checkbox"
            id="agree"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <label htmlFor="agree" className="text-sm">
            I agree to the Terms and Privacy Policy
          </label>
        </div>

        <button
          onClick={handleAccept}
          disabled={!agree || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Accepting...' : 'Accept & Continue'}
        </button>
      </div>
    </div>
  );
};

export default TermsModal;
