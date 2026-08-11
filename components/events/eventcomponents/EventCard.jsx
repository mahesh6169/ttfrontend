'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MdLocationOn } from 'react-icons/md';
import { BsCalendar2Event } from 'react-icons/bs';
import { FaHeart } from 'react-icons/fa';
import { format, differenceInDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { MdRepeat } from 'react-icons/md';
import { FaMoneyBillWave, FaClipboardList, FaBullhorn, FaExternalLinkAlt } from 'react-icons/fa';
import { buildSlugUrl } from '@/utils/slugUtils';

// Odd-shape thresholds: wider than 2.2:1 or taller than ~1:1.5 → show whole (contain).
// Everything in between (normal photos / flyers) fills the box (cover).
const WIDE = 2.2;
const TALL = 0.65;

const EventCard = ({ event, isInWishlist, onWishlistToggle, ended = false }) => {
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_EVENT_IMAGE_URL;
  const {
    title,
    dateTime,
    venue,
    address,
    images,
    createdAt,
    timeZone,
    isPaid,
    isAdvertiseOnly,
    eventIntent,
    externalTicketUrl
  } = event;

  // Check if this is a promotional event
  const isPromotional = eventIntent === 'promote' || isAdvertiseOnly;

  const imageUrl = images?.[0]?.url || FALLBACK_IMAGE;

  // Per-image fit: default cover (the common case), switch to contain once an
  // odd-shaped image reports its real dimensions on load.
  const [fit, setFit] = useState('cover');
  const handleImageLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (!w || !h) return;
    const r = w / h;
    setFit(r > WIDE || r < TALL ? 'contain' : 'cover');
  };

  const getStateFromTimezone = (timezone) => {
  const timezoneMap = {
    'Australia/Sydney': 'NSW',
    'Australia/Melbourne': 'VIC', 
    'Australia/Brisbane': 'QLD',
    'Australia/Perth': 'WA',
    'Australia/Adelaide': 'SA',
    'Australia/Hobart': 'TAS',
    'Australia/Darwin': 'NT'
  };
  return timezoneMap[timezone] || timezone.split('/')[1];
};

  // 🕒 Format event date in event timezone (or fallback to Sydney)
  const formattedDate = formatInTimeZone(
    dateTime,
    timeZone || 'Australia/Sydney',
    'EEE dd MMM yyyy, h:mm a'
  );

  // 🗓️ Calculate how long ago the event was posted
  const postedDaysAgo = differenceInDays(new Date(), new Date(createdAt));
  const postedText =
    postedDaysAgo <= 15
      ? (
        postedDaysAgo === 0
          ? 'Today'
          : `${postedDaysAgo} day${postedDaysAgo > 1 ? 's' : ''} ago`
        )
      : format(new Date(createdAt), 'dd MMM yyyy');

  return (
    <div
      id="EventCard"
      className="relative bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Wishlist Button */}
      <button
        onClick={onWishlistToggle}
        className={`absolute top-2 right-2 text-white p-1.5 rounded-full z-10 ${
          isInWishlist
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-slate-300 hover:bg-slate-400'
        }`}
        title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <FaHeart
          className={`text-xs sm:text-sm ${
            isInWishlist ? 'text-white' : 'text-slate-700'
          }`}
        />
      </button>

      {/* Main Card */}
      <Link
        href={buildSlugUrl('event', event.title, event._id)}
        className="block"
        onClick={() => {
          // Save the current URL if we're coming from a listing detail page
          if (typeof window !== 'undefined' && window.location.pathname.includes('/listings/')) {
            localStorage.setItem('eventViewReturnUrl', window.location.pathname);
          }
        }}
      >
        {/* Image — per-image cover/contain.
            Odd shapes show whole on a soft blurred backdrop instead of being cropped. */}
        <div className="relative w-full h-40 sm:h-48 md:h-56 rounded-t-xl overflow-hidden bg-slate-100">
          {/* Past event marker (events-past-events.md): a dark "Ended" pill on the image. */}
          {ended && (
            <span className="absolute top-2 left-2 z-10 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              Ended
            </span>
          )}
          {fit === 'contain' && (
            <>
              <img
                src={imageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-70"
              />
              <div className="absolute inset-0 bg-white/20" />
            </>
          )}
          <img
            src={imageUrl}
            alt={title}
            onLoad={handleImageLoad}
            className={`relative w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
          />
        </div>

        {/* Title */}
        <div className="p-2 pt-1.5">
          <h2 className="text-sm font-semibold text-slate-900 line-clamp-2 min-h-[2.5rem]">
            {title}
          </h2>
        </div>

        {/* Date & Time + Location */}
        <div className="px-2 pb-1">
          {/* Date Row */}
          <div className="flex items-center text-slate-600 mb-0.5">
            <BsCalendar2Event className="text-xs mr-1 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-600">
              {timeZone ?
                formatInTimeZone(dateTime, timeZone, 'EEE dd MMM yyyy') :
                format(new Date(dateTime), 'EEE dd MMM yyyy')
              }
            </span>
            {(event.recurrence?.isRecurring || event.isRecurringInstance) && (
              <MdRepeat
                className="ml-1 text-slate-500 flex-shrink-0"
                title="Recurring Event"
                size={14}
              />
            )}
          </div>

          {/* Time Row */}
          <div className="flex items-center text-slate-600 mb-0.5">
            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-slate-600">
              {formatInTimeZone(dateTime, timeZone, 'h:mm a')}, {getStateFromTimezone(timeZone)}
            </span>
          </div>

          {/* Location Row */}
          <div className="flex items-center gap-1">
            <MdLocationOn className="text-xs text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-500 truncate">
              {address?.suburb || address?.state
                ? [address?.suburb, address?.state].filter(Boolean).join(', ')
                : venue}
            </span>
          </div>
        </div>
        {/* Event Type + Posted Date */}
        <div className="flex items-center justify-between px-2 pb-1.5">
          <div className="flex items-center gap-1">
            {isPromotional ? (
              <>
                <FaBullhorn
                  className="text-teal-600"
                  size={12}
                  title="Promotional Event"
                />
                <span className="text-[10px] text-teal-600 font-medium">
                  Promo
                </span>
                {externalTicketUrl && (
                  <FaExternalLinkAlt
                    className="text-teal-500 ml-1"
                    size={10}
                    title="External tickets"
                  />
                )}
              </>
            ) : isPaid ? (
              <>
                <FaMoneyBillWave
                  className="text-slate-600"
                  size={12}
                  title="Paid Event"
                />
                <span className="text-[10px] text-slate-600 font-medium">
                  Paid
                </span>
              </>
            ) : (
              <>
                <FaClipboardList
                  className="text-slate-600"
                  size={12}
                  title="RSVP"
                />
                <span className="text-[10px] text-slate-600 font-medium">
                  RSVP
                </span>
              </>
            )}
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {postedText}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default EventCard;
