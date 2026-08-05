'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  HiHome,
  HiBriefcase,
  HiWrench,
  HiCalendar,
  HiTag,
  HiTicket,
  HiShoppingBag,
  HiReceiptPercent,
  HiChatBubbleLeftRight,
} from 'react-icons/hi2';

// Hero Section
function HeroSection() {
  return (
    <div className="text-center mb-6 sm:mb-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-800">
        Your Online Community Marketplaces
      </h1>
      <p className="mt-2 sm:mt-3 text-slate-700 text-sm sm:text-base md:text-lg font-medium">
        Powered by community, not algorithms.
      </p>
    </div>
  );
}

const QUICK_LINKS = [
  {
    posterLabel: 'List a Rental',
    seekerLabel: 'Rent a Property',
    icon: HiHome,
    posterTarget: '/listings/add',
    seekerTarget: '/listings',
    filter: { categories: ['housing'] },
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    requiresAuth: true,
  },
  {
    posterLabel: 'Offer a Service',
    seekerLabel: 'Hire a Service',
    icon: HiWrench,
    posterTarget: '/listings/add',
    seekerTarget: '/listings',
    filter: { categories: ['services'] },
    color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    requiresAuth: true,
  },
  {
    posterLabel: 'Sell an Item',
    seekerLabel: 'Buy an Item',
    icon: HiShoppingBag,
    posterTarget: '/listings/add',
    seekerTarget: '/listings',
    filter: { categories: ['forsale'] },
    color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
    requiresAuth: true,
  },
  {
    posterLabel: 'List My Business',
    seekerLabel: 'Find a Business',
    icon: HiBriefcase,
    posterTarget: '/listings/add',
    seekerTarget: '/listings',
    filter: { categories: ['business'] },
    color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
    requiresAuth: true,
  },
  {
    posterLabel: 'Host an Event',
    seekerLabel: 'Find an Event',
    icon: HiCalendar,
    posterTarget: '/events/add',
    seekerTarget: '/events',
    filter: null,
    color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
    requiresAuth: true,
  },
  {
    posterLabel: 'Sell Tickets',
    seekerLabel: 'Purchase Tickets',
    icon: HiTicket,
    posterTarget: '/tickets',
    seekerTarget: '/events',
    filter: null,
    color: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200',
    requiresAuth: false,
  },
  {
    posterLabel: 'Post a Deal',
    seekerLabel: 'Find Deals',
    icon: HiTag,
    posterTarget: '/deals/manage',
    seekerTarget: '/deals',
    filter: null,
    color: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
    requiresAuth: true,
  },
  {
    posterLabel: null,
    seekerLabel: 'Find Coupons',
    seekerOnly: true,
    icon: HiReceiptPercent,
    posterTarget: null,
    seekerTarget: '/coupons',
    filter: null,
    color: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200',
    requiresAuth: false,
  },
  {
    posterLabel: 'Ask a Question',
    seekerLabel: 'Browse Forum',
    icon: HiChatBubbleLeftRight,
    posterTarget: '/threads/new',
    seekerTarget: '/threads',
    filter: null,
    color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
    requiresAuth: true,
  },
];

export default function HomeTestPage() {
  const router = useRouter();
  const [mode, setMode] = useState('poster'); // 'poster' or 'seeker'

  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

  const handleLinkClick = (link) => {
    const target = mode === 'poster' ? link.posterTarget : link.seekerTarget;

    // Poster mode requires login for /add pages
    if (mode === 'poster' && link.requiresAuth && !isLoggedIn) {
      localStorage.setItem('redirectAfterLogin', target);
      router.push('/login?preserveRedirect=true');
      return;
    }

    router.push(target);
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="px-3 sm:px-4 py-6 md:py-12">
        <div className="w-full md:container md:mx-auto">
          {/* Headline */}
          <HeroSection />

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-5 md:p-8 max-w-4xl mx-auto">

            {/* Segmented Pill Toggle */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="inline-flex bg-slate-100 rounded-full p-1">
                <button
                  onClick={() => setMode('poster')}
                  className={`px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-base font-semibold transition-all duration-300 ${
                    mode === 'poster'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  I want to
                </button>
                <button
                  onClick={() => setMode('seeker')}
                  className={`px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-base font-semibold transition-all duration-300 ${
                    mode === 'seeker'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  I'm looking to
                </button>
              </div>
            </div>

            {/* Category Grid - 2 cols mobile, 4 cols desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {QUICK_LINKS
                .filter((link) => mode === 'seeker' || !link.seekerOnly)
                .map((link, index) => {
                  const Icon = link.icon;
                  const label = mode === 'poster' ? link.posterLabel : link.seekerLabel;
                  return (
                    <button
                      key={index}
                      onClick={() => handleLinkClick(link)}
                      className={`flex items-center gap-2 sm:gap-3 md:flex-col md:gap-2 p-2.5 sm:p-3 md:p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer ${link.color}`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 shrink-0" />
                      <span className="font-medium text-xs sm:text-sm md:text-base text-left md:text-center leading-tight">
                        {label}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
