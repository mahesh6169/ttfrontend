'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import QRScanner from '@/components/coupons/QRScanner';
import { MdStore, MdCheckCircle, MdCancel, MdEdit } from 'react-icons/md';

export default function ValidationPage() {
  const [step, setStep] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [storeInfo, setStoreInfo] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showScanner, setShowScanner] = useState(true);

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
      toast.error(error.response?.data?.message || 'Invalid Store ID');
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
        toast.success('Code validated successfully');
      }
    } catch (error) {
      console.error('❌ Validation error:', error);
      console.error('Response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Validation failed');
      setValidationResult({
        isValid: false,
        message: error.response?.data?.message || 'Invalid code'
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Code Validation</h1>

          {step === 1 && (
            <div>
              <div className="mb-4">
                <MdStore className="w-16 h-16 text-teal-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-center mb-2">Enter Store ID</h2>
                <p className="text-gray-600 text-center text-sm">
                  Please enter your 5-character store identifier
                </p>
              </div>

              <form onSubmit={handleStoreIdSubmit}>
                <input
                  type="text"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="ABC12"
                />
                
                <button
                  type="submit"
                  className="w-full mt-4 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  Verify Store
                </button>
              </form>
            </div>
          )}

          {step === 2 && storeInfo && (
            <div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MdCheckCircle className="text-teal-600 w-6 h-6" />
                  <div>
                    <p className="font-semibold text-teal-900">{storeInfo.storeName}</p>
                    <p className="text-sm text-teal-700">Store ID: {storeInfo.storeIdentifier}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearStore}
                  className="text-teal-600 hover:text-teal-700"
                  title="Change store"
                >
                  <MdEdit className="w-5 h-5" />
                </button>
              </div>

              {!validationResult && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Scan or Enter Code</h2>

                  {showScanner && (
                    <div className="mb-6">
                      <QRScanner onScanSuccess={handleScanSuccess} />
                    </div>
                  )}

                  <div className="border-t pt-6">
                    <p className="text-sm text-gray-600 mb-3 text-center">
                      Or enter the 5-digit code manually
                    </p>
                    
                    <form onSubmit={handleManualValidate} className="flex gap-2">
                      <input
                        type="text"
                        value={userCode}
                        onChange={(e) => setUserCode(e.target.value.replace(/\D/g, ''))}
                        maxLength={5}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="12345"
                      />
                      
                      <button
                        type="submit"
                        disabled={isValidating}
                        className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:bg-gray-300 transition-colors"
                      >
                        {isValidating ? 'Validating...' : 'Validate'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {validationResult && (
                <div className="mt-6">
                  {validationResult.isValid ? (
                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MdCheckCircle className="text-green-600 w-8 h-8" />
                        <h3 className="text-xl font-bold text-green-900">Valid Code</h3>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div>
                          <p className="text-sm text-gray-600">Code</p>
                          <p className="text-2xl font-mono font-bold text-gray-900">
                            {storeInfo.storeIdentifier}-{userCode}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="font-semibold text-gray-900">
                            {validationResult.userName}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Discount</p>
                          <p className="text-lg font-bold text-teal-700">
                            {validationResult.discount}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Product</p>
                          <p className="font-medium text-gray-900">
                            {validationResult.discountProduct}
                          </p>
                        </div>

                        {validationResult.termsConditions && (
                          <div>
                            <p className="text-sm text-gray-600">Terms & Conditions</p>
                            <p className="text-sm text-gray-700">
                              {validationResult.termsConditions}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm text-gray-600">Expires</p>
                          <p className="text-sm text-gray-900">
                            {new Date(validationResult.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleRedeem}
                        disabled={isRedeeming}
                        className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                      >
                        {isRedeeming ? 'REDEEMING...' : 'REDEEM CODE'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MdCancel className="text-red-600 w-8 h-8" />
                        <h3 className="text-xl font-bold text-red-900">Invalid Code</h3>
                      </div>

                      <p className="text-red-700 mb-6">
                        {validationResult.message || 'This code is not valid'}
                      </p>

                      <button
                        onClick={() => {
                          setValidationResult(null);
                          setUserCode('');
                        }}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
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

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This page is for store workers to validate and redeem customer discount codes</p>
        </div>
      </div>
    </div>
  );
}
