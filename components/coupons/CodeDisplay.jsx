'use client';

import QRCodeDisplay from './QRCodeDisplay';
import { format } from 'date-fns';
import { MdStore, MdLocationOn, MdPhone } from 'react-icons/md';
import { FaTag } from 'react-icons/fa';

export default function CodeDisplay({ couponCode, campaign, store }) {
  const isExpired = new Date(campaign.expiryDate) < new Date();
  const isRedeemed = couponCode.isRedeemed;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${
      isExpired || isRedeemed ? 'opacity-75' : ''
    }`}>
      {/* Status Banner */}
      {(isExpired || isRedeemed) && (
        <div className={`mb-4 p-3 rounded-lg text-center font-semibold ${
          isRedeemed 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isRedeemed 
            ? `✓ Redeemed on ${format(new Date(couponCode.redeemedAt), 'dd MMM yyyy')}` 
            : '⚠ Expired'}
        </div>
      )}

      {/* QR Code */}
      <div className="mb-6">
        <QRCodeDisplay code={couponCode.fullCode} />
      </div>

      {/* Store Info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MdStore className="text-2xl text-teal-600" />
          <h2 className="text-xl font-bold text-gray-800">
            {store.storeName}
          </h2>
        </div>

        {store.address?.formattedAddress && (
          <div className="flex items-start gap-2 text-gray-600 mb-2">
            <MdLocationOn className="text-lg mt-0.5 flex-shrink-0" />
            <p className="text-sm">{store.address.formattedAddress}</p>
          </div>
        )}

        {store.contactInfo?.phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <MdPhone className="text-lg flex-shrink-0" />
            <a 
              href={`tel:${store.contactInfo.phone}`}
              className="text-sm hover:text-teal-600"
            >
              {store.contactInfo.phone}
            </a>
          </div>
        )}
      </div>

      {/* Campaign Details */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-start gap-2">
          <FaTag className="text-teal-600 mt-1 flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-teal-700">
              {campaign.discount}
            </p>
            <p className="text-sm text-gray-600">
              on {campaign.discountProduct}
            </p>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-semibold">Valid until:</span>{' '}
          {format(new Date(campaign.expiryDate), 'dd MMMM yyyy')}
        </div>

        {campaign.termsConditions && (
          <div className="text-sm">
            <p className="font-semibold text-gray-700 mb-1">
              Terms & Conditions:
            </p>
            <p className="text-gray-600 whitespace-pre-wrap">
              {campaign.termsConditions}
            </p>
          </div>
        )}
      </div>

      {/* Generated Date */}
      <div className="mt-4 pt-4 border-t text-xs text-gray-500 text-center">
        Generated on {format(new Date(couponCode.generatedAt), 'dd MMM yyyy, HH:mm')}
      </div>
    </div>
  );
}
