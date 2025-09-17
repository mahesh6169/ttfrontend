'use client';
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from '@/utils/axiosConfig';

// Fallback images if no ads are available
const fallbackDesktop = "https://res.cloudinary.com/dtvrbdvkx/image/upload/v1753957091/mockad-1_r1nh3w.png";
const fallbackMobile = "https://res.cloudinary.com/dtvrbdvkx/image/upload/v1753957996/mockad-m-1_anq9id.png";

const TopAd = () => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [layoutType, setLayoutType] = useState('full');
  const [dimensions, setDimensions] = useState(null);
  const [childDimensions, setChildDimensions] = useState(null);
  const [mobileStackVertical, setMobileStackVertical] = useState(true);

  // Fetch ads from API
  const fetchAds = useCallback(async () => {
    try {
      const response = await axios.get('/bannerAds/serve/H1');
      console.log('TopAd API Response:', response.data);
      
      if (response.data.success) {
        setAds(response.data.ads || []);
        setLayoutType(response.data.layoutType);
        setDimensions(response.data.dimensions);
        setChildDimensions(response.data.childDimensions);
        setMobileStackVertical(response.data.mobileStackVertical !== undefined ? response.data.mobileStackVertical : true);
        console.log('Using dimensions:', response.data.dimensions || 'No dimensions, using fallback');
        console.log('Child dimensions:', response.data.childDimensions);
        console.log('Mobile stack vertical:', response.data.mobileStackVertical);
        
        // Track impressions for the first ad
        if (response.data.ads && response.data.ads[0]) {
          trackImpression(response.data.ads[0].adId);
        }
      }
    } catch (error) {
      console.error('Error fetching banner ads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Track impression
  const trackImpression = async (adId) => {
    try {
      await axios.post(`/bannerAds/impression/${adId}`);
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  // Track click
  const handleAdClick = async (ad) => {
    try {
      console.log('Ad click:', ad);
      
      // Always track click via GET endpoint (it handles all cases)
      const clickUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/bannerAds/click/${ad.adId}`;
      
      if (ad.destinationUrl) {
        // Has destination - let the backend redirect after tracking
        if (ad.destinationType === 'external') {
          // External link - open in new tab
          window.open(clickUrl, '_blank');
        } else {
          // Internal link - navigate in same tab
          window.location.href = clickUrl;
        }
      } else {
        // No destination - use fetch to track click without navigation
        await fetch(clickUrl, { 
          method: 'GET',
          credentials: 'include' // Include cookies for state tracking
        });
        console.log('Click tracked for ad without destination');
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Preload the first ad image once we have it
  useEffect(() => {
    if (ads.length > 0 && ads[0].imageUrl) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = ads[0].imageUrl;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [ads]);

  // Auto-rotate ads if multiple
  useEffect(() => {
    if (ads.length > 1) {
      const timer = setTimeout(() => {
        const nextIndex = (currentIndex + 1) % ads.length;
        setCurrentIndex(nextIndex);
        
        // Track impression for the new ad
        if (ads[nextIndex]) {
          trackImpression(ads[nextIndex].adId);
        }
      }, 5000); // Rotate every 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, ads]);

  // Reserve space while loading to prevent layout shift
  if (loading) {
    // Use actual expected dimensions to prevent layout shift
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const loadingHeight = isMobile ? '50px' : '90px';
    return (
      <div className="w-full" style={{ height: loadingHeight }}>
        {/* Empty space reserved for ad */}
      </div>
    );
  }

  // Define responsive fallback dimensions
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const fallbackWidth = isMobile ? 320 : 728;
  const fallbackHeight = isMobile ? 50 : 90;
  
  // For split layouts, calculate total container size from children
  let adWidth, adHeight;
  if (layoutType === 'split' && childDimensions) {
    const childDim = isMobile ? childDimensions.mobile : childDimensions.desktop;
    if (childDim?.width && childDim?.height) {
      // Desktop: always side-by-side
      // Mobile: depends on mobileStackVertical setting
      if (isMobile && mobileStackVertical) {
        adWidth = childDim.width;
        adHeight = childDim.height * 2; // Stack vertically
      } else {
        adWidth = childDim.width * 2; // Side by side
        adHeight = childDim.height;
      }
    } else {
      adWidth = fallbackWidth;
      adHeight = fallbackHeight;
    }
  } else {
    // For full layouts, use dimensions or fallback
    adWidth = dimensions?.width || fallbackWidth;
    adHeight = dimensions?.height || fallbackHeight;
  }
  
  console.log('TopAd dimensions:', { 
    isMobile, 
    dimensions, 
    adWidth, 
    adHeight,
    device: isMobile ? 'mobile' : 'desktop'
  });

  // If no ads and no layout type, return null
  if (ads.length === 0 && !layoutType) {
    return null;
  }
  
  // If no ads but layout type is known, handle placeholders below
  if (ads.length === 0 && layoutType) {
    // Full layout - single placeholder
    if (layoutType === 'full') {
      return (
        <div className="mx-auto rounded-md border border-gray-300 flex items-center justify-center" style={{ width: `${adWidth}px`, height: `${adHeight}px` }}>
          <span className="text-gray-500">Advertisement</span>
        </div>
      );
    }
    
    // Split layout - two placeholders
    if (layoutType === 'split') {
      return (
        <div 
          className={`mx-auto flex ${isMobile && mobileStackVertical ? 'flex-col' : 'flex-row'}`} 
          style={{ width: `${adWidth}px`, height: `${adHeight}px` }}
        >
          {[0, 1].map((slotIndex) => {
            // Use child dimensions if available, otherwise fallback
            const childWidth = isMobile 
              ? (childDimensions?.mobile?.width || adWidth)
              : (childDimensions?.desktop?.width || 360);
            const childHeight = isMobile 
              ? (childDimensions?.mobile?.height || 50)
              : (childDimensions?.desktop?.height || adHeight);
            
            return (
              <div
                key={`empty-${slotIndex}`}
                className="rounded-md border border-gray-300 flex items-center justify-center"
                style={{ 
                  width: `${childWidth}px`,
                  height: `${childHeight}px`
                }}
              >
                <span className="text-gray-500">Advertisement</span>
              </div>
            );
          })}
        </div>
      );
    }
  }

  const currentAd = ads[currentIndex] || ads[0];

  // Full layout - single ad
  if (layoutType === 'full') {
    return (
      <div 
        className="mx-auto overflow-hidden cursor-pointer"
        style={{ width: `${adWidth}px`, height: `${adHeight}px` }}
        onClick={() => handleAdClick(currentAd)}
      >
        <Image
          src={currentAd.imageUrl}
          alt={currentAd.altText || `${currentAd.businessName} Advertisement`}
          width={adWidth}
          height={adHeight}
          className="w-full h-full object-fill"
          priority
        />
      </div>
    );
  }

  // Split layout - show two ads side by side on desktop, stacked on mobile
  return (
    <div 
      className={`mx-auto flex ${isMobile && mobileStackVertical ? 'flex-col' : 'flex-row'}`} 
      style={{ 
        width: `${adWidth}px`, 
        height: `${adHeight}px` 
      }}
    >
      {/* Always render two slots for split layout */}
      {[0, 1].map((slotIndex) => {
        const ad = ads[slotIndex];
        // Use child dimensions if available, otherwise fallback
        const childWidth = isMobile 
          ? (childDimensions?.mobile?.width || adWidth)
          : (childDimensions?.desktop?.width || 360);
        const childHeight = isMobile 
          ? (childDimensions?.mobile?.height || 50)
          : (childDimensions?.desktop?.height || adHeight);
        
        if (ad) {
          // Render ad if available
          return (
            <div
              key={ad.adId}
              className="overflow-hidden cursor-pointer"
              style={{ 
                width: `${childWidth}px`,
                height: `${childHeight}px`
              }}
              onClick={() => handleAdClick(ad)}
            >
              <Image
                src={ad.imageUrl}
                alt={ad.altText || `${ad.businessName} Advertisement`}
                width={childWidth}
                height={childHeight}
                className="w-full h-full object-fill"
                priority={slotIndex === 0}
              />
            </div>
          );
        } else {
          // Render empty placeholder to maintain layout
          return (
            <div
              key={`empty-${slotIndex}`}
              className="rounded-md border border-gray-300 flex items-center justify-center"
              style={{ 
                width: `${childWidth}px`,
                height: `${childHeight}px`
              }}
            >
              <span className="text-gray-500">Advertisement</span>
            </div>
          );
        }
      })}
    </div>
  );
};

export default TopAd;