import { FaHeart } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { BsChatRightDots } from 'react-icons/bs';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/utils/formatCurrency';
import { PRICING_CONFIG } from '../fieldSystem/PricingConfig';

const AdvertCard = ({ advert, onWishlistToggle, isInWishlist }) => {
  const postedByName = advert.user?.name || 'Guest';

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
    const priceTypeLabels = {
      'sale': formatCurrency(activePricing.amount),
      'hire': `For Hire - ${formatCurrency(activePricing.amount)} p/${activePricing.unit || 'day'}`,
      'rent': `For Rent - ${formatCurrency(activePricing.amount)} p/${activePricing.unit || 'week'}`,
      'share': `For Share - ${formatCurrency(activePricing.amount)} p/${activePricing.unit || 'week'}`
    };

    return priceTypeLabels[activePricing.priceType] || formatCurrency(activePricing.amount);
  };

  const priceLabel = getPriceLabel(advert.pricing);

  // Determine border color based on ad type
  const borderColorClass = advert.adType === 'wanted' 
    ? 'border-l-4 border-amber-400' 
    : 'border-l-4 border-teal-700';

  return (
    <div id="AdvertCard" className="relative border rounded-lg shadow-md bg-gray-100 hover:bg-gray-200">
      {/* Wishlist Button - Top Right */}
      <button
        onClick={onWishlistToggle}
        className={`absolute top-2 right-2 text-white p-2 rounded-full z-10 ${
          isInWishlist ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 hover:bg-gray-400'
        }`}
        title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <FaHeart className={`text-sm sm:text-base ${isInWishlist ? 'text-white' : 'text-gray-700'}`} />
      </button>

      <Link href={`/listings/views/${advert._id}`}>
        {/* Image Box (50% height, full width) */}
        <div className="relative w-full h-40 sm:h-48 md:h-56">
          {advert.images?.length > 0 ? (
            <img src={advert.images[0].url} alt={advert.title} className="w-full h-full object-cover rounded-md" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
              No Image Available
            </div>
          )}
        </div>

        {/* Content wrapper with subtle left border */}
        <div className={`${borderColorClass}`}>
          {/* Title Box */}
          <h2 className="text-xs sm:text-sm text-center font-medium my-1 px-2 truncate text-gray-800">
            {advert.title}
          </h2>

          {/* Price Box - Show "Wanted" for wanted ads */}
          <div className="text-xs font-medium my-1 px-2 text-gray-800 h-4">
            {advert.adType === 'wanted' ? 'Wanted' : 
             (!PRICING_CONFIG[advert.category] ? 'Request quote' : (priceLabel || '\u00A0'))}
          </div>

          {/* Location block */}
          <div className="flex items-center gap-1 px-2 truncate">
            <MdLocationOn className="text-xs font-medium text-gray-600 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-600">
              {/* Display suburb and state if available, otherwise show venue */}
              {advert.address?.suburb || advert.address?.state
                ? [advert.address?.suburb, advert.address?.state].filter(Boolean).join(', ')
                : 'Address not available'}
            </span>
          </div>

          {/* Posted date */}
          <div className="text-xs font-medium text-gray-600 text-right whitespace-nowrap px-2 mb-1">{postedText}</div>
        </div>
      </Link>
    </div>
  );
};

export default AdvertCard;