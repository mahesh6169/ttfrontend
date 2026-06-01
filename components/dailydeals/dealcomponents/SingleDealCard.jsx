'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { MdLocationOn, MdPhone, MdEmail, MdLanguage, MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import { FaFacebook, FaInstagram, FaWhatsapp, FaExternalLinkAlt } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import Link from 'next/link';
import SendMessage from '@/components/chat/SendMessage';

const SOCIAL_ICONS = {
  Facebook: FaFacebook,
  Instagram: FaInstagram,
  X: FaXTwitter
};

const DAYS_FULL = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

const DAYS_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const SingleDealCard = ({ deal, chatProps, isCurated = false }) => {
  const partner = deal.partnerstoreId;
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_DEAL_IMAGE_URL;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const [storeDescExpanded, setStoreDescExpanded] = useState(false);

  const displayImages = deal.images?.length > 0 ? deal.images : [{ url: FALLBACK_IMAGE }];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  const formatValidDays = (validDays) => {
    if (!validDays || validDays.length === 0) return 'Everyday';
    if (validDays.length === 7) return 'Everyday';
    return validDays.map(d => DAYS_SHORT[d] || d).join(', ');
  };

  // Check if currently featured
  const now = new Date();
  const isFeatured = deal.featured?.isActive &&
    new Date(deal.featured.startDate) <= now &&
    new Date(deal.featured.endDate) >= now;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Image Section */}
      <div className="relative w-full mx-auto bg-slate-100 h-[200px] sm:h-[300px] md:h-[400px]">
        <img
          src={displayImages[currentImageIndex]?.url || FALLBACK_IMAGE}
          alt={deal.dealTitle || 'Deal Image'}
          className="object-contain w-full h-full cursor-pointer"
          onClick={() => setIsFullscreen(true)}
          onError={(e) => {
            e.target.src = FALLBACK_IMAGE;
          }}
        />

        {/* Fullscreen hint */}
        {deal.images?.length > 0 && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center gap-1 pointer-events-none">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Click for full view</span>
          </div>
        )}

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-2 rounded-full shadow hover:bg-amber-400 transition-colors"
            >
              <MdChevronLeft size={24} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-2 rounded-full shadow hover:bg-amber-400 transition-colors"
            >
              <MdChevronRight size={24} />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            {displayImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'bg-amber-400 w-4'
                    : 'bg-white/70 hover:bg-white'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsFullscreen(false);
            if (e.key === 'ArrowLeft') handlePrevImage();
            if (e.key === 'ArrowRight') handleNextImage();
          }}
          tabIndex={0}
          ref={(el) => el?.focus()}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            e.currentTarget.dataset.touchStartX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const touchStartX = parseFloat(e.currentTarget.dataset.touchStartX || '0');
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) handleNextImage();
              else handlePrevImage();
            }
          }}
        >
          <img
            src={displayImages[currentImageIndex]?.url || FALLBACK_IMAGE}
            alt={deal.dealTitle || 'Deal Image'}
            className="object-contain w-[95vw] h-[95vh] sm:w-[78vw] sm:h-[78vh] rounded shadow-2xl"
            onError={(e) => {
              e.target.src = FALLBACK_IMAGE;
            }}
          />

          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-amber-300 text-teal-700 p-2 rounded-full shadow hover:bg-amber-400 transition-colors"
          >
            <MdClose size={24} />
          </button>

          {displayImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-3 rounded-full shadow hover:bg-amber-400 transition-colors"
              >
                <MdChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-3 rounded-full shadow hover:bg-amber-400 transition-colors"
              >
                <MdChevronRight size={20} />
              </button>
              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-amber-400 w-6'
                        : 'bg-white/70 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Deal Info */}
      <div className="p-4">
        {/* Featured Badge */}
        {isFeatured && (
          <div className="text-center mb-3">
            <span className="inline-block bg-amber-400 text-amber-900 text-sm font-bold px-3 py-1 rounded">
              Featured Deal
            </span>
          </div>
        )}

        {/* Title - Centered */}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-4">
          {deal.dealTitle}
        </h1>

        {/* Validity Info */}
        <div className="text-center mb-6 space-y-1">
          <p className="text-red-500 font-medium text-sm">
            Valid until {format(new Date(deal.endDate), 'do MMM yyyy')}
          </p>
          {deal.validDays && deal.validDays.length > 0 && deal.validDays.length < 7 && (
            <p className="text-slate-500 text-xs">
              Available: {formatValidDays(deal.validDays)} only
            </p>
          )}
        </div>

        {/* Description */}
        {deal.description && (
          <div className="border border-slate-200 rounded shadow-sm my-4 p-3">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">Description</h3>
            <div className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap overflow-y-auto max-h-[200px] sm:max-h-[300px]">
              {deal.description}
            </div>
          </div>
        )}

        {/* Action Buttons - Deal Link & WhatsApp */}
        {(deal.dealLink || (deal.whatsappOrders && deal.whatsappNumber)) && (
          <div className="flex flex-wrap items-center gap-2 my-4 px-1">
            {deal.dealLink && (
              <a
                href={deal.dealLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-teal-600 text-teal-700 hover:bg-teal-50 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                <MdLanguage className="text-base" />
                View Deal
              </a>
            )}
            {deal.whatsappOrders && deal.whatsappNumber && (
              <a
                href={`https://wa.me/61${deal.whatsappNumber.replace(/^0/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-green-600 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                <FaWhatsapp className="text-base" />
                Order via WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Terms */}
        {deal.terms && (
          <div className="border border-slate-200 rounded shadow-sm my-4 p-3">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">Terms & Conditions</h3>
            <div className="relative">
              <div className={`text-sm text-slate-700 whitespace-pre-wrap overflow-hidden ${termsExpanded ? '' : 'max-h-24'}`}>
                {deal.terms}
              </div>
              {!termsExpanded && deal.terms.length > 200 && (
                <div className="absolute bottom-6 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              )}
              {deal.terms.length > 200 && (
                <button
                  onClick={() => setTermsExpanded(!termsExpanded)}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-2"
                >
                  {termsExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Offered By Section - Mobile Only */}
      <div className="lg:hidden border border-slate-200 rounded shadow-sm my-4 mx-4 p-3">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">
          Offered By
        </h3>
          {/* Two Column Layout on Desktop */}
          <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* Left Column - Logo, Name, Category, Description */}
          <div className="flex-1 mb-4 lg:mb-0">
            <div className="flex items-start gap-4">
              {/* Partner Logo */}
              {partner?.logo?.url ? (
                <img
                  src={partner.logo.url}
                  alt={partner.businessName}
                  className="w-16 h-16 object-contain rounded-lg bg-white p-2 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                  {partner?.businessName?.charAt(0) || '?'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg text-slate-900">{partner?.businessName}</h4>
                {partner?.description && (
                  <div>
                    <p className={`text-sm text-slate-600 ${storeDescExpanded ? '' : 'line-clamp-2'}`}>
                      {partner.description}
                    </p>
                    {partner.description.length > 100 && (
                      <button
                        onClick={() => setStoreDescExpanded(!storeDescExpanded)}
                        className="text-teal-600 hover:text-teal-700 text-xs font-medium mt-1"
                      >
                        {storeDescExpanded ? 'less' : 'more'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Contact Info */}
          <div className="flex-1 space-y-2">
            {/* Location */}
            {partner?.isNationwide ? (
              <div className="flex items-center text-slate-600">
                <MdLocationOn className="mr-2 text-lg flex-shrink-0" />
                <span className="text-sm">Available Nationwide</span>
              </div>
            ) : partner?.address?.formattedAddress && (
              <div className="flex items-start text-slate-600">
                <MdLocationOn className="mr-2 text-lg mt-0.5 flex-shrink-0" />
                <span className="text-sm">{partner.address.formattedAddress}</span>
              </div>
            )}

            {/* Phone */}
            {partner?.contactInfo?.phone && (
              <div className="flex items-center gap-3 text-sm">
                <MdPhone className="text-slate-500 flex-shrink-0" />
                <a href={`tel:${partner.contactInfo.phone}`} className="text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1">
                  {partner.contactInfo.phone}
                  <FaExternalLinkAlt className="text-xs text-slate-400" />
                </a>
              </div>
            )}

            {/* Email */}
            {partner?.contactInfo?.email && (
              <div className="flex items-center gap-3 text-sm">
                <MdEmail className="text-slate-500 flex-shrink-0" />
                <a href={`mailto:${partner.contactInfo.email}`} className="text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1">
                  {partner.contactInfo.email}
                  <FaExternalLinkAlt className="text-xs text-slate-400" />
                </a>
              </div>
            )}

            {/* Website */}
            {partner?.contactInfo?.website && (
              <div className="flex items-center gap-3 text-sm">
                <MdLanguage className="text-slate-500 flex-shrink-0" />
                <a
                  href={partner.contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1"
                >
                  {partner.contactInfo.website.replace(/^https?:\/\//, '')}
                  <FaExternalLinkAlt className="text-xs text-slate-400 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Social Media */}
            {partner?.contactInfo?.socialMedia?.length > 0 && (
              <div className="flex items-center gap-2 text-sm flex-wrap pt-1">
                <span className="text-slate-700">Follow us:</span>
                {partner.contactInfo.socialMedia.map((social, index) => {
                  const Icon = SOCIAL_ICONS[social.platform];
                  if (!Icon || !social.url) return null;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-teal-600 transition-colors"
                      title={social.platform}
                    >
                      <Icon className="text-lg" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* View All Deals from Partner */}
        <Link
          href={`/dailydeals?partnerstoreId=${partner?._id}`}
          className="inline-block mt-3 text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          View all deals from {partner?.businessName} &rarr;
        </Link>
      </div>

      {/* Chat Container - Mobile Only */}
      {chatProps && (
        <div id="mobile-chat" className="block lg:hidden px-4 py-4 border-t">
          <SendMessage {...chatProps} />
        </div>
      )}
    </div>
  );
};

export default SingleDealCard;
