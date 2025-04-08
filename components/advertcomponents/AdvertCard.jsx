import { FaHeart } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { FaFontAwesomeFlag } from 'react-icons/fa';
import { BsChatRightDots } from 'react-icons/bs';
import Link from 'next/link';

const AdvertCard = ({ advert, onWishlistToggle, isInWishlist}) => {
  const postedByName = advert.postedBy?.name || 'Guest';

  return (
<div className="relative border rounded-lg shadow-md p-4 bg-gray-50 w-full">
  {/* Wishlist Button - Top Right */}
  <button
    onClick={onWishlistToggle}
    className={`absolute top-2 right-2 text-white p-2 rounded-full z-10 ${
      isInWishlist ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 hover:bg-gray-400'
    }`}
    title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
  >
    <FaHeart className={`text-sm sm:text-base md:text-lg ${isInWishlist ? 'text-white' : 'text-gray-700'}`} />
  </button>
  

  <Link href={`/adverts/views/${advert._id}`}>
  {/* Image Box (50% height, full width) */}
  <div className="relative w-full h-40 sm:h-48 md:h-56">
    {advert.images?.length > 0 ? (
      <img src={advert.images[0].url} alt={advert.title} className="w-full h-full object-cover rounded-md" />
    ) : (
      <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
        No Image Available
      </div>
    )}

    {/* Price Box - Positioned on Top of Image */}
    {(advert.isForSale && advert.sellPrice > 0) ||
 (advert.isForHire && advert.hirePrice > 0) ||
 (advert.isForRent && advert.rentPrice > 0) ||
 (advert.isForShare && advert.sharePrice > 0) ? (
  <div className="absolute top-2 left-2 bg-gray-900 text-white font-bold px-2 py-1 rounded-md text-sm sm:text-base md:text-lg">
    {advert.isForSale
      ? `$${advert.sellPrice}`
      : advert.isForHire
      ? `$${advert.hirePrice} p/${advert.hireUnit}`
      : advert.isForRent
      ? `$${advert.rentPrice} p/${advert.rentUnit}`
      : `$${advert.sharePrice} p/${advert.shareUnit}`}
  </div>
) : null}

  </div>

  {/* Title Box */}
  <h2 className="text-base sm:text-lg md:text-xl font-bold mt-2 truncate">
    {advert.title}
  </h2>

  {/* Address Box */}
  <div className="flex items-center text-gray-600 text-sm truncate mt-2">
    <MdLocationOn className="text-lg mr-2 flex-shrink-0" />
    {advert.address?.suburb || advert.address?.state
      ? [advert.address?.suburb, advert.address?.state].filter(Boolean).join(', ')
      : 'Address not available'}
  </div>

  {/* Chat & Report Box */}
  <div className="flex justify-between mt-4">
    {/* Chat */}
    <div className="text-gray-600 flex flex-col items-center text-sm sm:text-base md:text-lg">
      <BsChatRightDots className="mb-1" size={20} />
      <span>Chat</span>
    </div>

    {/* Report */}
    <div className="text-gray-600 flex flex-col items-center text-sm sm:text-base md:text-lg">
      <FaFontAwesomeFlag className="mb-1" size={20} />
      <span>Report</span>
    </div>
  </div>
  </Link>
</div>
  );
};

export default AdvertCard;
