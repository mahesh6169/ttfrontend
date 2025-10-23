'use client';

import { QRCodeSVG } from 'qrcode.react';
import { MdClose, MdContentCopy, MdStore, MdLocalOffer } from 'react-icons/md';
import { FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function MyCodesModal({ code, campaign, store, onClose }) {
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState(200);

  const userCode = code.fullCode.split('-')[1];

  useEffect(() => {
    const handleResize = () => {
      setQrSize(window.innerWidth < 640 ? 160 : 200);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = new Date(campaign.expiryDate) < new Date();
  const isRedeemed = code.isRedeemed;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button - absolute positioned */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1"
        >
          <MdClose size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* QR Code */}
          <div className="flex justify-center bg-gray-50 p-3 sm:p-4 rounded-lg">
            <QRCodeSVG
              value={userCode}
              size={qrSize}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* User Code (5-digit only) */}
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">Your Code</p>
            <div className="bg-teal-50 border-2 border-teal-600 rounded-lg p-2 sm:p-3">
              <p className="text-2xl sm:text-3xl font-bold text-teal-700 font-mono tracking-widest">
                {userCode}
              </p>
            </div>
          </div>

          {/* Store Info */}
          <div className="border-t pt-2 sm:pt-3 space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <MdStore className="text-gray-600 mt-0.5 sm:mt-1 flex-shrink-0" size={18} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500">Store</p>
                <p className="text-sm sm:text-base font-semibold text-gray-800">{store.storeName}</p>
                {store.address?.formattedAddress && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                    {store.address.formattedAddress}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <MdLocalOffer className="text-teal-600 mt-0.5 sm:mt-1 flex-shrink-0" size={18} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500">Discount</p>
                <p className="text-sm sm:text-base font-semibold text-teal-700">{campaign.discount}</p>
                <p className="text-xs sm:text-sm text-gray-600">{campaign.discountProduct}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <FaClock className="text-gray-600 mt-0.5 sm:mt-1 flex-shrink-0" size={16} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500">Valid Until</p>
                <p className={`text-sm sm:text-base font-semibold ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                  {format(new Date(campaign.expiryDate), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            {/* Status Badge - only show if redeemed or expired */}
            {(isRedeemed || isExpired) && (
              <div className="pt-0.5 sm:pt-1">
                {isRedeemed ? (
                  <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-200 text-gray-700">
                    ♻️ Redeemed on {format(new Date(code.redeemedAt), 'dd MMM yyyy')}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-700">
                    ⏰ Expired
                  </span>
                )}
              </div>
            )}

            {/* Terms & Conditions - scrollable if long */}
            {campaign.termsConditions && (
              <div className="pt-1.5 sm:pt-2">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Terms & Conditions</p>
                <div className="max-h-28 sm:max-h-32 overflow-y-auto text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 sm:p-3 rounded border border-gray-200">
                  {campaign.termsConditions}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
