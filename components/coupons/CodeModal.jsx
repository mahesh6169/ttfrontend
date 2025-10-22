'use client';

import { QRCodeSVG } from 'qrcode.react';
import { MdClose, MdContentCopy, MdStore, MdLocalOffer } from 'react-icons/md';
import { FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function CodeModal({ code, campaign, store, onClose }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const userCode = code.fullCode.split('-')[1];

  const handleCopy = () => {
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = new Date(campaign.expiryDate) < new Date();
  const isRedeemed = code.isRedeemed;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Your Discount Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="flex justify-center bg-gray-50 p-6 rounded-lg">
            <QRCodeSVG
              value={userCode}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* User Code (5-digit only) */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Your Code</p>
            <div className="bg-teal-50 border-2 border-teal-600 rounded-lg p-4">
              <p className="text-3xl font-bold text-teal-700 font-mono tracking-widest">
                {userCode}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="mt-3 flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <MdContentCopy />
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          {/* Store Info */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-start gap-3">
              <MdStore className="text-gray-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-xs text-gray-500">Store</p>
                <p className="font-semibold text-gray-800">{store.storeName}</p>
                {store.address?.formattedAddress && (
                  <p className="text-sm text-gray-600 mt-1">
                    {store.address.suburb || store.address.state}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MdLocalOffer className="text-teal-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-xs text-gray-500">Discount</p>
                <p className="font-semibold text-teal-700">{campaign.discount}</p>
                <p className="text-sm text-gray-600">on {campaign.discountProduct}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FaClock className="text-gray-600 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500">Valid Until</p>
                <p className={`font-semibold ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                  {format(new Date(campaign.expiryDate), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="pt-2">
              {isRedeemed ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                  ♻️ Redeemed on {format(new Date(code.redeemedAt), 'dd MMM yyyy')}
                </span>
              ) : isExpired ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                  ⏰ Expired
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  ✅ Active
                </span>
              )}
            </div>

            {/* Terms & Conditions */}
            {campaign.termsConditions && (
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-1">Terms & Conditions</p>
                <p className="text-sm text-gray-600">{campaign.termsConditions}</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>How to use:</strong> Show this QR code or tell the store staff your code number at checkout.
            </p>
          </div>

          {/* View All Codes Link */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                onClose();
                router.push('/users/profile/my-codes');
              }}
              className="text-teal-600 hover:text-teal-700 font-medium text-sm underline"
            >
              View all my codes →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
