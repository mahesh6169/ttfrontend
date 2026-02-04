'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useQueryStates, parseAsString } from 'nuqs';
import {
  HiHome,
  HiWrench,
  HiShoppingBag,
  HiMagnifyingGlass,
  HiCalendar,
  HiTicket,
  HiMapPin,
  HiTag,
  HiChatBubbleLeftRight,
} from 'react-icons/hi2';
import {
  LuCar,
  LuPartyPopper,
  LuUtensilsCrossed,
  LuScissors,
} from 'react-icons/lu';

// --- Feature Tabs ---
const FEATURE_TABS = [
  { id: 'listings', label: 'Listings' },
  { id: 'events', label: 'Events' },
  { id: 'deals', label: 'Deals' },
  { id: 'community', label: 'Community' },
];

// --- Listings Tab Tiles ---
const LISTING_TILES = [
  {
    posterLabel: 'List a Rental',
    seekerLabel: 'Rentals',
    icon: HiHome,
    posterTarget: '/listings/add',
    posterParams: { cat: 'Real Estate', sub: 'Sell, Rent & Share' },
    seekerTarget: '/listings',
    seekerParams: { cat: 'Real Estate', sub: 'Sell, Rent & Share' },
    requiresAuth: true,
  },
  {
    posterLabel: 'List a Vehicle',
    seekerLabel: 'Vehicles',
    icon: LuCar,
    posterTarget: '/listings/add',
    posterParams: { cat: 'Buy & Sell', sub: 'Cars & Vehicles' },
    seekerTarget: '/listings',
    seekerParams: { cat: 'Buy & Sell', sub: 'Cars & Vehicles' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Sell an Item',
    seekerLabel: 'Items for Sale',
    icon: HiShoppingBag,
    posterTarget: '/listings/add',
    posterParams: { cat: 'Buy & Sell' },
    seekerTarget: '/listings',
    seekerParams: { cat: 'Buy & Sell' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Offer Home Services',
    seekerLabel: 'Home Services',
    icon: HiWrench,
    posterTarget: '/listings/add',
    posterParams: { cat: 'Home Services' },
    seekerTarget: '/listings',
    seekerParams: { cat: 'Home Services' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Offer Party Services',
    seekerLabel: 'Party Services',
    icon: LuPartyPopper,
    posterTarget: '/listings/add',
    posterParams: { cat: 'Party & Entertainment' },
    seekerTarget: '/listings',
    seekerParams: { cat: 'Party & Entertainment' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Offer Catering',
    seekerLabel: 'Catering',
    icon: LuUtensilsCrossed,
    posterTarget: '/listings/add',
    posterParams: { cat: 'Food & Catering', sub: 'Catering' },
    seekerTarget: '/listings',
    seekerParams: { cat: 'Food & Catering', sub: 'Catering' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Offer Beauty Services',
    seekerLabel: 'Beauty Services',
    icon: LuScissors,
    posterTarget: '/listings/add',
    posterParams: { cat: 'Beauty & Wellness' },
    seekerTarget: '/listings',
    seekerParams: { cat: 'Beauty & Wellness' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Explore All',
    seekerLabel: 'Explore All',
    icon: HiMagnifyingGlass,
    posterTarget: '/listings/add',
    seekerTarget: '/listings',
    requiresAuth: false,
    isExploreAll: true,
  },
];

// --- Events Tab Tiles ---
const EVENT_TILES = [
  {
    label: 'Host an Event',
    icon: HiCalendar,
    target: '/events/add',
    requiresAuth: true,
  },
  {
    label: 'Sell Tickets',
    icon: HiTicket,
    target: '/tickets',
    requiresAuth: false,
  },
  {
    label: 'Browse Events',
    icon: HiMapPin,
    target: '/events',
    requiresAuth: false,
  },
];

const heroParsers = {
  tab: parseAsString.withDefault('listings'),
  mode: parseAsString.withDefault('poster'),
};

const HeroSection = () => {
  const router = useRouter();
  const [heroParams, setHeroParams] = useQueryStates(heroParsers, { shallow: true, history: 'push' });
  const activeTab = heroParams.tab;
  const mode = heroParams.mode;
  const [fadeIn, setFadeIn] = useState(true);

  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

  // Tab switch with fade
  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    setFadeIn(false);
    setTimeout(() => {
      // Clear mode when leaving listings tab, keep it when entering listings
      const updates = { tab: tabId };
      if (tabId !== 'listings') {
        updates.mode = null;
      }
      setHeroParams(updates);
      setFadeIn(true);
    }, 150);
  };

  // Navigate with optional auth gate
  const navigateWithAuth = (target, requiresAuth) => {
    if (requiresAuth && !isLoggedIn) {
      localStorage.setItem('redirectAfterLogin', target);
      router.push('/login?preserveRedirect=true');
      return;
    }
    router.push(target);
  };

  // Listing tile click — handles poster/seeker + params
  const handleListingTileClick = (tile) => {
    let target = mode === 'poster' ? tile.posterTarget : tile.seekerTarget;
    const params = mode === 'poster' ? tile.posterParams : tile.seekerParams;
    if (params) {
      const searchParams = new URLSearchParams(params);
      target = `${target}?${searchParams.toString()}`;
    }
    const requiresAuth = mode === 'poster' && tile.requiresAuth;
    navigateWithAuth(target, requiresAuth);
  };

  // Simple tile click — single target
  const handleSimpleTileClick = (tile) => {
    navigateWithAuth(tile.target, tile.requiresAuth);
  };

  const mainListingTiles = LISTING_TILES.filter((tile) => !tile.isExploreAll);
  const exploreAllTile = LISTING_TILES.find((tile) => tile.isExploreAll);

  // Shared tile classes — flat tiles on recessed bg, white stands out naturally
  const tileClass =
    'flex items-center gap-2 sm:gap-3 md:flex-col md:gap-3 p-2.5 sm:p-3 md:p-5 rounded-xl bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer';

  // Shared grid container classes (2-col mobile with vertical scroll, 3-col desktop)
  const gridContainerClass =
    'grid grid-cols-2 gap-2 sm:gap-3 max-h-[160px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid-cols-3 md:max-h-none md:overflow-visible';

  // Recessed inset panel — visually lower than the card surface
  const insetPanelClass =
    'bg-slate-50 rounded-xl ring-1 ring-slate-200/60 p-2.5 sm:p-3 md:p-4';

  return (
    <section className="px-3 sm:px-4 pt-10 pb-6 md:py-12">
      <div className="w-full md:container md:mx-auto">
        {/* Headline */}
        <div className="text-center mb-3 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-900">
            Your Online Community Marketplace
          </h1>
          <p className="mt-2 sm:mt-3 text-slate-600 text-sm sm:text-base md:text-lg font-medium">
            Powered by community, not algorithms.
          </p>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-5 md:p-8">

          {/* Feature Pills */}
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-8 sm:mb-8">
            <div className="flex gap-1.5 sm:gap-2 justify-start md:justify-center">
              {FEATURE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content — fade transition */}
          <div
            className={`transition-opacity duration-150 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* ===== Listings Tab ===== */}
            {activeTab === 'listings' && (
              <div>
                {/* Poster / Seeker Toggle */}
                <div className="flex justify-center mb-4 sm:mb-5">
                  <div className="inline-flex bg-slate-100 rounded-full p-0.5 sm:p-1">
                    <button
                      onClick={() => setHeroParams({ mode: 'poster' })}
                      className={`px-3 sm:px-5 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                        mode === 'poster'
                          ? 'bg-white text-teal-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      I want to
                    </button>
                    <button
                      onClick={() => setHeroParams({ mode: 'seeker' })}
                      className={`px-3 sm:px-5 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                        mode === 'seeker'
                          ? 'bg-white text-teal-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      I&apos;m looking for
                    </button>
                  </div>
                </div>

                {/* Listing Tiles — recessed inset panel */}
                <div className={insetPanelClass}>
                  <p className="text-xs italic text-teal-700 mb-2 sm:mb-2.5">Featured categories</p>
                  <div className={gridContainerClass}>
                    {mainListingTiles.map((tile, index) => {
                      const Icon = tile.icon;
                      const label =
                        mode === 'poster' ? tile.posterLabel : tile.seekerLabel;
                      return (
                        <button
                          key={index}
                          onClick={() => handleListingTileClick(tile)}
                          className={tileClass}
                        >
                          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-slate-100 rounded-xl shrink-0">
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 text-teal-700" />
                          </div>
                          <span className="font-medium text-xs sm:text-sm md:text-base text-left md:text-center leading-tight text-slate-900">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Explore All — centered below */}
                {exploreAllTile && (
                  <div className="flex justify-center mt-3 sm:mt-4">
                    <button
                      onClick={() => handleListingTileClick(exploreAllTile)}
                      className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 cursor-pointer"
                    >
                      <HiMagnifyingGlass className="w-4 h-4 sm:w-5 sm:h-5 text-teal-700" />
                      <span className="font-medium text-xs sm:text-sm text-slate-700">
                        {mode === 'poster' ? exploreAllTile.posterLabel : exploreAllTile.seekerLabel}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===== Events Tab ===== */}
            {activeTab === 'events' && (
              <div className={insetPanelClass}>
                <div className={gridContainerClass}>
                  {EVENT_TILES.map((tile, index) => {
                    const Icon = tile.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSimpleTileClick(tile)}
                        className={tileClass}
                      >
                        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-slate-100 rounded-xl shrink-0">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 text-teal-700" />
                        </div>
                        <span className="font-medium text-xs sm:text-sm md:text-base text-left md:text-center leading-tight text-slate-900">
                          {tile.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== Deals Tab — Placeholder ===== */}
            {activeTab === 'deals' && (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="text-center">
                  <HiTag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">
                    Deals &amp; Coupons — coming soon
                  </p>
                </div>
              </div>
            )}

            {/* ===== Community Tab — Placeholder ===== */}
            {activeTab === 'community' && (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="text-center">
                  <HiChatBubbleLeftRight className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">
                    Community Forum — coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
