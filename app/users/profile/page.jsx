'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import {
  FaCog,
  FaCommentDots,
  FaHeart,
  FaBoxOpen,
  FaTicketAlt,
  FaBullseye,
  FaComments,
  FaTags,
  FaChevronRight,
} from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';

// localStorage key for persisting section states
const STORAGE_KEY = 'profile_sections_state';

// Default section states
const DEFAULT_SECTIONS = {
  listings: false,
  events: false,
  organizer: false,
  threads: false,
  deals: false,
  coupons: false,
};

const ProfilePage = () => {
  const { user, status } = useSelector((state) => state.user);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  // Load section states from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSections({ ...DEFAULT_SECTIONS, ...JSON.parse(saved) });
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Save section states to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [sections]);

  const toggleSection = (section) => {
    setSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and content</p>
      </div>

      {/* Account Section - Quick Access Row */}
      <div className="mb-8">
        <div className="flex items-center gap-6 sm:gap-8">
          <QuickLink
            href="/users/profile/settings"
            icon={FaCog}
            label="Settings"
          />
          <QuickLink
            href="/users/profile/conversations"
            icon={FaCommentDots}
            label="Messages"
          />
          <QuickLink
            href="/users/profile/favourites"
            icon={FaHeart}
            label="Favorites"
            iconColor="text-red-500"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 mb-6" />

      {/* Accordion Sections */}
      <div className="space-y-1">
        {/* Listings Section */}
        <AccordionSection
          title="Listings"
          icon={FaBoxOpen}
          iconColor="text-teal-600"
          isExpanded={sections.listings}
          onToggle={() => toggleSection('listings')}
        >
          <div className="grid grid-cols-2 gap-2 pt-3">
            <ActionCard href="/listings/add" label="Add Listing" />
            <ActionCard href="/users/profile/manageads" label="Manage Listings" />
          </div>
        </AccordionSection>

        {/* Events Section (Attendee) */}
        <AccordionSection
          title="Events [Attendee]"
          icon={FaTicketAlt}
          iconColor="text-purple-600"
          isExpanded={sections.events}
          onToggle={() => toggleSection('events')}
        >
          <div className="grid grid-cols-3 gap-2 pt-3">
            <ActionCard href="/users/profile/myregistrations" label="My RSVPs" />
            <ActionCard href="/users/profile/mytickets" label="Paid Tickets" />
            <ActionCard href="/users/profile/myinvoices" label="Invoices" />
          </div>
        </AccordionSection>

        {/* Events [Host] Section */}
        <AccordionSection
          title="Events [Host]"
          icon={FaBullseye}
          iconColor="text-amber-600"
          isExpanded={sections.organizer}
          onToggle={() => toggleSection('organizer')}
        >
          <div className="pt-3 space-y-4">
            {/* Free Event */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">RSVP Event</p>
              <div className="grid grid-cols-3 gap-2">
                <ActionCard href="/events/add" label="Add" />
                <ActionCard href="/users/profile/manageevents" label="Manage" />
                <ActionCard href="/users/profile/checkInFree" label="Check-in" />
              </div>
            </div>
            {/* Paid Event */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Paid Event</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                <ActionCard href="/users/profile/onboard" label="Onboarding" />
                <ActionCard href="/events/add" label="Add" />
                <ActionCard href="/users/profile/manageevents" label="Manage" />
                <ActionCard href="/users/profile/checkInPaid" label="Check-in" />
                <ActionCard href="/users/profile/refunds" label="Orders" />
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Threads Section */}
        <AccordionSection
          title="Threads"
          icon={FaComments}
          iconColor="text-sky-600"
          isExpanded={sections.threads}
          onToggle={() => toggleSection('threads')}
        >
          <div className="grid grid-cols-2 gap-2 pt-3">
            <ActionCard href="/threads/new" label="Add Topic" />
            <ActionCard href="/users/profile/managethreads" label="Manage Topics" />
          </div>
        </AccordionSection>

        {/* Deals Section */}
        <AccordionSection
          title="Deals"
          icon={FaTags}
          iconColor="text-orange-600"
          isExpanded={sections.deals}
          onToggle={() => toggleSection('deals')}
        >
          <div className="grid grid-cols-2 gap-2 pt-3">
            <ActionCard href="/users/profile/dailydeals" label="Add Deal" />
            <ActionCard href="/users/profile/dailydeals" label="Manage Deals" />
          </div>
        </AccordionSection>

        {/* Coupons Section - Hidden for now
        <AccordionSection
          title="Coupons"
          icon={FaTicketAlt}
          iconColor="text-pink-600"
          isExpanded={sections.coupons}
          onToggle={() => toggleSection('coupons')}
        >
          <div className="pt-3">
            <ActionCard href="/users/profile/my-codes" label="My Codes" />
          </div>
        </AccordionSection>
        */}
      </div>

      {/* Support Links - Mobile Only */}
      <div className="md:hidden mt-8 pt-6 border-t border-slate-200 text-center">
        <div className="flex justify-center gap-4 text-sm text-slate-500">
          <Link href="/support/contact" className="hover:text-teal-600 transition-colors">
            Contact
          </Link>
          <span>·</span>
          <Link href="/support/terms" className="hover:text-teal-600 transition-colors">
            Terms
          </Link>
          <span>·</span>
          <Link href="/support/privacy" className="hover:text-teal-600 transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
};

// Quick Link for Account section (simple row style)
const QuickLink = ({ href, icon: Icon, label, iconColor = 'text-slate-600' }) => {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-teal-50 flex items-center justify-center transition-colors">
        <Icon className={`${iconColor} group-hover:text-teal-600 text-base transition-colors`} />
      </div>
      <span className="text-xs font-medium text-slate-600 group-hover:text-teal-600 transition-colors">
        {label}
      </span>
    </Link>
  );
};

// Accordion Section Component (Lighter)
const AccordionSection = ({ title, icon: Icon, iconColor, isExpanded, onToggle, children }) => {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-3 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-lg px-2 -mx-2"
      >
        <div className="flex items-center gap-3">
          <Icon className={`${iconColor} text-base`} />
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </div>
        <FaChevronRight
          className={`text-slate-400 text-xs transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

// Action Card Component (Text only, no icon)
const ActionCard = ({ href, label, className = '' }) => {
  return (
    <Link href={href} className={`group ${className}`}>
      <div className="bg-slate-50 group-hover:bg-teal-50 rounded-lg transition-colors min-h-[44px] px-3 text-center flex items-center justify-center">
        <span className="text-sm text-slate-700 group-hover:text-teal-700 transition-colors">{label}</span>
      </div>
    </Link>
  );
};

export default ProfilePage;
