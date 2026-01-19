'use client';

import Link from 'next/link';
import { FaComments, FaArrowRight } from 'react-icons/fa';

const ThreadsSection = ({ threads }) => {
  if (!threads || threads.length === 0) {
    return (
      <section className="py-4 px-3 sm:py-6 sm:px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-teal-800">Forum Discussions</h2>
          <Link
            href="/threads"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
          >
            View All <FaArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <FaComments className="text-3xl text-gray-400" />
          <span className="text-sm text-gray-500">No discussions at the moment</span>
        </div>
      </section>
    );
  }

  const displayThreads = threads.slice(0, 8);

  return (
    <section className="py-4 px-3 sm:py-6 sm:px-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-teal-800">Forum Discussions</h2>
        <Link
          href="/threads"
          className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
        >
          View All <FaArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Threads List */}
      <div className="flex flex-col space-y-2">
        {displayThreads.map((thread, idx) => (
          <Link
            key={thread._id}
            href={`/threads/views/${thread._id}`}
            className="block py-2 px-4 hover:bg-gray-50 rounded-md transition-colors"
          >
            <h3 className="text-sm sm:text-base font-medium text-gray-800 line-clamp-1">
              {idx + 1}. {thread.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ThreadsSection;
