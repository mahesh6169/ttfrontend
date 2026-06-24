'use client';

import { useState, useRef, useEffect } from 'react';
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
  HiMegaphone,
  HiGlobeAlt,
  HiQuestionMarkCircle,
  HiHeart,
  HiBanknotes,
  HiBriefcase,
  HiBuildingOffice,
  HiChevronLeft,
  HiChevronRight,
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

const heroParsers = {
  tab: parseAsString.withDefault('listings'),
  mode: parseAsString.withDefault('poster'),
};

// Shared style tokens
const scrollbarHide = '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]';
const chipClass =
  'flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700 transition-colors cursor-pointer';

const HeroSection = () => {
  const router = useRouter();
  const [heroParams, setHeroParams] = useQueryStates(heroParsers, { shallow: true, history: 'push' });
  const activeTab = heroParams.tab;
  const mode = heroParams.mode;
  const [fadeIn, setFadeIn] = useState(true);

  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

  // Desktop chip-scroll arrows
  const chipsRef = useRef(null);
  const [arrows, setArrows] = useState({ left: false, right: false });

  const updateArrows = () => {
    const el = chipsRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setArrows({
      left: scrollLeft > 4,
      right: scrollLeft + clientWidth < scrollWidth - 4,
    });
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [activeTab, mode]);

  const scrollChips = (dir) => {
    chipsRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

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

  // Listing / Forum tile click - handles poster/seeker + params
  const handleToggleTileClick = (tile) => {
    let target = mode === 'poster' ? tile.posterTarget : tile.seekerTarget;
    const params = mode === 'poster' ? tile.posterParams : tile.seekerParams;
    if (params) {
      const searchParams = new URLSearchParams(params);
      target = `${target}?${searchParams.toString()}`;
    }
    const requiresAuth = mode === 'poster' && tile.requiresAuth;
    navigateWithAuth(target, requiresAuth);
  };

  // Simple tile click - single target
  const handleSimpleTileClick = (tile) => {
    navigateWithAuth(tile.target, tile.requiresAuth);
  };

  // Toggle is only meaningful for poster/seeker tabs
  const showToggle = activeTab === 'listings' || activeTab === 'forum';
  const toggleLabels =
    activeTab === 'forum'
      ? { poster: 'Ask a question', seeker: 'Browse answers' }
      : { poster: 'I want to…', seeker: "I'm looking for" };

  // Build the chip set for the active tab
  const getChips = () => {
    switch (activeTab) {
      case 'listings':
        return LISTING_TILES.map((tile, i) => ({
          key: `l-${i}`,
          label: mode === 'poster' ? tile.posterLabel : tile.seekerLabel,
          onClick: () => handleToggleTileClick(tile),
        }));
      case 'events':
        return EVENT_TILES.map((tile, i) => ({
          key: `e-${i}`,
          label: tile.label,
          onClick: () => handleSimpleTileClick(tile),
        }));
      case 'deals':
        return [
          ...DEALS_TILES.map((tile, i) => ({
            key: `d-${i}`,
            label: tile.label,
            onClick: () => handleSimpleTileClick(tile),
          })),
          ...POPULAR_DEAL_CATEGORIES.map((c, i) => ({
            key: `dc-${i}`,
            label: c.label,
            onClick: () =>
              router.push(
                `/dailydeals?cat=${encodeURIComponent(c.cat)}&subcat=${encodeURIComponent(c.subcat)}`
              ),
          })),
        ];
      case 'forum':
        return FORUM_TILES.map((tile, i) => ({
          key: `f-${i}`,
          label: mode === 'poster' ? tile.posterLabel : tile.seekerLabel,
          onClick: () => handleToggleTileClick(tile),
        }));
      default:
        return [];
    }
  };

  return (
    <section className="relative flex flex-col gap-[30px]">
      {/* Decorative square dot-grid behind the tabs, softly masked + gentle pulse */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -z-10 -top-6 left-0 right-0 h-36 animate-pulse"
        style={{
          backgroundImage: 'radial-gradient(rgba(13,148,136,0.30) 1.5px, transparent 1.5px)',
          backgroundSize: '14px 14px',
          maskImage: 'radial-gradient(ellipse 70% 100% at 50% 40%, #000 35%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 100% at 50% 40%, #000 35%, transparent 75%)',
        }}
      />

      {/* Row 1 - Vertical tabs (separate pills, content-width on desktop) */}
      <div className={`flex gap-2 overflow-x-auto md:justify-center ${scrollbarHide}`}>
        {FEATURE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 md:flex-none whitespace-nowrap py-2 px-5 rounded-lg text-sm font-semibold border transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Row 2 - Poster/Seeker toggle (only for Listings + Forum) */}
      {showToggle && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setHeroParams({ mode: 'poster' })}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              mode === 'poster'
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {toggleLabels.poster}
          </button>
          <button
            onClick={() => setHeroParams({ mode: 'seeker' })}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              mode === 'seeker'
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {toggleLabels.seeker}
          </button>
        </div>
      )}

      {/* Row 3 - Category chips (label-only) with desktop scroll arrows */}
      <div className={`w-full lg:max-w-2xl lg:mx-auto flex items-center gap-1 ${showToggle ? '-mt-[15px]' : ''}`}>
        <button
          type="button"
          onClick={() => scrollChips(-1)}
          aria-label="Scroll categories left"
          className={`hidden lg:flex shrink-0 items-center justify-center w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:text-teal-700 hover:border-teal-300 ${
            arrows.left ? '' : 'invisible'
          }`}
        >
          <HiChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={chipsRef}
          onScroll={updateArrows}
          className={`flex gap-2 overflow-x-auto min-w-0 flex-1 transition-opacity duration-150 ${
            fadeIn ? 'opacity-100' : 'opacity-0'
          } ${scrollbarHide}`}
        >
          {getChips().map((chip) => (
            <button key={chip.key} onClick={chip.onClick} className={chipClass}>
              {chip.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollChips(1)}
          aria-label="Scroll categories right"
          className={`hidden lg:flex shrink-0 items-center justify-center w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:text-teal-700 hover:border-teal-300 ${
            arrows.right ? '' : 'invisible'
          }`}
        >
          <HiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
