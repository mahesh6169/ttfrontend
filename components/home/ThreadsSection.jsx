'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FaFrown } from 'react-icons/fa';
import PromoBanner from '../PromoBanner';
import HeroThreadsSection from './HeroThreadsSection';

const ThreadsSection = ({ threads }) => {
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

  const handleCreateClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      localStorage.setItem('redirectAfterLogin', '/threads/new');
      router.push('/login?preserveRedirect=true');
    } else {
      localStorage.setItem('cancelRedirectUrl', '/');
    }
  };

  if (!threads || threads.length === 0) {
    return (
      <section
        className="relative mt-20 pt-0 pb-4 px-0 sm:pb-6 sm:px-4 rounded-none md:rounded-xl overflow-hidden"
        style={{ background: 'rgb(160, 165, 170)' }}
      >
        {/* Mobile: shallower wave */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none md:hidden"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 600"
        >
          <path
            d="M0,200 C360,160 720,240 1080,180 S1440,220 1440,200 L1440,600 L0,600 Z"
            fill="rgb(245, 245, 248)"
          />
        </svg>
        {/* Desktop: deeper wave */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 600"
        >
          <path
            d="M0,180 C360,80 720,280 1080,130 S1440,230 1440,180 L1440,600 L0,600 Z"
            fill="rgb(245, 245, 248)"
          />
        </svg>
        <div className="relative p-0 sm:pt-0 sm:pb-6 sm:px-6">
          <div className="mb-2 sm:mx-0">
            <HeroThreadsSection />
          </div>
          <div className="text-center py-8">
            <FaFrown className="text-gray-400 text-4xl sm:text-5xl mx-auto mb-3" />
            <p className="text-gray-600 text-sm sm:text-base mb-2">Something went wrong</p>
            <p className="text-gray-500 text-xs sm:text-sm">Please try again later</p>
          </div>
        </div>
      </section>
    );
  }

  const displayThreads = threads.slice(0, 8);

  return (
    <section
      className="relative mt-20 pt-0 pb-4 px-0 sm:pb-6 sm:px-4 rounded-none md:rounded-xl overflow-hidden"
      style={{ background: 'rgb(160, 165, 170)' }}
    >
      {/* Mobile: shallower wave */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none md:hidden"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 600"
      >
        <path
          d="M0,200 C360,160 720,240 1080,180 S1440,220 1440,200 L1440,600 L0,600 Z"
          fill="rgb(245, 245, 248)"
        />
      </svg>
      {/* Desktop: deeper wave */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 600"
      >
        <path
          d="M0,180 C360,80 720,280 1080,130 S1440,230 1440,180 L1440,600 L0,600 Z"
          fill="rgb(245, 245, 248)"
        />
      </svg>
      <div className="relative p-0 sm:pt-0 sm:pb-6 sm:px-6">
        <div className="mb-2 sm:mx-0">
          <HeroThreadsSection />
        </div>

        <div className="flex flex-col items-center space-y-2 px-3">
          {displayThreads.map((thread, idx) => (
            <Link
              key={thread._id}
              href={`/threads/views/${thread._id}`}
              className="inline-block py-2 px-4 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors bg-white/90"
            >
              <h3 className="text-sm sm:text-base font-medium text-gray-800 line-clamp-1">
                {idx + 1}. {thread.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ThreadsSection;
