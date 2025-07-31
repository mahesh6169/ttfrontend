'use client';
import { useEffect, useState } from "react";
import Image from "next/image";

// Desktop and Mobile images (add more if needed)
const desktopBanners = [
  "https://res.cloudinary.com/dtvrbdvkx/image/upload/v1753957091/mockad-1_r1nh3w.png",
  "https://res.cloudinary.com/dtvrbdvkx/image/upload/v1753958831/mockad-d-2_iy7puc.png",
];

const mobileBanners = [
  "https://res.cloudinary.com/dtvrbdvkx/image/upload/v1753957996/mockad-m-1_anq9id.png",
  "https://res.cloudinary.com/dtvrbdvkx/image/upload/v1753958831/mockad-m-2_tvlu43.png",
];

const TopAd = () => {
  const [index, setIndex] = useState(0);

  // Auto-slide logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % desktopBanners.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <>
      {/* Desktop/Tablet Carousel */}
      <div className="hidden sm:flex w-full h-[100px] items-center justify-center rounded-md shadow-md overflow-hidden bg-white transition-all duration-300">
        <Image
          src={desktopBanners[index]}
          alt={`Desktop Banner ${index + 1}`}
          width={2400}
          height={200}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {/* Mobile Carousel */}
      <div className="flex sm:hidden w-full h-[100px] items-center justify-center rounded-md shadow-md overflow-hidden bg-white transition-all duration-300">
        <Image
          src={mobileBanners[index]}
          alt={`Mobile Banner ${index + 1}`}
          width={800}
          height={250}
          className="w-full h-full object-cover"
          priority
        />
      </div>
    </>
  );
};

export default TopAd;
