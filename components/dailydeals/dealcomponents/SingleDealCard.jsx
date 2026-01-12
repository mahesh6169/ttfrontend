'use client';

import { format } from 'date-fns';
import { MdLocationOn, MdPhone, MdEmail, MdLanguage } from 'react-icons/md';
import DealImageGallery from './DealImageGallery';
import Link from 'next/link';

const DAYS_FULL = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

const SingleDealCard = ({ deal }) => {
  const partner = deal.partnerstoreId;

  const formatValidDays = (validDays) => {
    if (!validDays || validDays.length === 0) return 'Valid Every Day';
    if (validDays.length === 7) return 'Valid Every Day';
    if (validDays.length === 1) return `Valid on ${DAYS_FULL[validDays[0]]}s`;

    const dayNames = validDays.map(d => DAYS_FULL[d] + 's');
    const lastDay = dayNames.pop();
    return `Valid on ${dayNames.join(', ')} and ${lastDay}`;
  };

  // Check if currently featured
  const now = new Date();
  const isFeatured = deal.featured?.isActive &&
    new Date(deal.featured.startDate) <= now &&
    new Date(deal.featured.endDate) >= now;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Image Gallery */}
      <div className="p-4">
        <DealImageGallery images={deal.images} />
      </div>

      {/* Deal Info */}
      <div className="p-4 border-t">
        {/* Featured Badge */}
        {isFeatured && (
          <span className="inline-block bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded mb-3">
            Featured Deal
          </span>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {deal.dealTitle}
        </h1>

        {/* Valid Days */}
        <div className="bg-teal-50 text-teal-800 font-medium px-4 py-2 rounded-lg mb-4">
          {formatValidDays(deal.validDays)}
        </div>

        {/* Date Range */}
        <div className="text-gray-600 mb-4">
          Valid from {format(new Date(deal.startDate), 'dd MMM yyyy')} to {format(new Date(deal.endDate), 'dd MMM yyyy')}
        </div>

        {/* Description */}
        {deal.description && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">About this deal</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{deal.description}</p>
          </div>
        )}

        {/* Terms */}
        {deal.terms && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Terms & Conditions</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{deal.terms}</p>
          </div>
        )}
      </div>

      {/* Partner Info */}
      <div className="p-4 border-t bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-4">About the Partner</h3>

        <div className="flex items-start gap-4">
          {/* Partner Logo */}
          {partner?.logo?.url ? (
            <img
              src={partner.logo.url}
              alt={partner.businessName}
              className="w-20 h-20 object-contain rounded-lg bg-white p-2 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
              {partner?.businessName?.charAt(0) || '?'}
            </div>
          )}

          <div className="flex-1">
            <h4 className="font-bold text-lg text-gray-900">{partner?.businessName}</h4>
            <p className="text-sm text-teal-600 mb-2">{partner?.category}</p>

            {partner?.description && (
              <p className="text-sm text-gray-600 mb-3">{partner.description}</p>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-2">
          {/* Location */}
          {partner?.isNationwide ? (
            <div className="flex items-center text-gray-600">
              <MdLocationOn className="mr-2 text-lg" />
              <span className="text-sm">Available Nationwide</span>
            </div>
          ) : partner?.address?.formattedAddress && (
            <div className="flex items-start text-gray-600">
              <MdLocationOn className="mr-2 text-lg mt-0.5" />
              <span className="text-sm">{partner.address.formattedAddress}</span>
            </div>
          )}

          {/* Phone */}
          {partner?.contactInfo?.phone && (
            <div className="flex items-center text-gray-600">
              <MdPhone className="mr-2 text-lg" />
              <a href={`tel:${partner.contactInfo.phone}`} className="text-sm text-teal-600 hover:underline">
                {partner.contactInfo.phone}
              </a>
            </div>
          )}

          {/* Email */}
          {partner?.contactInfo?.email && (
            <div className="flex items-center text-gray-600">
              <MdEmail className="mr-2 text-lg" />
              <a href={`mailto:${partner.contactInfo.email}`} className="text-sm text-teal-600 hover:underline">
                {partner.contactInfo.email}
              </a>
            </div>
          )}

          {/* Website */}
          {partner?.contactInfo?.website && (
            <div className="flex items-center text-gray-600">
              <MdLanguage className="mr-2 text-lg" />
              <a
                href={partner.contactInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-600 hover:underline"
              >
                {partner.contactInfo.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* View All Deals from Partner */}
        <Link
          href={`/dailydeals?partnerstoreId=${partner?._id}`}
          className="inline-block mt-4 text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          View all deals from {partner?.businessName} &rarr;
        </Link>
      </div>
    </div>
  );
};

export default SingleDealCard;
