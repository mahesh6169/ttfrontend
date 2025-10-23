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
        {/* Header with close button */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* QR Code */}
          <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
            <QRCodeSVG
              value={userCode}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* User Code (5-digit only) */}
          <div className="text-center">
            <div className="bg-teal-50 border-2 border-teal-600 rounded-lg p-3">
              <p className="text-3xl font-bold text-teal-700 font-mono tracking-widest">
                {userCode}
              </p>
            </div>
          </div>

          {/* View All Codes Link */}
          <div className="text-center pt-2">
            <span className="text-sm text-gray-600">For more details </span>
            <button
              onClick={() => {
                onClose();
                router.push('/users/profile/my-codes');
              }}
              className="text-teal-600 hover:text-teal-700 font-medium text-sm underline"
            >
              My Discount Codes →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
