'use client';
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import axios from '@/utils/axiosConfig';

const LeftAd = () => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [layoutType, setLayoutType] = useState('full');

  // Fetch ads from API
  const fetchAds = useCallback(async () => {
    try {
      const response = await axios.get('/bannerAds/serve/V1');
      if (response.data.success && response.data.ads.length > 0) {
        setAds(response.data.ads);
        setLayoutType(response.data.layoutType);
        
        // Track impressions for the first ad
        if (response.data.ads[0]) {
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
      }, 7000); // Rotate every 7 seconds (slower for vertical ads)
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, ads]);

  // Show fallback while loading
  if (loading) {
    return (
      <div className="hidden lg:flex w-[160px] h-[600px] animate-pulse bg-gray-200 rounded-md sticky top-16" />
    );
  }

  // Show fallback if no ads
  if (ads.length === 0) {
    return (
      <div className="hidden lg:flex w-[160px] h-[600px] items-center justify-center text-gray-600 bg-gray-200 shadow-md rounded-md sticky top-16">
        <span className="rotate-90 whitespace-nowrap">Advertisement Space</span>
      </div>
    );
  }

  const currentAd = ads[currentIndex] || ads[0];

  // Full layout - single ad
  if (layoutType === 'full') {
    return (
      <div 
        className="hidden lg:block w-[160px] h-[600px] rounded-md shadow-md overflow-hidden bg-white cursor-pointer transition-all duration-300 hover:shadow-lg sticky top-16"
        onClick={() => handleAdClick(currentAd)}
      >
        <Image
          src={currentAd.imageUrl}
          alt={currentAd.altText || `${currentAd.businessName} Advertisement`}
          width={160}
          height={600}
          className="w-full h-full object-cover"
          priority
        />
      </div>
    );
  }

  // Split layout - show two ads stacked vertically
  return (
    <div className="hidden lg:flex flex-col w-[160px] h-[600px] gap-2 sticky top-16">
      {ads.slice(0, 2).map((ad, index) => (
        <div
          key={ad.adId}
          className="flex-1 w-full rounded-md shadow-md overflow-hidden bg-white cursor-pointer transition-all duration-300 hover:shadow-lg"
          onClick={() => handleAdClick(ad)}
        >
          <Image
            src={ad.imageUrl}
            alt={ad.altText || `${ad.businessName} Advertisement`}
            width={160}
            height={295}
            className="w-full h-full object-cover"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
};

export default LeftAd;