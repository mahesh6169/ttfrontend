'use client';
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import axios from '@/utils/axiosConfig';

const LeftAd = () => {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [impressedAds, setImpressedAds] = useState(new Set());

  // Fetch ads from API
  const fetchAds = useCallback(async () => {
    try {
      const response = await axios.get('/bannerAds/serve/LEFT');
      console.log('LeftAd API Response:', response.data);
      
      if (response.data.success) {
        setAds(response.data.ads || []);
      }
    } catch (error) {
      console.error('Error fetching left banner ads:', error);
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
  const handleAdClick = async (ad, image) => {
    try {
      console.log('Ad click:', ad);
      
      // Always track click via GET endpoint
      const clickUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/bannerAds/click/${ad.adId}`;
      
      // Use the image's destination if available, otherwise fallback to ad's destination
      const destinationUrl = image.destinationUrl;
      const destinationType = image.destinationType;
      
      if (destinationUrl) {
        // Has destination - let the backend redirect after tracking
        if (destinationType === 'external') {
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
          credentials: 'include'
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

  // Preload the first ad images
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

  // Auto-rotate carousel images
  useEffect(() => {
    if (ads.length === 0) return;
    
    const currentAd = ads[currentAdIndex];
    
    // Only set timer if current ad has multiple images
    if (currentAd?.images && currentAd.images.length > 1) {
      const timer = setTimeout(() => {
        // Rotate to next image in current ad
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % currentAd.images.length);
      }, 2000); // Rotate every 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [currentAdIndex, currentImageIndex, ads]);

  // Desktop only - hide on mobile
  // If loading or no ads, return nothing
  if (loading || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentAdIndex];
  const currentImage = currentAd?.images?.[currentImageIndex] || currentAd?.images?.[0];

  // If no current image, return nothing
  if (!currentImage) {
    return null;
  }

  // Show vertical ad - 160x600 (desktop only)
  return (
    <div data-testid="left-ad" className="hidden lg:block sticky top-16 w-[160px] h-[600px] overflow-hidden cursor-pointer"
      onClick={() => handleAdClick(currentAd, currentImage)}
    >
      <Image
        src={currentImage.imageUrl}
        alt={currentImage.altText || `${currentAd.businessName} Advertisement`}
        width={160}
        height={600}
        className="w-full h-full object-cover"
        priority
      />
    </div>
  );
};

export default LeftAd;