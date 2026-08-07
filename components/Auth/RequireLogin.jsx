// /components/Auth/RequireLogin.jsx

'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';

const RequireLogin = ({
  children,
  message = "You must be logged in to continue.",
  redirectPath = typeof window !== "undefined" ? window.location.pathname : "/",
}) => {
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

  // If logged in, show the protected content
  if (isLoggedIn) return children;

  // Only set redirect for non-logged in users
  if (typeof window !== "undefined" && !isLoggedIn) {
    localStorage.setItem("redirectAfterLogin", redirectPath);
  }

  return (
    <div className="border rounded-lg p-4 shadow-md bg-white text-center">
      <p className="text-slate-700 mb-4 text-xs sm:text-base">
        {message}
      </p>
      <div className="flex justify-center space-x-4">
        <Link
          href={`/login?preserveRedirect=true`}
          className="px-4 py-2 text-xs sm:text-base bg-teal-600 text-lime-100 hover:bg-teal-700 hover:text-lime-100"
        >
          Login
        </Link>
        <Link
          href={`/register?preserveRedirect=true`}
          className="px-4 py-2 text-xs sm:text-base bg-teal-600 text-lime-100 hover:bg-teal-700 hover:text-lime-100"
        >
          Register
        </Link>
      </div>
    </div>
  );
};

export default RequireLogin;
