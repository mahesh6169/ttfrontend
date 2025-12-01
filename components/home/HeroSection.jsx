'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { RiAdvertisementFill } from "react-icons/ri";
import { FaCalendarAlt } from 'react-icons/fa';
import { MdOutlineGroups2 } from "react-icons/md";

const HeroSection = () => {

  return (
    <section className="relative min-h-[60vh] md:min-h-[70vh] flex flex-col items-center justify-center text-white text-center px-4 overflow-hidden mt-2 md:mt-1">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={process.env.NEXT_PUBLIC_HOMEPAGE_HERO_VIDEO_POSTER_URL}
        className="absolute inset-0 w-full h-full object-cover z-0 blur-[2px] md:blur-sm"
      >
        <source src={process.env.NEXT_PUBLIC_HOMEPAGE_HERO_VIDEO_URL} type="video/mp4" />
      </video>
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/30 md:from-black/50 md:to-black/40 z-10" />
      
      <div className="relative z-20 max-w-2xl space-y-6 md:space-y-8 pt-4 md:pt-0">
        <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">
          {/* Mobile & Desktop: Grid */}
          <div className="grid grid-cols-3 gap-2 md:gap-6 px-2 md:px-4">
            <div className="bg-teal-500/20 backdrop-blur-sm p-2 md:p-6 rounded-lg md:rounded-2xl shadow-2xl border border-teal-400/30 hover:bg-teal-500/30 hover:shadow-3xl transition-all duration-300">
              <div className="h-8 md:h-12 flex items-center justify-center mb-1 md:mb-3">
                <RiAdvertisementFill className="text-2xl md:text-4xl text-white" />
              </div>
              <h3 className="text-xs md:text-lg font-bold text-white mb-2 md:mb-4 text-center">Listings</h3>
              <Link
                href="/listings"
                className="block w-full bg-white/90 hover:bg-white text-teal-700 py-1 md:py-2.5 px-2 md:px-4 rounded md:rounded-lg font-semibold text-center mb-1 md:mb-2 transition-colors text-xs md:text-base"
              >
                Browse
              </Link>
              <Link
                href="/listings/add"
                className="block w-full text-white hover:text-lime-200 py-1 md:py-2 text-center text-xs md:text-sm font-medium transition-colors"
              >
                + Post Ad
              </Link>
            </div>

            <div className="bg-purple-500/20 backdrop-blur-sm p-2 md:p-6 rounded-lg md:rounded-2xl shadow-2xl border border-purple-400/30 hover:bg-purple-500/30 hover:shadow-3xl transition-all duration-300">
              <div className="h-8 md:h-12 flex items-center justify-center mb-1 md:mb-3">
                <FaCalendarAlt className="text-2xl md:text-4xl text-white" />
              </div>
              <h3 className="text-xs md:text-lg font-bold text-white mb-2 md:mb-4 text-center">Events</h3>
              <Link
                href="/events"
                className="block w-full bg-white/90 hover:bg-white text-purple-700 py-1 md:py-2.5 px-2 md:px-4 rounded md:rounded-lg font-semibold text-center mb-1 md:mb-2 transition-colors text-xs md:text-base"
              >
                Find
              </Link>
              <Link
                href="/events/add"
                className="block w-full text-white hover:text-lime-200 py-1 md:py-2 text-center text-xs md:text-sm font-medium transition-colors"
              >
                + Create Event
              </Link>
            </div>

            <div className="bg-orange-500/20 backdrop-blur-sm p-2 md:p-6 rounded-lg md:rounded-2xl shadow-2xl border border-orange-400/30 hover:bg-orange-500/30 hover:shadow-3xl transition-all duration-300">
              <div className="h-8 md:h-12 flex items-center justify-center mb-1 md:mb-3">
                <MdOutlineGroups2 className="text-2xl md:text-4xl text-white" />
              </div>
              <h3 className="text-xs md:text-lg font-bold text-white mb-2 md:mb-4 text-center">Discussions</h3>
              <Link
                href="/threads"
                className="block w-full bg-white/90 hover:bg-white text-orange-700 py-1 md:py-2.5 px-2 md:px-4 rounded md:rounded-lg font-semibold text-center mb-1 md:mb-2 transition-colors text-xs md:text-base"
              >
                Join
              </Link>
              <Link
                href="/threads/new"
                className="block w-full text-white hover:text-lime-200 py-1 md:py-2 text-center text-xs md:text-sm font-medium transition-colors"
              >
                + Start Discussion
              </Link>
            </div>
          </div>

          {/* Bottom Row: Side-by-side on all screens */}
          <div className="grid grid-cols-2 gap-2 md:gap-6 max-w-2xl mx-auto px-2 md:px-4">
            <div className="bg-white/20 backdrop-blur-sm p-2 md:p-5 rounded-lg md:rounded-xl shadow-lg border border-white/30 opacity-70 cursor-not-allowed">
              <div className="text-xl md:text-3xl mb-1 md:mb-2 mx-auto text-white text-center">🏷️</div>
              <h3 className="text-xs md:text-base font-bold text-white mb-1 md:mb-2 text-center">Find Deals</h3>
              <div className="bg-white/30 text-white py-1 md:py-2 px-2 md:px-4 rounded md:rounded-lg font-medium text-center text-xs md:text-sm">
                Coming Soon
              </div>
            </div>

            <Link
              href="/tickets"
              className="bg-amber-500/20 backdrop-blur-sm p-2 md:p-5 rounded-lg md:rounded-xl shadow-lg border border-amber-400/30 hover:bg-amber-500/30 transition-all duration-300"
            >
              <div className="text-xl md:text-3xl mb-1 md:mb-2 mx-auto text-white text-center">🎟️</div>
              <h3 className="text-xs md:text-base font-bold text-white mb-1 md:mb-2 text-center">Sell Tickets</h3>
              <div className="bg-white/90 hover:bg-white text-amber-700 py-1 md:py-2 px-2 md:px-4 rounded md:rounded-lg font-semibold text-center text-xs md:text-sm transition-colors">
                Click here for more info
              </div>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
