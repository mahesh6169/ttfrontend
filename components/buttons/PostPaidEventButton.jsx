'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PostPaidEventButton = ({ className = '' }) => {
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

  const handleClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      localStorage.setItem('redirectAfterLogin', '/users/profile/onboard');
      router.push('/login?preserveRedirect=true');
    } else {
      localStorage.setItem('cancelRedirectUrl', '/events');
    }
  };

  return (
    <Link
      href="/users/profile/onboard"
      onClick={handleClick}
      className={className || "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-4 py-2 text-sm md:text-base rounded-md shadow-md hover:shadow-lg font-semibold transition-all"}
    >
      Create Your Event
    </Link>
  );
};

export default PostPaidEventButton;
