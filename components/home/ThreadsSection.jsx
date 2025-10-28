'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import PromoBanner from '../PromoBanner';

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
      <section className="py-3 px-2 sm:py-6 sm:px-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-2xl font-bold text-teal-700">Recent Discussions</h2>
            <Link href="/threads" className="text-xs sm:text-base text-teal-600 hover:text-teal-700 font-medium">
              View All →
            </Link>
          </div>
          <p className="text-center text-gray-500 py-8">No discussions available</p>
        </div>
      </section>
    );
  }

  const displayThreads = threads.slice(0, 8);

  return (
    <section className="py-2 px-2 sm:py-3 sm:px-4">
      <div className="border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-6">
        <div className="mb-3 sm:mb-5">
          <div className="flex items-center gap-1.5 sm:gap-3 mb-2">
            <h2 className="text-lg sm:text-2xl font-bold text-teal-700 min-w-0 truncate">Recent Discussions</h2>
            <div className="flex gap-1.5 sm:gap-3 flex-shrink-0 ml-auto">
              <Link 
                href="/threads/new" 
                onClick={handleCreateClick}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors text-center whitespace-nowrap"
              >
                Start Discussion
              </Link>
              <Link 
                href="/threads" 
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 border border-teal-600 text-teal-600 hover:bg-teal-50 text-xs sm:text-sm font-medium rounded-md transition-colors text-center whitespace-nowrap"
              >
                View All →
              </Link>
            </div>
          </div>
          
          <div>
            <PromoBanner page="threads" inline={true} showAll={true} />
          </div>
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
