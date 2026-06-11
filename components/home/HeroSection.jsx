'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  HiMegaphone,
  HiGlobeAlt,
  HiQuestionMarkCircle,
  HiHeart,
  HiBanknotes,
  HiBriefcase,
  HiBuildingOffice,
} from 'react-icons/hi2';
import {
  LuCar,
  LuPartyPopper,
  LuUtensilsCrossed,
  LuScissors,
  LuDrama,
  LuGift,
  LuLayoutGrid,
} from 'react-icons/lu';

// --- Feature Tabs ---
const FEATURE_TABS = [
  { id: 'listings', label: 'Listings' },
  { id: 'events', label: 'Events' },
  { id: 'deals', label: 'Deals' },
  { id: 'forum', label: 'Forum' },
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
    label: 'Promote an Event',
    icon: HiMegaphone,
    target: '/events/add?intent=promote',
    requiresAuth: true,
  },
  {
    label: 'Host Free Event',
    icon: HiCalendar,
    target: '/events/add?intent=host&type=free',
    requiresAuth: true,
  },
  {
    label: 'Host Paid Event',
    icon: HiTicket,
    target: '/events/add?intent=host&type=paid',
    requiresAuth: true,
  },
  {
    label: 'Browse Events',
    icon: HiMapPin,
    target: '/events',
    requiresAuth: false,
  },
];

// --- Deals Tab Tiles ---
const DEALS_TILES = [
  {
    label: 'Browse Deals',
    icon: HiMagnifyingGlass,
    target: '/dailydeals',
    requiresAuth: false,
  },
  {
    label: 'Post a Deal',
    icon: HiTag,
    target: '/users/profile/dailydeals',
    requiresAuth: true,
  },
];

// Popular deal categories for quick links
const POPULAR_DEAL_CATEGORIES = [
  { label: 'Restaurants', cat: 'Food & Dining', subcat: 'Restaurants' },
  { label: 'Catering', cat: 'Food & Dining', subcat: 'Catering' },
  { label: 'Cakes', cat: 'Food & Dining', subcat: 'Cakes' },
  { label: 'Hair & Makeup', cat: 'Beauty & Wellness', subcat: 'Hair, Makeup & Waxing' },
];

// --- Forum Tab Tiles ---
const FORUM_TILES = [
  {
    posterLabel: 'Migration & Visas',
    seekerLabel: 'Migration & Visas',
    icon: HiGlobeAlt,
    posterTarget: '/threads/new',
    posterParams: { cat: 'Migration & Visas' },
    seekerTarget: '/threads',
    seekerParams: { cat: 'Migration & Visas' },
    requiresAuth: true,
  },
  {
    posterLabel: 'General Enquiries',
    seekerLabel: 'General Enquiries',
    icon: HiQuestionMarkCircle,
    posterTarget: '/threads/new',
    posterParams: { cat: 'General Enquiries' },
    seekerTarget: '/threads',
    seekerParams: { cat: 'General Enquiries' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Health & Medical',
    seekerLabel: 'Health & Medical',
    icon: HiHeart,
    posterTarget: '/threads/new',
    posterParams: { cat: 'Health & Medical' },
    seekerTarget: '/threads',
    seekerParams: { cat: 'Health & Medical' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Personal Finance',
    seekerLabel: 'Personal Finance',
    icon: HiBanknotes,
    posterTarget: '/threads/new',
    posterParams: { cat: 'Personal Finance' },
    seekerTarget: '/threads',
    seekerParams: { cat: 'Personal Finance' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Career & Employment',
    seekerLabel: 'Career & Employment',
    icon: HiBriefcase,
    posterTarget: '/threads/new',
    posterParams: { cat: 'Career & Employment' },
    seekerTarget: '/threads',
    seekerParams: { cat: 'Career & Employment' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Real Estate & Rentals',
    seekerLabel: 'Real Estate & Rentals',
    icon: HiBuildingOffice,
    posterTarget: '/threads/new',
    posterParams: { cat: 'Real Estate & Rentals' },
    seekerTarget: '/threads',
    seekerParams: { cat: 'Real Estate & Rentals' },
    requiresAuth: true,
  },
  {
    posterLabel: 'Explore All',
    seekerLabel: 'Explore All',
    icon: HiMagnifyingGlass,
    posterTarget: '/threads/new',
    seekerTarget: '/threads',
    requiresAuth: false,
    isExploreAll: true,
  },
];

const HERO_ROTATIONS = [
  { text: 'Listings', Icon: LuLayoutGrid },
  { text: 'Events', Icon: LuDrama },
  { text: 'Deals', Icon: LuGift },
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

  // Rotating noun in the hero headline ("Discover ___ near you")
  const [rotationIndex, setRotationIndex] = useState(0);
  const [rotationVisible, setRotationVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationVisible(false);
      setTimeout(() => {
        setRotationIndex((i) => (i + 1) % HERO_ROTATIONS.length);
        setRotationVisible(true);
      }, 200);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

  // Tab switch with fade
  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    setFadeIn(false);
    setTimeout(() => {
      // Keep mode for listings and forum tabs, clear for others
      const updates = { tab: tabId };
      if (tabId !== 'listings' && tabId !== 'forum') {
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

  // Forum tile click — handles poster/seeker + params
  const handleForumTileClick = (tile) => {
    let target = mode === 'poster' ? tile.posterTarget : tile.seekerTarget;
    const params = mode === 'poster' ? tile.posterParams : tile.seekerParams;
    if (params) {
      const searchParams = new URLSearchParams(params);
      target = `${target}?${searchParams.toString()}`;
    }
    const requiresAuth = mode === 'poster' && tile.requiresAuth;
    navigateWithAuth(target, requiresAuth);
  };

  const mainListingTiles = LISTING_TILES.filter((tile) => !tile.isExploreAll);
  const exploreAllTile = LISTING_TILES.find((tile) => tile.isExploreAll);
  const mainForumTiles = FORUM_TILES.filter((tile) => !tile.isExploreAll);
  const exploreAllForumTile = FORUM_TILES.find((tile) => tile.isExploreAll);

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
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-teal-900">
            Discover{' '}
            <span
              className={`text-xl sm:text-2xl md:text-3xl font-serif italic font-medium inline-flex items-center gap-2 min-w-[8ch] sm:min-w-[10ch] transition-opacity duration-200 ${
                rotationVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {(() => {
                const { Icon, text } = HERO_ROTATIONS[rotationIndex];
                return (
                  <>
                    {text}
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-teal-700 shrink-0" />
                  </>
                );
              })()}
            </span>
          </h1>
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

            {/* ===== Deals Tab ===== */}
            {activeTab === 'deals' && (
              <div className={`${insetPanelClass} md:max-w-md md:mx-auto`}>
                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  {DEALS_TILES.map((tile, index) => {
                    const Icon = tile.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSimpleTileClick(tile)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-white border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all duration-200"
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-700" />
                        <span className="font-medium text-sm sm:text-base text-slate-900">
                          {tile.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Popular Categories */}
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 sm:gap-x-3">
                    <span className="text-xs text-slate-500 font-medium">Popular:</span>
                    {POPULAR_DEAL_CATEGORIES.map((category, index) => (
                      <Link
                        key={index}
                        href={`/dailydeals?cat=${encodeURIComponent(category.cat)}&subcat=${encodeURIComponent(category.subcat)}`}
                        className="text-xs sm:text-sm text-teal-700 hover:text-teal-800 hover:underline font-medium"
                      >
                        {category.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== Forum Tab ===== */}
            {activeTab === 'forum' && (
              <div>
                {/* Ask / Browse Toggle */}
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
                      Ask a question
                    </button>
                    <button
                      onClick={() => setHeroParams({ mode: 'seeker' })}
                      className={`px-3 sm:px-5 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                        mode === 'seeker'
                          ? 'bg-white text-teal-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Browse answers
                    </button>
                  </div>
                </div>

                {/* Forum Tiles — recessed inset panel */}
                <div className={insetPanelClass}>
                  <p className="text-xs italic text-teal-700 mb-2 sm:mb-2.5">Featured topics</p>
                  <div className={gridContainerClass}>
                    {mainForumTiles.map((tile, index) => {
                      const Icon = tile.icon;
                      const label =
                        mode === 'poster' ? tile.posterLabel : tile.seekerLabel;
                      return (
                        <button
                          key={index}
                          onClick={() => handleForumTileClick(tile)}
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
                {exploreAllForumTile && (
                  <div className="flex justify-center mt-3 sm:mt-4">
                    <button
                      onClick={() => handleForumTileClick(exploreAllForumTile)}
                      className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 cursor-pointer"
                    >
                      <HiMagnifyingGlass className="w-4 h-4 sm:w-5 sm:h-5 text-teal-700" />
                      <span className="font-medium text-xs sm:text-sm text-slate-700">
                        {mode === 'poster' ? exploreAllForumTile.posterLabel : exploreAllForumTile.seekerLabel}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
