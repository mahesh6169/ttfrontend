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

  // Fetch ads from API
  const fetchAds = useCallback(async () => {
    try {
      const response = await axios.get('/bannerAds/serve/H1');
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

  // Show fallback while loading - use actual fallback image instead of gray box
  if (loading) {
    return (
      <>
        <div className="hidden sm:flex w-full h-[100px] items-center justify-center rounded-md shadow-md overflow-hidden bg-white">
          <Image
            src={fallbackDesktop}
            alt="Loading advertisement..."
            width={1472}
            height={100}
            className="w-full h-full object-cover opacity-50"
            priority
          />
        </div>
        <div className="flex sm:hidden w-full h-[100px] items-center justify-center rounded-md shadow-md overflow-hidden bg-white">
          <Image
            src={fallbackMobile}
            alt="Loading advertisement..."
            width={374}
            height={100}
            className="w-full h-full object-cover opacity-50"
            priority
          />
        </div>
      </>
    );
  }

  // Show fallback if no ads
  if (ads.length === 0) {
    return (
      <>
        <div className="hidden sm:flex w-full h-[100px] items-center justify-center rounded-md shadow-md overflow-hidden bg-white">
          <Image
            src={fallbackDesktop}
            alt="Advertisement"
            width={1472}
            height={100}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <div className="flex sm:hidden w-full h-[100px] items-center justify-center rounded-md shadow-md overflow-hidden bg-white">
          <Image
            src={fallbackMobile}
            alt="Advertisement"
            width={374}
            height={100}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      </>
    );
  }

  const currentAd = ads[currentIndex] || ads[0];

  // Full layout - single ad
  if (layoutType === 'full') {
    return (
      <div 
        className="w-full h-[100px] rounded-md shadow-md overflow-hidden bg-white cursor-pointer transition-all duration-300 hover:shadow-lg"
        onClick={() => handleAdClick(currentAd)}
      >
        <Image
          src={currentAd.imageUrl}
          alt={currentAd.altText || `${currentAd.businessName} Advertisement`}
          width={1472}
          height={100}
          className="w-full h-full object-cover"
          priority
        />
      </div>
    );
  }

  // Split layout - show two ads side by side
  return (
    <div className="w-full h-[100px] flex gap-2">
      {ads.slice(0, 2).map((ad, index) => (
        <div
          key={ad.adId}
          className="flex-1 h-full rounded-md shadow-md overflow-hidden bg-white cursor-pointer transition-all duration-300 hover:shadow-lg"
          onClick={() => handleAdClick(ad)}
        >
          <Image
            src={ad.imageUrl}
            alt={ad.altText || `${ad.businessName} Advertisement`}
            width={736}
            height={100}
            className="w-full h-full object-cover"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
};

export default TopAd;