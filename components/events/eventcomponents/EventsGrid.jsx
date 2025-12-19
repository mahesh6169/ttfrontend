'use client';

import React from 'react';
import EventCard from '@/components/events/eventcomponents/EventCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import SkeletonLoader from '../../SkeletonLoader'; 
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';
import BottomAd from '@/components/ads/BottomAd';
import { FaCalendarAlt } from 'react-icons/fa';

const EventGrid = ({ events, eventStatus }) => {
  const {
    eventWishlist,
    eventWishlistStatus,
    isInEventWishlist,
    toggleEventWishlist,
  } = useEventWishlist();

 // Loading State
 if (
  (eventStatus === 'idle' || eventStatus === 'loading' || eventWishlistStatus === 'loading') &&
  (!events || events.length === 0)
) {
  return (
    <div className="flex justify-center items-center min-h-[300px]">
      <SkeletonLoader />
    </div>
  );
}

// Failed State
if (eventStatus === 'failed') {
  return (
    <div className="flex items-center justify-center gap-2 text-gray-500 py-6">
      <FaCalendarAlt className="text-lg" />
      <span className="text-sm">Unable to load events. Please try again later.</span>
    </div>
  );
}

// No results state
if (eventStatus === 'success' && (!events || events.length === 0)) {
  return (
    <div className="flex items-center justify-center gap-2 text-gray-500 py-6">
      <FaCalendarAlt className="text-lg" />
      <span className="text-sm">No events displayed at the moment</span>
    </div>
  );
}

  // Calculate positions for ad insertion after 2 rows on each screen size
  // Mobile: 2 cols x 2 rows = 4 items
  // Tablet: 3 cols x 2 rows = 6 items  
  // Desktop: 4 cols x 2 rows = 8 items
  const mobileAdPosition = 4;
  const tabletAdPosition = 6;
  const desktopAdPosition = 8;

  // Create array with events and ad placement
  const itemsWithAd = [];
  let adInserted = false;

  events.forEach((event, index) => {
    itemsWithAd.push({ type: 'event', data: event });
    
    // Insert ad after 2 rows based on screen size
    if (!adInserted) {
      if (index === mobileAdPosition - 1 && events.length > mobileAdPosition) {
        itemsWithAd.push({ type: 'ad-mobile', data: null });
      }
      if (index === tabletAdPosition - 1 && events.length > tabletAdPosition) {
        itemsWithAd.push({ type: 'ad-tablet', data: null });
      }
      if (index === desktopAdPosition - 1 && events.length > desktopAdPosition) {
        itemsWithAd.push({ type: 'ad-desktop', data: null });
        adInserted = true;
      }
    }
  });

  return (
    <div id="EventGrid">
      <div id="EventGrids" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-4">
        {itemsWithAd.map((item, index) => {
          if (item.type === 'event') {
            return (
              <EventCard
                key={item.data._id}
                event={item.data}
                isInWishlist={isInEventWishlist(item.data._id)}
                onWishlistToggle={() => toggleEventWishlist(item.data._id)}
              />
            );
          } else if (item.type === 'ad-mobile') {
            return (
              <div key="ad-mobile" className="col-span-2 block md:hidden">
                <BottomAd />
              </div>
            );
          } else if (item.type === 'ad-tablet') {
            return (
              <div key="ad-tablet" className="col-span-3 hidden md:block lg:hidden">
                <BottomAd />
              </div>
            );
          } else if (item.type === 'ad-desktop') {
            return (
              <div key="ad-desktop" className="col-span-4 hidden lg:block">
                <BottomAd />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default EventGrid;
