'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { MdLocationOn, MdPhone, MdEmail, MdLanguage, MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
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

const SingleDealCard = ({ deal, chatProps }) => {
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
      <div className="relative w-full mx-auto bg-gray-100 h-[200px] sm:h-[300px] md:h-[400px]">
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
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-yellow-400 transition-colors"
            >
              <MdChevronLeft size={24} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-yellow-400 transition-colors"
            >
              <MdChevronRight size={24} />
            </button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
            {currentImageIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <img
            src={displayImages[currentImageIndex]?.url || FALLBACK_IMAGE}
            alt={deal.dealTitle || 'Deal Image'}
            className="object-contain w-full h-full max-w-full max-h-full"
            onError={(e) => {
              e.target.src = FALLBACK_IMAGE;
            }}
          />

          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-yellow-400 transition-colors"
          >
            <MdClose size={30} />
          </button>

          {displayImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-yellow-400 transition-colors"
              >
                <MdChevronLeft size={30} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-yellow-400 transition-colors"
              >
                <MdChevronRight size={30} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Deal Info */}
      <div className="p-4">
        {/* Featured Badge */}
        {isFeatured && (
          <div className="text-center mb-3">
            <span className="inline-block bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded">
              Featured Deal
            </span>
          </div>
        )}

        {/* Title - Centered */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-4">
          {deal.dealTitle}
        </h1>

        {/* Valid Days & Date */}
        <div className="text-center text-gray-600 mb-6">
          {(!deal.validDays || deal.validDays.length === 0 || deal.validDays.length === 7)
            ? `Valid until ${format(new Date(deal.endDate), 'dd MMM')}`
            : `Valid ${formatValidDays(deal.validDays)} until ${format(new Date(deal.endDate), 'dd MMM')}`
          }
        </div>

        {/* Description */}
        {deal.description && (
          <div className="border border-gray-300 rounded shadow-sm my-4">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800">Description</h3>
            </div>
            <div className="p-3">
              <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap overflow-y-auto max-h-[200px] sm:max-h-[300px]">
                {deal.description}
              </div>
            </div>
          </div>
        )}

        {/* Deal Link */}
        {deal.dealLink && (
          <div className="text-center my-4">
            <a
              href={deal.dealLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <MdLanguage className="text-lg" />
              Link to the Deal
            </a>
          </div>
        )}

        {/* WhatsApp Order Button */}
        {deal.whatsappOrders && deal.whatsappNumber && (
          <div className="text-center my-4">
            <a
              href={`https://wa.me/61${deal.whatsappNumber.replace(/^0/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FaWhatsapp className="text-lg" />
              Order via WhatsApp
            </a>
          </div>
        )}

        {/* Terms */}
        {deal.terms && (
          <div className="border border-gray-300 rounded shadow-sm my-4">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800">Terms & Conditions</h3>
            </div>
            <div className="p-3 relative">
              <div className={`text-sm text-gray-700 whitespace-pre-wrap overflow-hidden ${termsExpanded ? '' : 'max-h-24'}`}>
                {deal.terms}
              </div>
              {!termsExpanded && deal.terms.length > 200 && (
                <div className="absolute bottom-8 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
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

      {/* Deal Posted By Section */}
      <div className="border border-gray-300 rounded shadow-sm my-4 mx-4">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800">Deal Posted By</h3>
        </div>
        <div className="p-3">
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
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                  {partner?.businessName?.charAt(0) || '?'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg text-gray-900">{partner?.businessName}</h4>
                <p className="text-sm text-teal-600 mb-2">{partner?.category}</p>
                {partner?.description && (
                  <div>
                    <p className={`text-sm text-gray-600 ${storeDescExpanded ? '' : 'line-clamp-2'}`}>
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
              <div className="flex items-center text-gray-600">
                <MdLocationOn className="mr-2 text-lg flex-shrink-0" />
                <span className="text-sm">Available Nationwide</span>
              </div>
            ) : partner?.address?.formattedAddress && (
              <div className="flex items-start text-gray-600">
                <MdLocationOn className="mr-2 text-lg mt-0.5 flex-shrink-0" />
                <span className="text-sm">{partner.address.formattedAddress}</span>
              </div>
            )}

            {/* Phone */}
            {partner?.contactInfo?.phone && (
              <div className="flex items-center text-gray-600">
                <MdPhone className="mr-2 text-lg flex-shrink-0" />
                <a href={`tel:${partner.contactInfo.phone}`} className="text-sm text-teal-600 hover:underline">
                  {partner.contactInfo.phone}
                </a>
              </div>
            )}

            {/* Email */}
            {partner?.contactInfo?.email && (
              <div className="flex items-center text-gray-600">
                <MdEmail className="mr-2 text-lg flex-shrink-0" />
                <a href={`mailto:${partner.contactInfo.email}`} className="text-sm text-teal-600 hover:underline">
                  {partner.contactInfo.email}
                </a>
              </div>
            )}

            {/* Website */}
            {partner?.contactInfo?.website && (
              <div className="flex items-center text-gray-600">
                <MdLanguage className="mr-2 text-lg flex-shrink-0" />
                <a
                  href={partner.contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal-600 hover:underline"
                >
                  {partner.contactInfo.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            {/* Social Media */}
            {partner?.contactInfo?.socialMedia?.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                {partner.contactInfo.socialMedia.map((social, index) => {
                  const Icon = SOCIAL_ICONS[social.platform];
                  if (!Icon || !social.url) return null;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-teal-600 transition-colors"
                      title={social.platform}
                    >
                      <Icon className="text-xl" />
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
      </div>

      {/* Chat Container - Mobile Only */}
      {chatProps && (
        <div className="block lg:hidden px-4 py-4 border-t">
          <SendMessage {...chatProps} />
        </div>
      )}
    </div>
  );
};

export default SingleDealCard;
