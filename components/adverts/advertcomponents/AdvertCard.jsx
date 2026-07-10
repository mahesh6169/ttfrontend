'use client';

import { useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { BsChatRightDots } from 'react-icons/bs';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/utils/formatCurrency';
import { PRICING_CONFIG } from '../fieldSystem/PricingConfig';

// Odd-shape thresholds: wider than 2.2:1 or taller than ~1:1.5 → show whole (contain).
// Everything in between (normal photos / flyers) fills the box (cover).
const WIDE = 2.2;
const TALL = 0.65;

const AdvertCard = ({ advert, onWishlistToggle, isInWishlist }) => {
  const postedByName = advert.user?.name || 'Guest';
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_ADVERT_IMAGE_URL;
  const imageUrl = advert.images?.[0]?.url || FALLBACK_IMAGE;

  // Per-image fit: default cover (the common case), switch to contain once an
  // odd-shaped image reports its real dimensions on load.
  const [fit, setFit] = useState('cover');
  const handleImageLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (!w || !h) return;
    const r = w / h;
    setFit(r > WIDE || r < TALL ? 'contain' : 'cover');
  };

  const postedDaysAgo = differenceInDays(new Date(), new Date(advert.createdAt));
  const postedText = postedDaysAgo <= 15
    ? `${postedDaysAgo === 0 ? 'Today' : `${postedDaysAgo} day${postedDaysAgo > 1 ? 's' : ''} ago`}`
    : format(new Date(advert.createdAt), 'dd MMM yyyy');

  // Determine which price to display based on the new pricing array structure
  const getPriceLabel = (pricing) => {
    if (!pricing || !Array.isArray(pricing) || pricing.length === 0) {
      return null;
    }

    // Find the first pricing with an amount > 0
    const activePricing = pricing.find(price => price.amount > 0);
    if (!activePricing) return null;

    // Map price types to display labels
    const unitLabels = {
      'week': 'wk',
      'day': 'day',
      'month': 'mth',
      'year': 'yr'
    };
    
    const priceTypeLabels = {
      'sale': formatCurrency(activePricing.amount),
      'hire': `Hire · ${formatCurrency(activePricing.amount)}/${unitLabels[activePricing.unit] || activePricing.unit || 'day'}`,
      'rent': `Rent · ${formatCurrency(activePricing.amount)}/${unitLabels[activePricing.unit] || activePricing.unit || 'wk'}`,
      'share': `Share · ${formatCurrency(activePricing.amount)}/${unitLabels[activePricing.unit] || activePricing.unit || 'wk'}`
    };

    return priceTypeLabels[activePricing.priceType] || formatCurrency(activePricing.amount);
  };

  const priceLabel = getPriceLabel(advert.pricing);

  return (
    <div id="AdvertCard" className="relative bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
      {/* Wishlist Button - Top Right */}
      <button
        onClick={onWishlistToggle}
        className={`absolute top-2 right-2 text-white p-1.5 rounded-full z-10 ${
          isInWishlist ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-300 hover:bg-slate-400'
        }`}
        title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <FaHeart className={`text-xs sm:text-sm ${isInWishlist ? 'text-white' : 'text-slate-700'}`} />
      </button>

      <Link href={`/listings/views/${advert._id}`}>
        {/* Image Box (50% height, full width) — per-image cover/contain.
            Odd shapes show whole on a soft blurred backdrop instead of being cropped. */}
        <div className="relative w-full h-40 sm:h-48 md:h-56 rounded-t-xl overflow-hidden bg-slate-100">
          {fit === 'contain' && (
            <>
              <img
                src={imageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-70"
              />
              <div className="absolute inset-0 bg-white/20" />
            </>
          )}
          <img
            src={imageUrl}
            alt={advert.title}
            onLoad={handleImageLoad}
            className={`relative w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
          />
        </div>

        {/* Content wrapper */}
        <div className="p-2 pt-1.5">
          {/* Title Box */}
          <h2 className="text-sm font-semibold text-slate-900 line-clamp-2 min-h-[2.5rem]">
            {advert.title}
          </h2>

          {/* Price Box - Show "Wanted" for wanted ads */}
          <div className="text-xs font-medium mt-0.5 text-slate-700 h-4">
            {advert.adType === 'wanted' ? 'Wanted' :
             (!(PRICING_CONFIG[advert.category] || PRICING_CONFIG[advert.subcategory]) ? 'Request quote' : (priceLabel || '\u00A0'))}
          </div>

          {/* Location block */}
          <div className="flex items-center gap-1 mt-0.5 truncate">
            <MdLocationOn className="text-xs text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-500">
              {/* Display suburb and state if available, otherwise show venue */}
              {advert.address?.suburb || advert.address?.state
                ? [advert.address?.suburb, advert.address?.state].filter(Boolean).join(', ')
                : 'Address not available'}
            </span>
          </div>

          {/* Posted date */}
          <div className="text-xs text-slate-500 text-right whitespace-nowrap">{postedText}</div>
        </div>
      </Link>
    </div>
  );
};

export default AdvertCard;