'use client';
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from '@/utils/axiosConfig';

// Fallback images if no ads are available
const fallbackDesktop = "https://res.cloudinary.com/dtvrbdvkx/image/upload/v1753957091/mockad-1_r1nh3w.png";
const fallbackMobile = "https://res.cloudinary.com/dtvrbdvkx/image/upload/v1753957996/mockad-m-1_anq9id.png";

// CSS classes for ad dimensions
const adClasses = {
  full: {
    container: "w-[320px] h-[50px] md:w-[728px] md:h-[90px]",
    image: "w-full h-full object-cover"
  },
  split: {
    // Container classes depend on stacking behavior
    containerHorizontal: "w-[320px] h-[50px] md:w-[728px] md:h-[90px]",
    containerVertical: "w-[160px] h-[100px] md:w-[728px] md:h-[90px]",
    // Child ad classes
    childHorizontal: "w-[160px] h-[50px] md:w-[364px] md:h-[90px]",
    childVertical: "w-[160px] h-[50px] md:w-[364px] md:h-[90px]",
    image: "w-full h-full object-cover"
  }
};

const TopAd = () => {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [layoutType, setLayoutType] = useState('full');
  const [mobileStackVertical, setMobileStackVertical] = useState(true);
  const [impressedAds, setImpressedAds] = useState(new Set()); // Track which ads have been impressed

  // Fetch ads from API
  const fetchAds = useCallback(async () => {
    try {
      const response = await axios.get('/bannerAds/serve/H1');
      console.log('TopAd API Response:', response.data);
      
      if (response.data.success) {
        setAds(response.data.ads || []);
        setLayoutType(response.data.layoutType);
        setMobileStackVertical(response.data.mobileStackVertical !== undefined ? response.data.mobileStackVertical : true);
        console.log('Layout type:', response.data.layoutType);
        console.log('Mobile stack vertical:', response.data.mobileStackVertical);
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

  // Track click - counts every click regardless of which carousel image
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

  // No need for weighted selection - backend sends the right ad

  // Track impression when ad is displayed for the first time
  useEffect(() => {
    if (ads.length > 0 && currentAdIndex < ads.length) {
      const currentAd = ads[currentAdIndex];
      if (currentAd && !impressedAds.has(currentAd.adId)) {
        trackImpression(currentAd.adId);
        setImpressedAds(prev => new Set(prev).add(currentAd.adId));
      }
    }
  }, [currentAdIndex, ads, impressedAds]);

  // Preload the first ad images once we have them
  useEffect(() => {
    if (ads.length > 0 && ads[0].images && ads[0].images.length > 0) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = ads[0].images[0].imageUrl;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [ads]);


  // Auto-rotate only within current ad's images
  useEffect(() => {
    if (ads.length === 0) return;
    
    const currentAd = ads[currentAdIndex];
    
    // Only set timer if current ad has multiple images
    if (currentAd?.images && currentAd.images.length > 1) {
      const timer = setTimeout(() => {
        // Rotate to next image in current ad
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % currentAd.images.length);
      }, 5000); // Rotate every 5 seconds
      
      return () => clearTimeout(timer);
    }
    // No rotation for single image ads - they stay static
  }, [currentAdIndex, currentImageIndex, ads]);

  // Reserve space while loading to prevent layout shift
  if (loading) {
    return (
      <div className="w-full h-[50px] md:h-[90px]">
        {/* Empty space reserved for ad */}
      </div>
    );
  }

  // Generate CSS classes based on dimensions from backend
  const getAdClasses = () => {
    if (layoutType === 'full') {
      // Always use predefined Tailwind classes for full layout
      return adClasses.full;
    }
    
    if (layoutType === 'split') {
      return {
        container: mobileStackVertical ? adClasses.split.containerVertical : adClasses.split.containerHorizontal,
        flexDirection: mobileStackVertical ? 'flex-col md:flex-row' : 'flex-row',
        child: mobileStackVertical ? adClasses.split.childVertical : adClasses.split.childHorizontal,
        image: adClasses.split.image
      };
    }
    
    return adClasses.full; // Default fallback
  };

  const classes = getAdClasses();
  
  console.log('TopAd render:', { 
    layoutType,
    adsCount: ads.length,
    classes
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
        <div className={`mx-auto rounded-md border border-gray-300 flex items-center justify-center ${classes.container}`}>
          <span className="text-gray-500">Advertisement</span>
        </div>
      );
    }
    
    // Split layout - two placeholders
    if (layoutType === 'split') {
      return (
        <div className={`mx-auto flex ${classes.flexDirection} ${classes.container}`}>
          {[0, 1].map((slotIndex) => {
            return (
              <div
                key={`empty-${slotIndex}`}
                className={`rounded-md border border-gray-300 flex items-center justify-center ${classes.child}`}
              >
                <span className="text-gray-500">Advertisement</span>
              </div>
            );
          })}
        </div>
      );
    }
  }

  const currentAd = ads[currentAdIndex];
  const currentImage = currentAd?.images?.[currentImageIndex] || currentAd?.images?.[0];

  // Full layout - single ad
  if (layoutType === 'full' && currentImage) {
    return (
      <div 
        className={`mx-auto overflow-hidden cursor-pointer ${classes.container}`}
        onClick={() => handleAdClick(currentAd)}
      >
        <Image
          src={currentImage.imageUrl}
          alt={currentImage.altText || `${currentAd.businessName} Advertisement`}
          width={728}
          height={90}
          className={classes.image}
          priority
          sizes="(max-width: 640px) 320px, 728px"
        />
      </div>
    );
  }

  // Split layout - show two ads side by side on desktop, stacked on mobile
  return (
    <div className={`mx-auto flex ${classes.flexDirection} ${classes.container}`}>
      {/* Always render two slots for split layout */}
      {[0, 1].map((slotIndex) => {
        const ad = ads[slotIndex];
        
        if (ad && ad.images && ad.images.length > 0) {
          // For split layout, just show first image of each ad
          const image = ad.images[0];
          return (
            <div
              key={ad.adId}
              className={`overflow-hidden cursor-pointer ${classes.child}`}
              onClick={() => handleAdClick(ad)}
            >
              <Image
                src={image.imageUrl}
                alt={image.altText || `${ad.businessName} Advertisement`}
                width={364}
                height={90}
                className={classes.image}
                priority={slotIndex === 0}
                sizes="(max-width: 640px) 160px, 364px"
              />
            </div>
          );
        } else {
          // Render empty placeholder to maintain layout
          return (
            <div
              key={`empty-${slotIndex}`}
              className={`rounded-md border border-gray-300 flex items-center justify-center ${classes.child}`}
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