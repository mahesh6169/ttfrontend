import React, { useState } from 'react';
import { FaTimes, FaHeart } from 'react-icons/fa';
import { format, differenceInDays } from 'date-fns';
import { useAdvertWishlist } from '@/utils/helpers/adverts/userAdvertWishlist';
import SendMessage from '@/components/chat/SendMessage';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';


const FALLBACK_IMAGE_URL =
  'https://res.cloudinary.com/dtvrbdvkx/image/upload/v1744016068/No_Image_Available_mq5h6q.jpg';

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

    const getPriceLabel = () => {
      if (advert.isForSale) return { label: 'For Sale', value: `$${advert.sellPrice}` };
      if (advert.isForHire) return { label: 'For Hire', value: `$${advert.hirePrice} / ${advert.hireUnit}` };
      if (advert.isForRent) return { label: 'For Rent', value: `$${advert.rentPrice} / ${advert.rentUnit}` };
      if (advert.isForShare) return { label: 'For Share', value: `$${advert.sharePrice} / ${advert.shareUnit}` };
      return null;
    };

  return (
    <div id="SingleAdvertCard" className="border rounded shadow-md mx-auto ">
      {/* Image Section */}
      <div className="relative w-full mx-auto bg-gray-200 flex  overflow-hidden rounded">
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

      {/* Fullscreen Modal */}
      {isFullscreen && (
  <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
    {/* Image itself fills screen with padding and proper scaling */}
    <img
      src={advert.images[currentImageIndex].url}
      alt={advert.title || 'Advert Image'}
      className="object-contain w-[95vw] h-[95vh] sm:w-[78vw] sm:h-[78vh] rounded shadow-2xl"
    />

    {/* Close Button */}
    <button
      onClick={handleCloseFullscreen}
      className="absolute top-4 right-4 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
    >
      <FaTimes size={30} />
    </button>

    {/* Prev/Next Buttons */}
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


      {/* Title */}
      {advert.title && (
        <div className="my-2 px-2"> 
         <h2 className="text-base sm:text-lg text-center font-medium my-1 px-2 text-gray-800 break-words ">{advert.title}</h2>
         </div>
      )}
    
      {/* Posted By */}
      {advert.postedBy?.name && (
  <div className="flex justify-start gap-4 text-xs sm:text-sm text-gray-800 text-left mb-2 px-2">
    <span>
      <strong>Posted By:</strong> {advert.postedBy.name}
    </span>
    <span>
      <strong>Posted:</strong>{' '}
      {(() => {
        const postedDaysAgo = differenceInDays(new Date(), new Date(advert.createdAt));
        return postedDaysAgo <= 15
          ? postedDaysAgo === 0
            ? 'Today'
            : `${postedDaysAgo} day${postedDaysAgo > 1 ? 's' : ''} ago`
          : format(new Date(advert.createdAt), 'dd MMM yyyy');
      })()}
    </span>
  </div>
)}


      {/* Address */}
      {advert.address?.formattedAddress && (
        <div> 
    <p className="text-xs sm:text-sm text-gray-800 mb-2 px-2 text-left">
    <strong>Address:</strong> {advert.address.formattedAddress}
  </p>
  </div>
)}


      {/* Row: Category, Ad Type, Condition */}
      <div className="flex justify-start sm:gap-4 text-xs sm:text-sm text-gray-800 mb-2 px-2 text-left">
  {advert.category && (
    <p>
      <strong>Category:</strong> {advert.category}
    </p>
  )}
  {(advert.isWanted || advert.isOffered) && (
    <p>
      <strong>Ad Type:</strong>{' '}
      {advert.isWanted ? 'Wanted' : advert.isOffered ? 'Offered' : ''}
    </p>
  )}
  {advert.condition && (
    <p>
      <strong>Condition:</strong> {advert.condition}
    </p>
  )}
</div>


      {/* Row: Price */}
      {getPriceLabel() && (
  <p className="text-xs sm:text-sm text-gray-800 mb-2 px-2 text-left">
    <strong>{getPriceLabel().label}:</strong> {getPriceLabel().value}
  </p>
)}

  {/* Row: Condition */}
{advert.condition && (
    <p className="text-xs sm:text-sm text-gray-800 mb-2 px-2 text-left">
      <strong>Condition:</strong> {advert.condition}
    </p>
  )}

{/* Chat Container */}
{chatProps && (
        <div className="block md:hidden  px-2">
          <SendMessage {...chatProps} />
        </div>
      )}


      {/* Description */}
      {advert.description && (
  <div className="border px-2 rounded shadow-md text-left my-8 mx-2">
    <h3 className="text-sm sm:text-base text-start font-medium mb-2">Description</h3>
    <div className="text-xs sm:text-sm text-gray-800 text-justify space-y-2">
      {advert.description.split('\n').map((para, idx) => (
        <p key={idx} className="whitespace-pre-wrap">{para}</p>
      ))}
    </div>
  </div>
)}



    </div>
  );
};

export default SingleAdvertCard;
