'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import QRScanner from '@/components/coupons/QRScanner';
import { MdStore, MdCancel, MdEdit, MdCheckCircle, MdKeyboardArrowDown, MdKeyboardArrowUp, MdClose } from 'react-icons/md';
import { formatValidDays, formatValidHours } from '@/utils/couponSchedule';

export default function ValidationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [storeInfo, setStoreInfo] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    const savedStoreId = localStorage.getItem('validationStoreId');
    const savedStoreInfo = localStorage.getItem('validationStoreInfo');

    if (savedStoreId && savedStoreInfo) {
      try {
        setStoreId(savedStoreId);
        setStoreInfo(JSON.parse(savedStoreInfo));
        setStep(2);
      } catch (error) {
        localStorage.removeItem('validationStoreId');
        localStorage.removeItem('validationStoreInfo');
      }
    }
  }, []);

  // Beep + vibrate feedback: a short tone on a valid code, a buzz pattern on invalid
  const signalResult = (isValid) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(isValid ? 100 : [70, 50, 70]);
      }
    } catch (e) { /* noop */ }

    if (!isValid) return;

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      osc.onended = () => ctx.close();
    } catch (e) { /* noop */ }
  };

  const handleStoreIdSubmit = async (e) => {
    e.preventDefault();

    if (!storeId.trim() || storeId.length !== 5) {
      toast.error('Please enter a valid 5-character store ID');
      return;
    }

    try {
      const response = await axios.get(`/coupons/stores/lookup/${storeId.toUpperCase()}`);

      if (response.data.success && response.data.store) {
        const store = response.data.store;
        setStoreInfo(store);
        localStorage.setItem('validationStoreId', storeId.toUpperCase());
        localStorage.setItem('validationStoreInfo', JSON.stringify(store));
        setStep(2);
        toast.success(`Store verified: ${store.storeName}`);
      } else {
        toast.error('Invalid Store ID - store not found');
        setStoreInfo(null);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Store ID incorrect - not found');
      } else {
        toast.error(error.response?.data?.message || 'Store ID incorrect');
      }
      setStoreInfo(null);
    }
  };

  const handleClearStore = () => {
    setStoreId('');
    setStoreInfo(null);
    setValidationResult(null);
    setUserCode('');
    localStorage.removeItem('validationStoreId');
    localStorage.removeItem('validationStoreInfo');
    setStep(1);
  };

  const handleValidateCode = async (code) => {
    if (!storeInfo) {
      toast.error('Please verify store ID first');
      return;
    }

    const fullCode = `${storeInfo.storeIdentifier}-${code}`;
    setIsValidating(true);
    scannerRef.current?.pause();  // freeze the camera while we show the result

    try {
      const response = await axios.post('/coupons/validate', { fullCode });

      if (response.data.success) {
        setValidationResult(response.data.validation);
        signalResult(response.data.validation.isValid);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
                          (error.response?.status === 404 ? 'Code not found' : 'Invalid code');
      toast.error(errorMessage);
      setValidationResult({
        isValid: false,
        message: errorMessage
      });
      signalResult(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleScanSuccess = (code) => {
    // Ignore late / duplicate detections while validating or showing a result
    if (isValidating || validationResult) return;

    const cleanCode = code.replace(/\s/g, '').toUpperCase();

    if (cleanCode.includes('-')) {
      const parts = cleanCode.split('-');
      const scannedUserCode = parts[1];
      setUserCode(scannedUserCode);
      handleValidateCode(scannedUserCode);
    } else if (cleanCode.length === 5 && /^\d+$/.test(cleanCode)) {
      setUserCode(cleanCode);
      handleValidateCode(cleanCode);
    } else {
      toast.error('Invalid QR code format');
    }
  };

  const handleManualValidate = (e) => {
    e.preventDefault();

    if (!userCode.trim() || userCode.length !== 5) {
      toast.error('Please enter a valid 5-digit code');
      return;
    }

    handleValidateCode(userCode);
  };

  // Clear the result and resume scanning for the next code
  const handleScanNext = () => {
    setValidationResult(null);
    setUserCode('');
    setShowDetails(false);
    scannerRef.current?.resume();
  };

  const handleRedeem = async () => {
    if (!validationResult?.isValid) return;

    setIsRedeeming(true);
    const fullCode = `${storeInfo.storeIdentifier}-${userCode}`;

    try {
      const response = await axios.post('/coupons/redeem', { fullCode });

      if (response.data.success) {
        toast.success('Code redeemed successfully!');
        handleScanNext();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Redemption failed');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Top bar — title + close to home */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
        <h1 className="text-base sm:text-lg font-bold text-teal-900">Validate a Discount Code</h1>
        <button
          onClick={() => router.push('/')}
          aria-label="Cancel"
          className="flex-shrink-0 flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full px-3 py-1.5 -mr-1 transition-colors"
        >
          Cancel
          <MdClose size={18} />
        </button>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 mb-5 sm:mb-6">Verify a customer's code by scanning the QR or entering it manually.</p>

      {step === 1 && (
        <div className="text-center">
          <MdStore className="w-12 h-12 sm:w-14 sm:h-14 text-teal-600 mx-auto mb-3" />
          <h2 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">Enter Store ID</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-4">Please enter your 5-character store identifier</p>

          <form onSubmit={handleStoreIdSubmit}>
            <input
              type="text"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value.toUpperCase())}
              maxLength={5}
              className="block w-full max-w-[200px] mx-auto px-4 py-2.5 border border-slate-300 rounded-lg text-center text-xl sm:text-2xl font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
              placeholder="ABC12"
            />

            <div className="flex justify-center mt-4">
              <button
                type="submit"
                className="px-8 py-2.5 rounded-full bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors"
              >
                Verify Store
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 2 && storeInfo && (
        <div>
          {/* Verified store — flat row with underline */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <MdCheckCircle className="text-teal-600 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base text-slate-900 truncate">{storeInfo.storeName}</p>
                <p className="text-xs sm:text-sm text-slate-500">Store ID: {storeInfo.storeIdentifier}</p>
              </div>
            </div>
            <button
              onClick={handleClearStore}
              className="text-teal-700 hover:text-teal-800 flex-shrink-0"
              title="Change store"
            >
              <MdEdit className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Scan area — stays mounted; hidden while a result shows so the camera can pause/resume */}
          <div className={validationResult ? 'hidden' : ''}>
            <h2 className="text-sm sm:text-base font-semibold text-slate-800 mb-3 sm:mb-4 text-center">Scan or Enter Code</h2>

            <div className="mb-4 sm:mb-6">
              <QRScanner ref={scannerRef} onScanSuccess={handleScanSuccess} />
            </div>

            <div className="border-t border-slate-200 pt-4 sm:pt-6">
              <p className="text-xs sm:text-sm text-slate-500 mb-3 text-center">
                Or enter the 5-digit code manually
              </p>

              <form onSubmit={handleManualValidate} className="flex flex-col items-center gap-3">
                <input
                  type="text"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={5}
                  className="w-full max-w-[200px] px-4 py-2.5 border border-slate-300 rounded-lg text-center text-lg sm:text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  placeholder="12345"
                />

                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-8 py-2.5 rounded-full bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:bg-slate-300 transition-colors"
                >
                  {isValidating ? 'Validating...' : 'Validate'}
                </button>
              </form>
            </div>
          </div>

          {validationResult && (
            <div className="mt-2">
              {validationResult.isValid ? (
                <div className="text-center">
                  {/* Code */}
                  <p className="text-xs sm:text-sm text-slate-500 mb-1">Code</p>
                  <p className="text-3xl sm:text-4xl font-mono font-black text-teal-800 mb-5">
                    {userCode}
                  </p>

                  {/* Redeem */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleRedeem}
                      disabled={isRedeeming}
                      className="px-10 py-3 rounded-full bg-teal-700 text-white font-bold text-base sm:text-lg hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      {isRedeeming ? 'REDEEMING...' : 'REDEEM CODE'}
                    </button>
                  </div>

                  {/* View Details toggle */}
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="mt-3 text-teal-700 hover:text-teal-800 font-semibold text-sm inline-flex items-center justify-center gap-1 transition-colors"
                  >
                    {showDetails ? (
                      <>Hide Details <MdKeyboardArrowUp size={18} /></>
                    ) : (
                      <>View Details <MdKeyboardArrowDown size={18} /></>
                    )}
                  </button>

                  {showDetails && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm text-slate-700 text-left">
                      <p><span className="font-semibold">Discount:</span> {validationResult.discount}</p>
                      <p><span className="font-semibold">Product:</span> {validationResult.discountProduct}</p>
                      <p><span className="font-semibold">Expires:</span> {new Date(validationResult.expiryDate).toLocaleDateString()}</p>
                      {formatValidDays(validationResult.validDays) && (
                        <p><span className="font-semibold">Valid days:</span> {formatValidDays(validationResult.validDays)}</p>
                      )}
                      {formatValidHours(validationResult.validHours) && (
                        <p><span className="font-semibold">Hours:</span> {formatValidHours(validationResult.validHours)}</p>
                      )}
                      {validationResult.termsConditions && (
                        <div>
                          <p className="font-semibold mb-1">Terms &amp; Conditions:</p>
                          <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{validationResult.termsConditions}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scan next */}
                  <div className="mt-5">
                    <button
                      onClick={handleScanNext}
                      className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                    >
                      Scan another code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <MdCancel className="text-red-500 w-10 h-10 mx-auto mb-2" />
                  <h3 className="text-base sm:text-lg font-bold text-red-700 mb-4">{validationResult.message || 'Invalid code'}</h3>
                  <div className="flex justify-center">
                    <button
                      onClick={handleScanNext}
                      className="px-8 py-2.5 rounded-full bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors"
                    >
                      Try Another Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
