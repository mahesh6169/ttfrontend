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
      localStorage.setItem('redirectAfterLogin', '/events/add-paid');
      router.push('/login?preserveRedirect=true');
    } else {
      localStorage.setItem('cancelRedirectUrl', '/events');
    }
  };

  return (
    <Link
      href="/events/add-paid"
      onClick={handleClick}
      className={className || "bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-4 py-2 text-sm md:text-base rounded shadow font-semibold transition duration-200"}
    >
      Create Your Event
    </Link>
  );
};

export default PostPaidEventButton;
