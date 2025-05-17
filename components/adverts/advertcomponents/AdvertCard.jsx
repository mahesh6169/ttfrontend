import { FaHeart } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { FaFontAwesomeFlag } from 'react-icons/fa';
import { BsChatRightDots } from 'react-icons/bs';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';

const AdvertCard = ({ advert, onWishlistToggle, isInWishlist}) => {
  const postedByName = advert.postedBy?.name || 'Guest';

  const postedDaysAgo = differenceInDays(new Date(), new Date(advert.createdAt));
  const postedText = postedDaysAgo <= 15
    ? `${postedDaysAgo === 0 ? 'Today' : `${postedDaysAgo} day${postedDaysAgo > 1 ? 's' : ''} ago`}`
    : format(new Date(advert.createdAt), 'dd MMM yyyy');

  // 📦 Determine which price to display
let priceLabel = null;


if (advert.isForSale && advert.sellPrice > 0) {
  priceLabel = `$${advert.sellPrice}`;
} else if (advert.isForHire && advert.hirePrice > 0) {
  priceLabel = `For Hire - $${advert.hirePrice} p/${advert.hireUnit}`;
} else if (advert.isForRent && advert.rentPrice > 0) {
  priceLabel = `For Rent - $${advert.rentPrice} p/${advert.rentUnit} `;
} else if (advert.isForShare && advert.sharePrice > 0) {
  priceLabel = `For Share - $${advert.sharePrice} p/${advert.shareUnit}`;
}



  return (
<div id="AdvertCard" className="relative border rounded-lg shadow-md  bg-gray-100 hover:bg-gray-200">
  {/* Wishlist Button - Top Right */}
  <button
    onClick={onWishlistToggle}
    className={`absolute top-2 right-2 text-white p-2 rounded-full z-10 ${
      isInWishlist ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 hover:bg-gray-400'
    }`}
    title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
  >
    <FaHeart className={`text-sm sm:text-base  ${isInWishlist ? 'text-white' : 'text-gray-700'}`} />
  </button>
  

  <Link href={`/adverts2/views/${advert._id}`}>
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

  {/* Title Box */}
  <h2 className="text-xs sm:text-sm text-center font-medium my-1 px-2 truncate text-gray-800">
    {advert.title}
  </h2>

  <div className="text-xs font-medium my-1 px-2 text-gray-800 h-4">
  {advert.isWanted ? 'Wanted $$$' : (priceLabel || '\u00A0')}
</div>

  {/* Location block */}
  <div className="flex items-center gap-1 px-2 truncate ">
    <MdLocationOn className="text-xs font-medium text-gray-600 flex-shrink-0" />
    <span className="text-xs font-medium  text-gray-600">
      {/* Display suburb and state if available, otherwise show venue */}
      {advert.address?.suburb || advert.address?.state
        ? [advert.address?.suburb, advert.address?.state].filter(Boolean).join(', ')
        : 'Address not available'}
    </span>
  </div>

  {/* Posted date */}
  <div className="text-xs font-medium text-gray-600 text-right whitespace-nowrap px-2 mb-1">{postedText}</div>

  </Link>
</div>
  );
};

export default AdvertCard;
