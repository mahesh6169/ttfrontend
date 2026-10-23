import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaTimes, FaHeart, FaMobileAlt, FaEnvelope, FaGlobe, FaFacebook, FaInstagram, FaLock, FaCommentDots, FaExternalLinkAlt, FaShareAlt, FaMapMarkedAlt, FaThumbsUp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { format, differenceInDays } from 'date-fns';
import { useAdvertWishlist } from '@/utils/helpers/adverts/userAdvertWishlist';
import SendMessage from '@/components/chat/SendMessage';
import ShareIcons from '@/components/shared/ShareIcons';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatCurrency } from '@/utils/formatCurrency';
import { PRICING_CONFIG } from '../fieldSystem/PricingConfig';
import { needsCommunityField } from '../fieldSystem/Categories';
import { COMMUNITIES } from '@/utils/constants/communities';
import { useRouter } from 'next/navigation';
import { buildSlugUrl } from '@/utils/slugUtils';
import { isTravelRequest, getBudgetText, TRAVEL_SAFETY_NOTE, TRAVEL_BUDGET_FIELD_IDS, getTravelFieldLabel, formatTravelDate, getTravelPlaceText } from '../travelRequests';

// Helper function to get optimized image URL
const getOptimizedImageUrl = (imageObj, size = 'auto') => {
  if (!imageObj) return '';
  if (typeof imageObj === 'string') return imageObj;
  
  // Use pre-optimized URLs from backend
  if (imageObj.optimizedUrls) {
    if (size === 'fullscreen') return imageObj.optimizedUrls.fullscreen || imageObj.url || '';
    if (size === 'mobile') return imageObj.optimizedUrls.mobileDetail || imageObj.optimizedUrls.mobile || imageObj.url || '';
    if (size === 'desktop') return imageObj.optimizedUrls.desktopDetail || imageObj.optimizedUrls.desktop || imageObj.url || '';
    
    // Auto-detect based on screen size - use detail URLs for single view
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const mobileUrl = imageObj.optimizedUrls.mobileDetail || imageObj.optimizedUrls.mobile;
    const desktopUrl = imageObj.optimizedUrls.desktopDetail || imageObj.optimizedUrls.desktop;
    return isMobile ? mobileUrl : desktopUrl;
  }
  
  // Fallback to original URL
  return imageObj.url || '';
};

// Helper function to format field names
const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
};

// Helper function to mask mobile number (0412****** format)
const maskMobile = (mobile) => {
  if (!mobile || mobile.length < 4) return mobile;
  return mobile.slice(0, 4) + '******';
};

// Helper function to mask email (j***@gmail.com format)
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 1) return email;
  return localPart.charAt(0) + '***@' + domain;
};

// Social media icon mapping
const getSocialIcon = (platform) => {
  switch (platform) {
    case 'Facebook': return FaFacebook;
    case 'Instagram': return FaInstagram;
    case 'X': return FaXTwitter;
    default: return FaGlobe;
  }
};

const SingleAdvertCard = ({ advert, chatProps }) => {
  const router = useRouter();
  const user = useSelector((state) => state.user.user);

  // Handle login redirect for revealing masked contact info
  const handleLoginToReveal = () => {
    // Store current URL for redirect after login
    if (typeof window !== 'undefined') {
      localStorage.setItem('redirectAfterLogin', window.location.href);
    }
    router.push('/login?preserveRedirect=true');
  };
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_ADVERT_IMAGE_URL;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [serviceAreaOverflow, setServiceAreaOverflow] = useState(false);
  const [serviceAreaExpanded, setServiceAreaExpanded] = useState(false);
  const [descriptionOverflow, setDescriptionOverflow] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [chatInView, setChatInView] = useState(false);
  const serviceAreaRef = useRef(null);
  const descriptionRef = useRef(null);
  const mobileContactRef = useRef(null);
  const {
    isInWishlist,
    toggleWishlist,
  } = useAdvertWishlist();

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && advert.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % advert.images.length);
    }
    if (isRightSwipe && advert.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? advert.images.length - 1 : prev - 1));
    }
  };

  // Scroll to and focus the mobile contact form
  const handleContactClick = () => {
    if (mobileContactRef.current) {
      mobileContactRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus the textarea after scroll completes
      setTimeout(() => {
        const textarea = mobileContactRef.current?.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }, 500);
    }
  };

  const checkOverflow = (ref, setter) => {
    if (ref.current) {
      const { scrollHeight, clientHeight, scrollTop } = ref.current;
      const hasOverflow = scrollHeight > clientHeight;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 1;
      setter(hasOverflow && !isAtBottom);
    }
  };

  // Keyboard navigation for fullscreen gallery
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullscreen) return;
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev === 0 ? advert.images.length - 1 : prev - 1));
      }
      if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev + 1) % advert.images.length);
      }
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, advert.images?.length]);

  // Fade out the floating buttons once the inline chat scrolls into view (mobile).
  useEffect(() => {
    const node = mobileContactRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setChatInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [chatProps?.resourceId]);

  useEffect(() => {
    checkOverflow(serviceAreaRef, setServiceAreaOverflow);
    checkOverflow(descriptionRef, setDescriptionOverflow);

    const serviceAreaEl = serviceAreaRef.current;
    const descriptionEl = descriptionRef.current;

    const handleServiceAreaScroll = () => checkOverflow(serviceAreaRef, setServiceAreaOverflow);
    const handleDescriptionScroll = () => checkOverflow(descriptionRef, setDescriptionOverflow);

    if (serviceAreaEl) {
      serviceAreaEl.addEventListener('scroll', handleServiceAreaScroll);
    }
    if (descriptionEl) {
      descriptionEl.addEventListener('scroll', handleDescriptionScroll);
    }

    return () => {
      if (serviceAreaEl) {
        serviceAreaEl.removeEventListener('scroll', handleServiceAreaScroll);
      }
      if (descriptionEl) {
        descriptionEl.removeEventListener('scroll', handleDescriptionScroll);
      }
    };
  }, [advert.fields?.serviceArea, advert.description]);

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


  return (
    <div id="SingleAdvertCard" className="mx-auto">
      {/* Image Section */}
      <div
        className="relative w-full mx-auto bg-white rounded h-[200px] sm:h-[300px] md:h-[400px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={advert.images?.length > 0 ? getOptimizedImageUrl(advert.images[currentImageIndex]) : FALLBACK_IMAGE}
          alt={advert.title || 'Advert Image'}
          className="object-contain w-full h-full cursor-pointer"
          onClick={handleImageClick}
          onError={(e) => {
            console.error('Image failed to load:', e.target.src);
            e.target.src = FALLBACK_IMAGE;
          }}
        />
        {/* Fullscreen hint */}
        {advert.images?.length > 0 && (
          <div 
            className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center gap-1 pointer-events-none"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Click for full view</span>
          </div>
        )}

        {advert.images?.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-2 rounded-full shadow hover:bg-amber-400 transition-colors"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-2 rounded-full shadow hover:bg-amber-400 transition-colors"
            >
              <FaChevronRight />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {advert.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? 'w-6 bg-teal-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Wishlist Button */}
        <button
          onClick={() => toggleWishlist(advert._id)}
          className={`absolute top-2 right-2 text-white p-2 rounded-full z-10 ${
            isInWishlist(advert._id)
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-slate-300 hover:bg-slate-400'
          }`}
          aria-label={isInWishlist(advert._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <FaHeart
            className={`text-sm sm:text-base md:text-lg ${
              isInWishlist(advert._id) ? 'text-white' : 'text-slate-700'
            }`}
          />
        </button>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && advert.images?.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={getOptimizedImageUrl(advert.images[currentImageIndex], 'fullscreen')}
            alt={advert.title || 'Advert Image'}
            className="object-contain w-full h-full max-w-full max-h-full"
            onError={(e) => {
              console.error('Fullscreen image failed to load:', e.target.src);
              handleCloseFullscreen();
            }}
          />

          {/* Close Button */}
          <button
            onClick={handleCloseFullscreen}
            className="absolute top-4 right-4 bg-amber-300 text-teal-700 p-2 rounded-full shadow hover:bg-amber-400 transition"
          >
            <FaTimes size={24} />
          </button>

          {/* Navigation Arrows (only if multiple images) */}
          {advert.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-3 rounded-full shadow hover:bg-amber-400 transition"
              >
                <FaChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-3 rounded-full shadow hover:bg-amber-400 transition"
              >
                <FaChevronRight size={20} />
              </button>

              {/* Dot Indicators (Fullscreen) */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {advert.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'w-8 bg-teal-500'
                        : 'w-2.5 bg-slate-400 hover:bg-slate-300'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content wrapper */}
      <div>
        {/* Title Section */}
        {advert.title && (
          <div className="my-2 px-2"> 
            <h1 className="text-base sm:text-lg text-center font-bold my-1 px-2 text-slate-900 break-words">{advert.title}</h1>
          </div>
        )}
    
      {/* Main Details Section */}
      <div className="my-4 p-3">
        <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Posted By — show "Desify Team" for curated listings */}
            {advert.postedBy?.name && (
              <div className="text-sm sm:text-base">
                <span className="text-slate-500">Posted By:</span>{' '}
                <span className="font-semibold text-slate-700">
                  {chatProps?.isCurated ? 'Desify Team' : advert.postedBy.name}
                </span>
              </div>
            )}

            {/* Posted Date */}
            <div className="text-sm sm:text-base">
              <span className="text-slate-500">Posted:</span>{' '}
              <span className="font-semibold text-slate-700">{postedText}</span>
            </div>

            {/* Ad Type */}
            {advert.adType && (
              <div className="text-sm sm:text-base">
                <span className="text-slate-500">Ad Type:</span>{' '}
                <span className="font-semibold text-slate-700">{advert.adType === 'wanted' ? 'Wanted' : 'Offered'}</span>
              </div>
            )}

            {/* Category > Subcategory */}
            {(advert.category || advert.subcategory) && (
              <div className="text-sm sm:text-base">
                <span className="text-slate-500">Category:</span>{' '}
                <span className="font-semibold text-slate-700">
                  {advert.category && advert.subcategory
                    ? `${advert.category} > ${advert.subcategory}`
                    : advert.subcategory || advert.category}
                </span>
              </div>
            )}

            {/* Community/Language - Only for eligible subcategories */}
            {needsCommunityField(advert.subcategory) && advert.communities && advert.communities.length > 0 && (
              <div className="text-sm sm:text-base">
                <span className="text-slate-500">Community:</span>{' '}
                <span className="font-semibold text-slate-700">
                  {advert.communities.map(c => {
                    const community = COMMUNITIES.find(comm => comm.value === c);
                    return community ? community.label : c;
                  }).join(', ')}
                </span>
              </div>
            )}

            {/* Travel Requests: route (From -> To) */}
            {isTravelRequest(advert) && getTravelPlaceText(advert.fields, 'from') && (
              <div className="text-sm sm:text-base col-span-1 sm:col-span-2">
                <span className="text-slate-500">Route:</span>{' '}
                <span className="font-semibold text-slate-700">
                  {getTravelPlaceText(advert.fields, 'from')} to {getTravelPlaceText(advert.fields, 'to')}
                </span>
              </div>
            )}

            {/* Travel Requests: budget line for both wanted and offered ads */}
            {isTravelRequest(advert) && getBudgetText(advert) && (
              <div className="text-sm sm:text-base">
                <span className="text-slate-500">Budget:</span>{' '}
                <span className="font-semibold text-slate-700">{getBudgetText(advert)}</span>
              </div>
            )}

            {/* Price Information - Only show for offered ads */}
            {!isTravelRequest(advert) && advert.adType !== 'wanted' && (
              !PRICING_CONFIG[advert.subcategory] ? (
                <div className="text-sm sm:text-base">
                  <span className="text-slate-500">Price:</span>{' '}
                  <span className="font-semibold text-slate-700">Request quote</span>
                </div>
              ) : (
                priceLabels && priceLabels.map((price, index) => (
                  <div key={index} className="text-sm sm:text-base">
                    <span className="text-slate-500">{price.label}:</span>{' '}
                    <span className="font-semibold text-slate-700">{price.value}</span>
                  </div>
                ))
              )
            )}

            {/* Condition */}
            {advert.condition && advert.condition !== 'null' && (
              <div className="text-sm sm:text-base">
                <span className="text-slate-500">Condition:</span>{' '}
                <span className="font-semibold text-slate-700">{advert.condition}</span>
              </div>
            )}

            {/* Location - Full width at the bottom */}
            {advert.address && (advert.address.formattedAddress || advert.address.suburb || advert.address.state) && (
              <div className="text-sm sm:text-base col-span-1 sm:col-span-2">
                <FaMapMarkedAlt className="text-slate-500 shrink-0 inline mr-1.5" size={13} aria-hidden="true" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(advert.address.formattedAddress || [advert.address.suburb, advert.address.state].filter(Boolean).join(', '))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-700 hover:text-slate-900 underline"
                >
                  {advert.address.formattedAddress || [advert.address.suburb, advert.address.state].filter(Boolean).join(', ')}
                </a>
              </div>
            )}
          </div>
      </div>

      {/* Dynamic Fields Section */}
      {advert.fields && Object.entries(advert.fields).filter(([key, value]) => key !== 'serviceArea' && !(isTravelRequest(advert) && TRAVEL_BUDGET_FIELD_IDS.includes(key)) && value !== '' && value != null).length > 0 && (
        <div className="my-4 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Additional Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(advert.fields).filter(([key, value]) => key !== 'serviceArea' && !(isTravelRequest(advert) && TRAVEL_BUDGET_FIELD_IDS.includes(key)) && value !== '' && value != null).map(([key, value]) => (
              <div key={key} className="text-sm sm:text-base">
                <span className="text-slate-500">{getTravelFieldLabel(advert, key, formatFieldName(key))}:</span>{' '}
                <span className="font-semibold text-slate-700">{key === 'travelDate' ? formatTravelDate(value) : value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isTravelRequest(advert) && (
        <div className="my-4 mx-3 p-3 rounded-lg border border-amber-300 bg-amber-50 text-sm text-amber-900">
          <span className="font-semibold">Stay safe.</span> {TRAVEL_SAFETY_NOTE}
        </div>
      )}

      {/* Service Areas Section */}
      {advert.fields?.serviceArea && (
        <div className="my-4 p-3 relative">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Service Areas</h3>
          <div className="relative">
            <div
              ref={serviceAreaRef}
              className={`text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap ${serviceAreaExpanded ? '' : 'line-clamp-[6]'}`}
            >
              {advert.fields.serviceArea}
            </div>
            {!serviceAreaExpanded && serviceAreaOverflow && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            )}
          </div>
          {(serviceAreaOverflow || serviceAreaExpanded) && (
            <button
              type="button"
              onClick={() => setServiceAreaExpanded((e) => !e)}
              className="mt-2 text-teal-700 hover:text-teal-800 font-semibold text-sm underline"
            >
              {serviceAreaExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Description Section */}
      {advert.description && (
        <div className="my-4 p-3 relative">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Description</h3>
          <div className="relative">
            <div
              ref={descriptionRef}
              className={`text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap ${descriptionExpanded ? '' : 'line-clamp-[20]'}`}
            >
              {advert.description}
            </div>
            {!descriptionExpanded && descriptionOverflow && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            )}
          </div>
          {(descriptionOverflow || descriptionExpanded) && (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((e) => !e)}
              className="mt-2 text-teal-700 hover:text-teal-800 font-semibold text-sm underline"
            >
              {descriptionExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Contact Info Section */}
      {advert.contactInfo && (advert.contactInfo.mobile || advert.contactInfo.email || advert.contactInfo.website || (advert.contactInfo.socialMedia && advert.contactInfo.socialMedia.some((s) => s.url))) && (
        <div className="my-4 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Contact Information</h3>
          <div className="space-y-3">
            {/* Mobile */}
            {advert.contactInfo.mobile && (
              <div className="flex items-center gap-3 text-sm sm:text-base">
                <FaMobileAlt className="text-slate-500 flex-shrink-0" />
                {user ? (
                  <a href={`tel:${advert.contactInfo.mobile}`} className="text-slate-700 hover:text-slate-900 underline flex items-center gap-1">
                    {advert.contactInfo.mobile}
                    <FaExternalLinkAlt className="text-xs text-slate-400" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700">{maskMobile(advert.contactInfo.mobile)}</span>
                    <button
                      onClick={handleLoginToReveal}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      <FaLock className="text-xs" />
                      Login to reveal
                      <FaExternalLinkAlt className="text-xs" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Email */}
            {advert.contactInfo.email && (
              <div className="flex items-center gap-3 text-sm sm:text-base">
                <FaEnvelope className="text-slate-500 flex-shrink-0" />
                {user ? (
                  <a href={`mailto:${advert.contactInfo.email}`} className="text-slate-700 hover:text-slate-900 underline flex items-center gap-1">
                    {advert.contactInfo.email}
                    <FaExternalLinkAlt className="text-xs text-slate-400" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700">{maskEmail(advert.contactInfo.email)}</span>
                    <button
                      onClick={handleLoginToReveal}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      <FaLock className="text-xs" />
                      Login to reveal
                      <FaExternalLinkAlt className="text-xs" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Website - always visible */}
            {advert.contactInfo.website && (
              <div className="flex items-center gap-3 text-sm sm:text-base">
                <FaGlobe className="text-slate-500 flex-shrink-0" />
                <a
                  href={advert.contactInfo.website.startsWith('http') ? advert.contactInfo.website : `https://${advert.contactInfo.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-700 hover:text-slate-900 underline truncate flex items-center gap-1"
                >
                  {advert.contactInfo.website}
                  <FaExternalLinkAlt className="text-xs text-slate-400 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Social Media - always visible */}
            {advert.contactInfo.socialMedia && advert.contactInfo.socialMedia.some((s) => s.url) && (
              <div className="flex items-center gap-2 text-sm sm:text-base flex-wrap">
                <FaThumbsUp className="text-slate-500 shrink-0" size={13} aria-hidden="true" />
                {advert.contactInfo.socialMedia.filter((s) => s.url).map((social, index, arr) => {
                  const Icon = getSocialIcon(social.platform);
                  return (
                    <a
                      key={index}
                      href={social.url.startsWith('http') ? social.url : `https://${social.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-slate-700 hover:text-slate-900"
                    >
                      <Icon className="text-base" />
                      <span>{social.platform}</span>
                      {index < arr.length - 1 && <span className="text-slate-400 ml-1">|</span>}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Container - Mobile Only (After Additional Details) */}
      {chatProps && (
        <div ref={mobileContactRef} className="block lg:hidden px-2 my-4">
          <SendMessage {...chatProps} />
        </div>
      )}
      </div> {/* End of content wrapper */}

      {/* Floating Buttons - Mobile Only. Fade out once the inline chat is in view. */}
      <div
        className={`lg:hidden fixed bottom-20 right-4 z-40 flex flex-col gap-3 transition-all duration-200 ${
          chatInView ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100'
        }`}
        aria-hidden={chatInView}
      >
          {/* Share Button */}
          <button
            onClick={async () => {
              if (navigator.share) {
                try {
                  const shareUrl = `${window.location.origin}${buildSlugUrl('listing', advert.title, advert._id)}`;
                  const shareText = `${advert.title}\n\nView on Desify\n`;

                  await navigator.share({
                    title: advert.title,
                    text: shareText,
                    url: shareUrl
                  });
                } catch (err) {
                  if (err.name !== 'AbortError') console.error('Share failed:', err);
                }
              }
            }}
            className="bg-teal-700/80 backdrop-blur-sm text-white hover:bg-teal-700 flex items-center gap-2 px-4 py-3 rounded-full shadow font-semibold text-sm transition-colors"
            aria-label="Share listing"
          >
            <FaShareAlt size={16} />
            <span>Share</span>
          </button>

          {/* Chat Button - hidden on curated listings (no chat box to jump to) */}
          {chatProps && !chatProps.isCurated && (
            <button
              onClick={handleContactClick}
              className="bg-teal-700/80 backdrop-blur-sm text-white hover:bg-teal-700 flex items-center gap-2 px-4 py-3 rounded-full shadow font-semibold text-sm transition-colors"
              aria-label="Chat with seller"
            >
              <FaCommentDots size={16} />
              <span>Chat</span>
            </button>
          )}
        </div>
    </div>
  );
};

export default SingleAdvertCard;