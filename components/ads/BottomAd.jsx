'use client';
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import axios from '@/utils/axiosConfig';

// No fallback images - show empty space or nothing

const BottomAd = () => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [layoutType, setLayoutType] = useState('full');
  const [dimensions, setDimensions] = useState(null);

  // Fetch ads from API
  const fetchAds = useCallback(async () => {
    try {
      const response = await axios.get('/bannerAds/serve/H2');
      console.log('BottomAd API Response:', response.data);
      
      if (response.data.success) {
        setAds(response.data.ads || []);
        setLayoutType(response.data.layoutType);
        setDimensions(response.data.dimensions);
        
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
      // For external links, use the click tracking endpoint
      if (ad.destinationType === 'external') {
        window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bannerAds/click/${ad.adId}`, '_blank');
      } else {
        // For internal links, use the click tracking endpoint which will redirect
        window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/bannerAds/click/${ad.adId}`;
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

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
    return (
      <div className="w-full h-[100px]">
        {/* Empty space reserved for ad */}
      </div>
    );
  }

  // Define responsive fallback dimensions
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const fallbackWidth = isMobile ? 320 : 728;
  const fallbackHeight = isMobile ? 50 : 90;
  const adWidth = dimensions?.width || fallbackWidth;
  const adHeight = dimensions?.height || fallbackHeight;

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
        <div className="mx-auto flex gap-2" style={{ width: `${adWidth}px`, height: `${adHeight}px` }}>
          {[0, 1].map((slotIndex) => (
            <div
              key={`empty-${slotIndex}`}
              className="flex-1 h-full rounded-md border border-gray-300 flex items-center justify-center"
            >
              <span className="text-gray-500">Advertisement</span>
            </div>
          ))}
        </div>
      );
    }
  }

  const currentAd = ads[currentIndex] || ads[0];

  // Full layout - single ad
  if (layoutType === 'full') {
    return (
      <div 
        className="w-full overflow-hidden cursor-pointer transition-all duration-300"
        style={{ height: `${adHeight}px` }}
        onClick={() => handleAdClick(currentAd)}
      >
        <Image
          src={currentAd.imageUrl}
          alt={currentAd.altText || `${currentAd.businessName} Advertisement`}
          width={adWidth}
          height={adHeight}
          className="mx-auto h-full object-contain"
          priority
        />
      </div>
    );
  }

  // Split layout - show two ads side by side
  return (
    <div className="mx-auto flex gap-2" style={{ width: `${adWidth}px`, height: `${adHeight}px` }}>
      {/* Always render two slots for split layout */}
      {[0, 1].map((slotIndex) => {
        const ad = ads[slotIndex];
        
        if (ad) {
          // Render ad if available
          return (
            <div
              key={ad.adId}
              className="flex-1 h-full overflow-hidden cursor-pointer transition-all duration-300"
              onClick={() => handleAdClick(ad)}
            >
              <Image
                src={ad.imageUrl}
                alt={ad.altText || `${ad.businessName} Advertisement`}
                width={layoutType === 'split' ? 360 : adWidth}
                height={adHeight}
                className="mx-auto h-full object-contain"
                priority={slotIndex === 0}
              />
            </div>
          );
        } else {
          // Render empty placeholder to maintain layout
          return (
            <div
              key={`empty-${slotIndex}`}
              className="flex-1 h-full rounded-md border border-gray-300 flex items-center justify-center"
            >
              <span className="text-gray-500">Advertisement</span>
            </div>
          );
        }
      })}
    </div>
  );
};

export default BottomAd;