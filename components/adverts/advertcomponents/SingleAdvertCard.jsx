import React, { useState } from 'react';
import { FaTimes, FaHeart } from 'react-icons/fa';
import { format, differenceInDays } from 'date-fns';
import { useAdvertWishlist } from '@/utils/helpers/adverts/userAdvertWishlist';
import SendMessage from '@/components/chat/SendMessage';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatCurrency } from '@/utils/formatCurrency';
import { PRICING_CONFIG } from '../fieldSystem/PricingConfig';

const FALLBACK_IMAGE_URL =
  'https://res.cloudinary.com/dtvrbdvkx/image/upload/v1744016068/No_Image_Available_mq5h6q.jpg';

// Helper function to format field names
const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
};

const SingleAdvertCard = ({ advert, chatProps }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const {
    isInWishlist,
    toggleWishlist,
  } = useAdvertWishlist();

  const postedDaysAgo = differenceInDays(new Date(), new Date(advert.createdAt));
  const postedText =
    postedDaysAgo <= 15
      ? postedDaysAgo === 0
        ? 'Today'
        : `${postedDaysAgo} day${postedDaysAgo > 1 ? 's' : ''} ago`
      : format(new Date(advert.createdAt), 'dd MMM yyyy');

  const handleImageClick = () => setIsFullscreen(true);
  const handleCloseFullscreen = () => setIsFullscreen(false);

  const handleNextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % advert.images.length);

  const handlePrevImage = () =>
    setCurrentImageIndex((prev) =>
      prev === 0 ? advert.images.length - 1 : prev - 1
    );

  // New function to get price information based on the pricing array
  const getPriceLabel = (pricing) => {
    if (!pricing || !Array.isArray(pricing) || pricing.length === 0) {
      return null;
    }

    // Find all pricing entries with an amount > 0
    const activePricings = pricing.filter(price => price.amount > 0);
    if (activePricings.length === 0) return null;

    return activePricings.map(price => {
      const unit = price.unit ? ` p/${price.unit}` : '';
      
      switch(price.priceType) {
        case 'sale':
          return { label: 'For Sale', value: formatCurrency(price.amount) };
        case 'hire':
          return { label: 'For Hire', value: `${formatCurrency(price.amount)}${unit}` };
        case 'rent':
          return { label: 'For Rent', value: `${formatCurrency(price.amount)}${unit}` };
        case 'share':
          return { label: 'For Share', value: `${formatCurrency(price.amount)}${unit}` };
        default:
          return { label: 'Price', value: `${formatCurrency(price.amount)}${unit}` };
      }
    });
  };

  const priceLabels = getPriceLabel(advert.pricing);

  // Determine border color based on ad type - using very subtle colors
  const borderColorClass = advert.adType === 'wanted' 
    ? 'border border-amber-100' 
    : 'border border-teal-100';

  return (
    <div id="SingleAdvertCard" className="border rounded shadow-md mx-auto">
      {/* Image Section - Keeping as is */}
      <div className="relative w-full mx-auto bg-gray-200 flex overflow-hidden rounded">
        {advert.images?.length > 0 ? (
          <img
            src={advert.images[currentImageIndex].url} 
            alt={advert.title || 'Advert Image'}
            className="object-contain w-full h-full cursor-pointer"
            onClick={handleImageClick}
          />
        ) : (
          <img
            src={FALLBACK_IMAGE_URL}
            alt="No Image"
            className="object-contain w-full h-full"
          />
        )}

        {advert.images?.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow"
            >
              <FaChevronRight />
            </button>
          </>
        )}

        {/* Wishlist Button */}
        <button
          onClick={() => toggleWishlist(advert._id)}
          className={`absolute top-2 right-2 text-white p-2 rounded-full z-10 ${
            isInWishlist(advert._id)
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-300 hover:bg-gray-400'
          }`}
          title={isInWishlist(advert._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <FaHeart
            className={`text-sm sm:text-base md:text-lg ${
              isInWishlist(advert._id) ? 'text-white' : 'text-gray-700'
            }`}
          />
        </button>
      </div>

      {/* Fullscreen Modal - Keeping as is */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <img
            src={advert.images[currentImageIndex].url}
            alt={advert.title || 'Advert Image'}
            className="object-contain w-[95vw] h-[95vh] sm:w-[78vw] sm:h-[78vh] rounded shadow-2xl"
          />

          <button
            onClick={handleCloseFullscreen}
            className="absolute top-4 right-4 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
          >
            <FaTimes size={30} />
          </button>

          <button
            onClick={handlePrevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
          >
            Prev
          </button>
          <button
            onClick={handleNextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* Content wrapper with subtle border */}
      <div className={`${borderColorClass} rounded-b`}>
        {/* Title Section */}
        {advert.title && (
          <div className="my-2 px-2"> 
            <h1 className="text-base sm:text-lg text-center font-bold my-1 px-2 text-gray-800 break-words">{advert.title}</h1>
          </div>
        )}
    
      {/* Main Details Section */}
      <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800">Details</h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Posted By */}
            {advert.postedBy?.name && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Posted By:</span>{' '}
                <span className="text-gray-600">{advert.postedBy.name}</span>
              </div>
            )}
            
            {/* Posted Date */}
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-gray-700">Posted:</span>{' '}
              <span className="text-gray-600">{postedText}</span>
            </div>
            
            {/* Ad Type */}
            {advert.adType && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Ad Type:</span>{' '}
                <span className="text-gray-600">{advert.adType === 'wanted' ? 'Wanted' : 'Offered'}</span>
              </div>
            )}
            
            {/* Category */}
            {advert.category && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Category:</span>{' '}
                <span className="text-gray-600">{advert.category}</span>
              </div>
            )}
            
            {/* Price Information */}
            {!PRICING_CONFIG[advert.category] ? (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Price:</span>{' '}
                <span className="text-gray-600">Request quote</span>
              </div>
            ) : (
              priceLabels && priceLabels.map((price, index) => (
                <div key={index} className="text-sm sm:text-base">
                  <span className="font-semibold text-gray-700">{price.label}:</span>{' '}
                  <span className="text-gray-600">{price.value}</span>
                </div>
              ))
            )}
            
            {/* Condition */}
            {advert.condition && advert.condition !== 'null' && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Condition:</span>{' '}
                <span className="text-gray-600">{advert.condition}</span>
              </div>
            )}
            
            {/* Location - Full width at the bottom */}
            {advert.address && (
              <div className="text-sm sm:text-base col-span-1 sm:col-span-2">
                <span className="font-semibold text-gray-700">
                  {advert.address.street ? 'Address:' : 'Location:'}
                </span>{' '}
                <span className="text-gray-600">
                  {advert.address.street 
                    ? advert.address.formattedAddress 
                    : `${advert.address.suburb}${advert.address.state ? ', ' + advert.address.state : ''}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Fields Section */}
      {advert.fields && Object.keys(advert.fields).length > 0 && (
        <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Additional Details</h3>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(advert.fields).map(([key, value]) => (
                <div key={key} className="text-sm sm:text-base">
                  <span className="font-semibold text-gray-700">{formatFieldName(key)}:</span>{' '}
                  <span className="text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Description Section */}
      {advert.description && (
        <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Description</h3>
          </div>
          <div className="p-3">
            <div className="text-sm sm:text-base text-gray-700 space-y-2">
              {advert.description.split('\n').map((para, idx) => (
                para.trim() && <p key={idx} className="leading-relaxed">{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Container - Mobile Only (After Additional Details) */}
      {chatProps && (
        <div className="block lg:hidden px-2 my-4">
          <SendMessage {...chatProps} />
        </div>
      )}
      </div> {/* End of content wrapper */}
    </div>
  );
};

export default SingleAdvertCard;