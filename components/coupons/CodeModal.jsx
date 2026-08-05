'use client';

import { QRCodeSVG } from 'qrcode.react';
import { MdClose, MdContentCopy, MdStore, MdLocalOffer } from 'react-icons/md';
import { FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function CodeModal({ code, campaign, store, onClose }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const userCode = code.fullCode.split('-')[1];

  const handleCopy = () => {
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = new Date(campaign.expiryDate) < new Date();
  const isRedeemed = code.isRedeemed;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xs w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* QR Code */}
          <div className="flex justify-center">
            <QRCodeSVG
              value={userCode}
              size={120}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* User Code (5-digit only) */}
          <div className="text-center">
            <div className={`border-2 rounded-lg p-3 ${isRedeemed ? 'bg-slate-100 border-slate-400' : 'bg-teal-50 border-teal-600'}`}>
              <p className={`text-3xl font-bold font-mono tracking-widest ${isRedeemed ? 'text-slate-500' : 'text-teal-700'}`}>
                {userCode}
              </p>
              {isRedeemed && (
                <p className="text-xs text-slate-600 mt-2">
                  Redeemed on {format(new Date(code.redeemedAt), 'dd MMM yyyy')}
                </p>
              )}
            </div>
          </div>

          {/* View All Codes Link */}
          <div className="text-center pt-2">
            <span className="text-sm text-slate-600">For more details </span>
            <button
              onClick={() => {
                onClose();
                router.push('/users/profile/my-codes');
              }}
              className="text-teal-600 hover:text-teal-700 font-medium text-sm underline"
            >
              My Coupons →
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
