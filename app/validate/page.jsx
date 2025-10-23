'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import QRScanner from '@/components/coupons/QRScanner';
import { MdStore, MdCheckCircle, MdCancel, MdEdit, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';

export default function ValidationPage() {
  const [step, setStep] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [storeInfo, setStoreInfo] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

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

  const handleStoreIdSubmit = async (e) => {
    e.preventDefault();
    
    if (!storeId.trim() || storeId.length !== 5) {
      toast.error('Please enter a valid 5-character store ID');
      return;
    }

    console.log('🔍 Looking up store ID:', storeId.toUpperCase());

    try {
      const response = await axios.get(`/coupons/stores/lookup/${storeId.toUpperCase()}`);
      console.log('✅ Store lookup response:', response.data);
      
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
      console.error('❌ Store lookup error:', error);
      console.error('Response:', error.response?.data);
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
    console.log('🔍 Validating code:', fullCode);
    setIsValidating(true);

    try {
      const response = await axios.post('/coupons/validate', { fullCode });
      console.log('✅ Validation response:', response.data);
      
      if (response.data.success) {
        setValidationResult(response.data.validation);
      }
    } catch (error) {
      console.error('❌ Validation error:', error);
      console.error('Response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          (error.response?.status === 404 ? 'Code not found' : 'Invalid code');
      toast.error(errorMessage);
      setValidationResult({
        isValid: false,
        message: errorMessage
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleScanSuccess = (code) => {
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

  const handleRedeem = async () => {
    if (!validationResult?.isValid) return;

    setIsRedeeming(true);
    const fullCode = `${storeInfo.storeIdentifier}-${userCode}`;
    console.log('🎫 Redeeming code:', fullCode);

    try {
      const response = await axios.post('/coupons/redeem', { fullCode });
      console.log('✅ Redemption response:', response.data);
      
      if (response.data.success) {
        toast.success('Code redeemed successfully!');
        setValidationResult(null);
        setUserCode('');
        setShowScanner(false);
        setTimeout(() => setShowScanner(true), 100);
      }
    } catch (error) {
      console.error('❌ Redemption error:', error);
      console.error('Response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Redemption failed');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Code Validation</h1>

          {step === 1 && (
            <div>
              <div className="mb-4">
                <MdStore className="w-12 h-12 sm:w-16 sm:h-16 text-teal-600 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-lg sm:text-xl font-semibold text-center mb-2">Enter Store ID</h2>
                <p className="text-gray-600 text-center text-xs sm:text-sm">
                  Please enter your 5-character store identifier
                </p>
              </div>

              <form onSubmit={handleStoreIdSubmit}>
                <input
                  type="text"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-300 rounded-lg text-center text-xl sm:text-2xl font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="ABC12"
                />
                
                <button
                  type="submit"
                  className="w-full mt-3 sm:mt-4 bg-teal-600 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-teal-700 transition-colors"
                >
                  Verify Store
                </button>
              </form>
            </div>
          )}

          {step === 2 && storeInfo && (
            <div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <MdCheckCircle className="text-teal-600 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-teal-900 truncate">{storeInfo.storeName}</p>
                    <p className="text-xs sm:text-sm text-teal-700">Store ID: {storeInfo.storeIdentifier}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearStore}
                  className="text-teal-600 hover:text-teal-700 flex-shrink-0"
                  title="Change store"
                >
                  <MdEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {!validationResult && (
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Scan or Enter Code</h2>

                  {showScanner && (
                    <div className="mb-4 sm:mb-6">
                      <QRScanner onScanSuccess={handleScanSuccess} />
                    </div>
                  )}

                  <div className="border-t pt-4 sm:pt-6">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 text-center">
                      Or enter the 5-digit code manually
                    </p>
                    
                    <form onSubmit={handleManualValidate} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={userCode}
                        onChange={(e) => setUserCode(e.target.value.replace(/\D/g, ''))}
                        maxLength={5}
                        className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-300 rounded-lg text-center text-lg sm:text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="12345"
                      />
                      
                      <button
                        type="submit"
                        disabled={isValidating}
                        className="px-4 py-2.5 sm:px-6 sm:py-3 bg-teal-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-teal-700 disabled:bg-gray-300 transition-colors"
                      >
                        {isValidating ? 'Validating...' : 'Validate'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {validationResult && (
                <div className="mt-4 sm:mt-6">
                  {validationResult.isValid ? (
                    <div className="bg-teal-50 border-2 border-teal-600 rounded-lg p-4 sm:p-6">
                      {/* Code Display */}
                      <div className="text-center mb-4">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Code</p>
                        <p className="text-2xl sm:text-3xl font-mono font-black text-teal-800">
                          {userCode}
                        </p>
                      </div>

                      {/* Redeem Button */}
                      <button
                        onClick={handleRedeem}
                        disabled={isRedeeming}
                        className="w-full bg-teal-700 text-white py-4 sm:py-5 rounded-lg font-black text-lg sm:text-xl hover:bg-teal-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
                      >
                        {isRedeeming ? 'REDEEMING...' : 'REDEEM CODE'}
                      </button>

                      {/* View Details Toggle */}
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full mt-3 text-teal-700 hover:text-teal-800 font-semibold text-sm sm:text-base flex items-center justify-center gap-1 transition-colors"
                      >
                        {showDetails ? (
                          <>
                            Hide Details
                            <MdKeyboardArrowUp size={20} />
                          </>
                        ) : (
                          <>
                            View Details
                            <MdKeyboardArrowDown size={20} />
                          </>
                        )}
                      </button>

                      {/* Collapsible Details */}
                      {showDetails && (
                        <div className="mt-4 pt-4 border-t border-teal-200 space-y-2 text-sm sm:text-base text-gray-700">
                          <p>
                            <span className="font-semibold">Discount:</span> {validationResult.discount}
                          </p>

                          <p>
                            <span className="font-semibold">Product:</span> {validationResult.discountProduct}
                          </p>

                          <p>
                            <span className="font-semibold">Expires:</span> {new Date(validationResult.expiryDate).toLocaleDateString()}
                          </p>

                          {validationResult.termsConditions && (
                            <div>
                              <p className="font-semibold mb-1">Terms & Conditions:</p>
                              <div className="max-h-32 overflow-y-auto text-gray-600 bg-white p-3 rounded border border-teal-200">
                                {validationResult.termsConditions}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-4 sm:mb-6">
                        <MdCancel className="text-red-600 w-6 h-6 sm:w-8 sm:h-8" />
                        <h3 className="text-lg sm:text-xl font-bold text-red-900">{validationResult.message || 'Invalid code'}</h3>
                      </div>

                      <button
                        onClick={() => {
                          setValidationResult(null);
                          setUserCode('');
                        }}
                        className="w-full bg-red-600 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-700 transition-colors"
                      >
                        Try Another Code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
          <p>This page is for store workers to validate and redeem customer discount codes</p>
        </div>
      </div>
    </div>
  );
}
