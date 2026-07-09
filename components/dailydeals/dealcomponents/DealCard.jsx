'use client';

import Link from 'next/link';
import { format, differenceInCalendarDays } from 'date-fns';
import { MdLocationOn, MdStorefront } from 'react-icons/md';

const DealCard = ({ deal }) => {
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_DEAL_IMAGE_URL;

  const daysUntilEnd = differenceInCalendarDays(new Date(deal.endDate), new Date());
  const isEndingSoon = daysUntilEnd <= 3 && daysUntilEnd >= 0;
  const isEndsToday = daysUntilEnd === 0;
  const daysLeftDisplay = daysUntilEnd + 1;

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
    <Link href={`/deals/views/${deal._id}`}>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative w-full h-40 sm:h-48 bg-slate-100">
          <img
            src={deal.images?.[0]?.url || FALLBACK_IMAGE}
            alt={deal.dealTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = FALLBACK_IMAGE;
            }}
          />
          {/* Featured Badge */}
          {isFeatured && (
            <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded">
              Featured
            </span>
          )}
          {/* Ending Soon Badge */}
          {isEndsToday && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              Ends Today!
            </span>
          )}
          {isEndingSoon && !isEndsToday && (
            <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              {daysLeftDisplay} {daysLeftDisplay === 1 ? 'day' : 'days'} left
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Deal Title */}
          <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2 min-h-[2.5rem]">
            {deal.dealTitle}
          </h3>

          {/* Business Name */}
          <div className="flex items-center text-xs text-slate-700 mb-2">
            <MdStorefront className="mr-0.5 flex-shrink-0" />
            <span className="font-medium truncate">{partner?.businessName || 'Unknown Partner'}</span>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center text-xs text-slate-500">
              <MdLocationOn className="mr-0.5 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}

          {/* Validity - right aligned */}
          <div className="text-xs text-slate-500 text-right mt-auto">
            until {format(new Date(deal.endDate), 'dd MMM')}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DealCard;
