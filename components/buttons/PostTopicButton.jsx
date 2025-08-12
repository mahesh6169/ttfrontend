'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PostTopicButton = ({ className = '' }) => {
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

  const handleClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      // Save intended destination
      localStorage.setItem('redirectAfterLogin', '/threads/new');
      // Redirect to login
      router.push('/login?preserveRedirect=true');
    } else {
      // Save where we came from for Cancel button
      localStorage.setItem('cancelRedirectUrl', '/threads');
    }
  };

  return (
    <Link
      href="/threads/new"
      onClick={handleClick}
      className={className || "bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-4 py-2 text-sm md:text-base rounded shadow font-semibold transition duration-200"}
    >
      Create Topic
    </Link>
  );
};

export default PostTopicButton;