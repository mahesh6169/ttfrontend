'use client';
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from '@/utils/axiosConfig';


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
  const [impressedAds, setImpressedAds] = useState(new Set()); // Track which ads have been impressed

  // Fetch ads from API
  const fetchAds = useCallback(async () => {
    try {
      const response = await axios.get('/bannerAds/serve/TOP-P1');
      console.log('TopAd API Response:', response.data);
      
      if (response.data.success) {
        setAds(response.data.ads || []);
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
  const handleAdClick = async (ad, currentImage) => {
    try {
      console.log('Ad click:', ad, 'Image:', currentImage);
      
      // Always track click via GET endpoint (it handles all cases)
      const clickUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/bannerAds/click/${ad.adId}`;
      
      // Get destination from current image
      if (currentImage.destinationUrl) {
        // Has destination - let the backend redirect after tracking
        if (currentImage.destinationType === 'external') {
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

  // If loading or no ads, return nothing - let the space be used by webapp
  if (loading || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentAdIndex];
  const currentImage = currentAd?.images?.[currentImageIndex] || currentAd?.images?.[0];

  // If no current image, return nothing
  if (!currentImage) {
    return null;
  }

  // Show the current ad with its current image
  return (
    <div 
      className="mx-auto overflow-hidden cursor-pointer w-[320px] h-[50px] md:w-[728px] md:h-[90px]"
      onClick={() => handleAdClick(currentAd, currentImage)}
    >
      <Image
        src={currentImage.imageUrl}
        alt={currentImage.altText || `${currentAd.businessName} Advertisement`}
        width={728}
        height={90}
        className="w-full h-full object-cover"
        priority
        sizes="(max-width: 640px) 320px, 728px"
      />
    </div>
  );
};

export default TopAd;