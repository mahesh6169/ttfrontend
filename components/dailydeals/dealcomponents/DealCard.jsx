'use client';

import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { MdLocationOn } from 'react-icons/md';

const DAYS_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const DealCard = ({ deal }) => {
  const FALLBACK_IMAGE = '/images/deal-placeholder.jpg';

  const daysUntilEnd = differenceInDays(new Date(deal.endDate), new Date());
  const isEndingSoon = daysUntilEnd <= 3 && daysUntilEnd >= 0;
  const isEndsToday = daysUntilEnd === 0;

  const formatValidDays = (validDays) => {
    if (!validDays || validDays.length === 0) return 'Every Day';
    if (validDays.length === 7) return 'Every Day';
    return validDays.map(d => DAYS_SHORT[d] || d).join(', ');
  };

  const partner = deal.partnerstoreId;
  const location = partner?.isNationwide
    ? 'Nationwide'
    : partner?.address?.suburb && partner?.address?.state
      ? `${partner.address.suburb}, ${partner.address.state}`
      : '';

  // Check if currently featured
  const now = new Date();
  const isFeatured = deal.featured?.isActive &&
    new Date(deal.featured.startDate) <= now &&
    new Date(deal.featured.endDate) >= now;

  return (
    <Link href={`/dailydeals/views/${deal._id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-40 bg-gray-100">
          <img
            src={deal.images?.[0]?.url || FALLBACK_IMAGE}
            alt={deal.dealTitle}
            className="w-full h-full object-cover"
          />
          {/* Featured Badge */}
          {isFeatured && (
            <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
              Featured
            </span>
          )}
          {/* Ending Soon Badge */}
          {isEndsToday && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              Ends Today!
            </span>
          )}
          {isEndingSoon && !isEndsToday && (
            <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              {daysUntilEnd} days left
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Partner Info */}
          <div className="flex items-center gap-2 mb-2">
            {partner?.logo?.url ? (
              <img
                src={partner.logo.url}
                alt={partner.businessName}
                className="w-8 h-8 object-contain rounded"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                {partner?.businessName?.charAt(0) || '?'}
              </div>
            )}
            <span className="text-sm font-medium text-gray-700 truncate">
              {partner?.businessName || 'Unknown Partner'}
            </span>
          </div>

          {/* Deal Title */}
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 flex-1">
            {deal.dealTitle}
          </h3>

          {/* Valid Days */}
          <div className="text-xs text-teal-700 font-medium mb-2">
            {formatValidDays(deal.validDays)}
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center text-xs text-gray-500">
              <MdLocationOn className="mr-1" />
              <span className="truncate">{location}</span>
            </div>
          )}

          {/* End Date */}
          <div className="text-xs text-gray-400 mt-1">
            Valid until {format(new Date(deal.endDate), 'dd MMM yyyy')}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DealCard;
