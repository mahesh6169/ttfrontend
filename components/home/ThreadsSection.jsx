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
      <section className="py-2 px-2 sm:py-3 sm:px-4">
        <div className="rounded-lg sm:rounded-xl p-3 sm:p-6">
          <div className="mb-2 -mx-3 sm:mx-0">
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
    <section className="py-2 px-2 sm:py-3 sm:px-4">
      <div className="rounded-lg sm:rounded-xl p-3 sm:p-6">
        <div className="mb-2 -mx-3 sm:mx-0">
          <HeroThreadsSection />
        </div>

        <div className="space-y-2">
          {displayThreads.map((thread, idx) => (
            <Link 
              key={thread._id} 
              href={`/threads/views/${thread._id}`}
              className="block py-2 px-3 hover:bg-gray-50 border border-gray-100 rounded-md transition-colors"
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
