import React, { useState } from 'react';
import { FaTimes, FaHeart } from 'react-icons/fa';
import { format, differenceInDays } from 'date-fns';
import { useAdvertWishlist } from '@/utils/helpers/adverts/userAdvertWishlist';
import SendMessage from '@/components/chat/SendMessage';


const FALLBACK_IMAGE_URL =
  'https://res.cloudinary.com/dtvrbdvkx/image/upload/v1744016068/No_Image_Available_mq5h6q.jpg';

const SingleAdvertCard = ({ advert }) => {
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
    <div className="border p-4 rounded shadow-md bg-white max-w-[800px] mx-auto space-y-4">
      {/* Image Section */}
      <div className="relative w-full max-w-[600px] max-h-[500px] mx-auto bg-gray-200 flex items-center justify-center overflow-hidden rounded">
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={advert.images[currentImageIndex].url}
              alt={advert.title || 'Advert Image'}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={handleCloseFullscreen}
              className="absolute top-1/3 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200 transition z-50"
            >
              <FaTimes size={30} />
            </button>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200 transition"
            >
              Prev
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Title */}
      {advert.title && (
        <h2 className="text-2xl font-bold text-center break-words">{advert.title}</h2>
      )}

      {/* Posted By */}
      {advert.postedBy?.name && (
  <div className="flex justify-start gap-4 text-sm text-gray-600 px-2 text-left">
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
  <p className="text-sm text-gray-600 px-2 text-left">
    <strong>Address:</strong> {advert.address.formattedAddress}
  </p>
)}


      {/* Row: Category, Ad Type, Condition */}
      <div className="flex flex-col sm:flex-row justify-start gap-4 text-sm text-gray-700 px-2 text-left">
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
  <p className="text-base font-semibold px-2 text-left">
    <strong>{getPriceLabel().label}:</strong> {getPriceLabel().value}
  </p>
)}


      {/* Spacer */}
      <div className="my-2" />
{/* Chat Container */}

      {/* Spacer */}
      <div className="my-2" />

      {/* Description */}
      {advert.description && (
  <div className="border border-gray-300 p-3 rounded text-left">
    <h3 className="font-semibold mb-2">Description</h3>
    <p className="text-gray-800 whitespace-pre-wrap">{advert.description}</p>
  </div>
)}
    </div>
  );
};

export default SingleAdvertCard;
