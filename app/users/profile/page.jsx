'use client';
import React from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { 
  FaAd, FaCalendarAlt, FaEnvelope, FaUser, FaPlus,
  FaCog, FaCheckCircle, FaEye, FaFileInvoice, FaTicketAlt
} from 'react-icons/fa';
import { MdFavorite } from 'react-icons/md';
import { BsChatText, BsChatDots } from 'react-icons/bs';
import { RiMoneyDollarCircleFill } from 'react-icons/ri';
import LoadingSpinner from '@/components/LoadingSpinner';

const ProfilePage = () => {
  const { user, status } = useSelector((state) => state.user);
 
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 py-3 sm:px-4 sm:py-6">
      {/* Welcome Header - Compact */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
          Welcome, {user?.name || 'User'}!
        </h1>
      </div>

      {/* First Container: Account Settings & Check-in */}
      <div className="border border-gray-300 rounded-lg mb-3 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Account Settings Column */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <FaCog className="text-gray-600" />
              Account Settings
            </h3>
            <div className="space-y-1.5">
              <Link 
                href="/users/profile/settings" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → User Settings
              </Link>
              <Link 
                href="/users/profile/settings/stripeSetup" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → Stripe Setup
              </Link>
            </div>
          </div>

          {/* Check-in Column */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <FaCheckCircle className="text-gray-600" />
              Check-in...
            </h3>
            <div className="space-y-1.5">
              <Link 
                href="/users/profile/checkInFree" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → RSVPs
              </Link>
              <Link 
                href="/users/profile/checkInPaid" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → Paid Events
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Second Container: Add & Manage */}
      <div className="border border-gray-300 rounded-lg mb-3 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Add Column */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <FaPlus className="text-gray-600" />
              Add a...
            </h3>
            <div className="space-y-1.5">
              <Link 
                href="/listings/add" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → Listing
              </Link>
              <Link 
                href="/events/create" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → Event
              </Link>
              <Link 
                href="/threads/create" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → Topic
              </Link>
            </div>
          </div>

          {/* Manage Column */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <FaCog className="text-gray-600" />
              Manage...
            </h3>
            <div className="space-y-1.5">
              <Link 
                href="/users/profile/manageads" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → Listings
              </Link>
              <Link 
                href="/users/profile/manageevents" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → Events
              </Link>
              <Link 
                href="/users/profile/managethreads" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → Topics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Third Container: Event Organizer & View */}
      <div className="border border-gray-300 rounded-lg mb-3 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Event Organizer Column */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <RiMoneyDollarCircleFill className="text-gray-600" />
              Event Organizer
            </h3>
            <div className="space-y-1.5">
              <Link 
                href="/users/profile/settings/stripeSetup" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → Stripe Setup
              </Link>
              <Link 
                href="/users/profile/refunds" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → Manage Refunds
              </Link>
            </div>
          </div>

          {/* View Column */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <FaEye className="text-gray-600" />
              View...
            </h3>
            <div className="space-y-1.5">
              <Link 
                href="/users/profile/myregistrations" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → My RSVPs
              </Link>
              <Link 
                href="/users/profile/mytickets" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → My Tickets
              </Link>
              <Link 
                href="/users/profile/myinvoices" 
                className="block text-xs sm:text-sm text-gray-700 hover:text-teal-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                → My Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Last Container: Favorites & Messages */}
      <div className="border border-gray-300 rounded-lg p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Favorites */}
          <Link 
            href="/users/profile/favourites"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
          >
            <MdFavorite className="text-red-500 text-lg sm:text-xl" />
            <span className="text-sm sm:text-base font-medium text-gray-700 group-hover:text-gray-900">
              Favourites
            </span>
          </Link>

          {/* Messages */}
          <Link 
            href="/users/profile/conversations"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
          >
            <BsChatDots className="text-blue-500 text-lg sm:text-xl" />
            <span className="text-sm sm:text-base font-medium text-gray-700 group-hover:text-gray-900">
              Messages
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;