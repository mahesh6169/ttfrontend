import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaTimes, FaHeart } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { BsChatRightDots } from 'react-icons/bs';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '@/store/slices/userSlice';

const SingleAdvertCard = ({ advert }) => {
  const dispatch = useDispatch();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { tokenValidated, user } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user._id;

  const isInWishlist = user?.wishlist?.includes(advert._id);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getWishlist());
    }
  }, [dispatch, isAuthenticated]);

  const handleWishlistToggle = async (advertId) => {
    if (!isAuthenticated) {
      alert('Please log in to use the wishlist feature.');
      return;
    }

    try {
      const isInWishlist = user?.wishlist?.includes(advertId);
      if (isInWishlist) {
        await dispatch(removeFromWishlist({ advertId })).unwrap();
      } else {
        await dispatch(addToWishlist({ advertId })).unwrap();
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  const handleImageClick = () => {
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % advert.images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? advert.images.length - 1 : prevIndex - 1
    );
  };

  // **Determine the correct price format based on the advert details**
  const getPriceLabel = () => {
    if (advert.isForSale) return `$${advert.sellPrice}`;
    if (advert.isForHire) return `$${advert.hirePrice} / ${advert.hireUnit}`;
    if (advert.isForRent) return `$${advert.rentPrice} / ${advert.rentUnit}`;
    if (advert.isRequestQuote) return 'Request a Quote';
    return 'Price not available';
  };

  return (
    <div className="border p-4 rounded shadow-md bg-white max-w-[800px] mx-auto">
      {/* Images Section with Navigation */}
      <div className="relative w-full h-[500] bg-gray-200 flex items-center justify-center overflow-hidden rounded">
        {advert.images?.length > 0 ? (
          <img
            src={advert.images[currentImageIndex].url}
            alt={advert.title || 'Advert Image'}
            className="object-cover h-full w-full cursor-pointer"
            onClick={handleImageClick}
          />
        ) : (
          <span className="text-gray-500">No Image Available</span>
        )}
        {/* Navigation Buttons for Image Section */}
        {advert.images?.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full shadow"
            >
              Prev
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full shadow"
            >
              Next
            </button>
          </>
        )}
        {/* Wishlist Button */}
        <button
          onClick={() => handleWishlistToggle(advert._id)}
          className={`absolute top-2 right-2 text-white p-2 rounded-full z-10 ${
            isInWishlist
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-300 hover:bg-gray-400'
          }`}
          title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <FaHeart
            className={`text-sm sm:text-base md:text-lg ${
              isInWishlist ? 'text-white' : 'text-gray-700'
            }`}
          />
        </button>
      </div>

      {/* Fullscreen Image Modal with Navigation */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Image */}
            <img
              src={advert.images[currentImageIndex].url}
              alt={advert.title || 'Advert Image'}
              className="max-w-full max-h-full object-contain"
            />
            {/* Close Button */}
            <button
              onClick={handleCloseFullscreen}
              className="absolute top-1/3 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200 transition z-50"
            >
              <FaTimes size={30} />
            </button>
            {/* Previous Button */}
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200 transition"
            >
              Prev
            </button>
            {/* Next Button */}
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="p-4">
        {/* Title Section - Centered */}
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold">{advert.title || 'No Title'}</h2>
        </div>

        {/* Price */}
        <div className="mb-4 flex justify-between">
          <p>
            <strong>Price:</strong> {getPriceLabel()}
          </p>
        </div>

        {/* Location */}
        <div className="mb-4 flex justify-start">
        <MdLocationOn className="text-lg mr-2 flex-shrink-0" />
          <p>
             {advert.address?.formattedAddress || 'N/A'}
          </p>
        </div>

        {/* Condition and Category - Side by Side */}
        <div className="mb-4 flex justify-between">
          <p>
            <strong>Condition:</strong> {advert.condition || 'N/A'}
          </p>
          <p>
            <strong>Category:</strong> {advert.category || 'N/A'}
          </p>
        </div>

        {/* Posted By Section */}
        <div className="mb-4 flex justify-start">
          <p>
            <strong>Posted By:</strong> {advert.postedBy?.name || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Description Section */}
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">Description</h3>
        <p className="text-gray-700">
          {advert.description || 'No Description Provided'}
        </p>
      </div>
    </div>
  );
};

export default SingleAdvertCard;
