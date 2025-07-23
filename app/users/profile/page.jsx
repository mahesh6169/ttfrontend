'use client';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaAd, FaCalendarAlt, FaEnvelope, FaMoneyCheckAlt } from 'react-icons/fa';
import { MdFavorite } from 'react-icons/md';
import { BsChatText } from 'react-icons/bs';
import LoadingSpinner from '@/components/LoadingSpinner';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, status } = useSelector((state) => state.user);
 
  // Show loading spinner while fetching profile
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <LoadingSpinner />
      </div>
    );
  }

  const quickLinks = [
    {
      title: 'My Adverts',
      description: 'View and manage your posted adverts',
      icon: <FaAd className="w-8 h-8" />,
      href: '/users/profile/manageads',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'My Events',
      description: 'Manage your created events',
      icon: <FaCalendarAlt className="w-8 h-8" />,
      href: '/users/profile/manageevents',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'My Topics',
      description: 'View your forum discussions',
      icon: <BsChatText className="w-8 h-8" />,
      href: '/users/profile/managethreads',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Favourites',
      description: 'Your saved items',
      icon: <MdFavorite className="w-8 h-8" />,
      href: '/users/profile/favourites',
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'Messages',
      description: 'View your conversations',
      icon: <FaEnvelope className="w-8 h-8" />,
      href: '/users/profile/conversations',
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'My Registrations',
      description: 'Events you\'ve registered for',
      icon: <FaCalendarAlt className="w-8 h-8" />,
      href: '/users/profile/myregistrations',
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  return (
    <div className="my-8 w-full max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-600">
          Here's your dashboard overview. What would you like to do today?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className={`inline-flex p-3 rounded-lg ${link.color} mb-4`}>
              {link.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">{link.title}</h3>
            <p className="text-gray-600 text-sm">{link.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/adverts/create" className="block w-full text-center bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 transition">
              Post New Advert
            </Link>
            <Link href="/events/create" className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
              Create New Event
            </Link>
            <Link href="/threads/create" className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition">
              Start New Topic
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <div className="space-y-3">
            <Link href="/users/profile/settings" className="block text-teal-600 hover:underline">
              → Edit Profile Settings
            </Link>
            <Link href="/users/profile/settings/stripeSetup" className="block text-teal-600 hover:underline">
              → Setup Payment (Stripe)
            </Link>
            <Link href="/users/profile/checkInFree" className="block text-teal-600 hover:underline">
              → Event Check-In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;