'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchThreads,
  fetchThreadsByCategory,
  updateThreadFilter,
  clearThreadFilter,
} from '@/store/slices/filterThreadSlice';
import Pagination from '@/components/Pagination';
import Link from 'next/link';

const categoryOptions = [
  'Education', 'Migration', 'Travel', 'Jobs', 'Entertainment',
  'Hobbies', 'Baby & Children', 'Arts & Crafts', 'Cars & Vehicles',
  'Fashion & Accessories', 'Electronics & Computer', 'Home & Garden',
  'Miscellaneous', 'Pets', 'Real Estate', 'Party Hires & Services',
  'Sport & Fitness', 'Food & Catering Services', 'Health & Beauty',
  'Business & Shops', 'Events & Community', 'Services',
  'Travel Partner', 'financial aid'
];

const helpCategories = ['Travel Partner', 'financial aid'];

const ThreadsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const {
    threads,
    status,
    category,
    page,
    totalPages,
  } = useSelector((state) => state.filterThreads);

  const [filterMode, setFilterMode] = useState('categories');

  useEffect(() => {
    if (category) {
      dispatch(fetchThreadsByCategory());
    } else {
      dispatch(fetchThreads());
    }
  }, [dispatch, category, page]);

  const handleCategoryClick = (cat) => {
    dispatch(updateThreadFilter({ category: category === cat ? '' : cat, page: 1 }));
  };

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    dispatch(clearThreadFilter());
  };

  return (
    <div className="flex flex-col justify-center px-2">
      {/* ✅ Create New Thread Button */}
      <Link
        href="/threads/new"
        className="block my-2 p-2 mb-4 bg-blue-600 text-white lg:w-1/4 text-center rounded"
      >
        Create New Thread
      </Link>

      {/* ✅ Filter Mode Buttons */}
      <div className="flex justify-center gap-4 mb-4">
        {['categories', 'help'].map((mode) => (
          <button
            key={mode}
            onClick={() => handleFilterModeChange(mode)}
            className={`text-xs md:text-base p-1 rounded ${
              filterMode === mode
                ? 'bg-gray-300 text-gray-900 font-semibold'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {mode === 'categories' ? 'Browse All Topics' : 'Quick Help Filters'}
          </button>
        ))}
      </div>

      {/* ✅ Filter UI Based on Mode */}
      {filterMode === 'categories' && (
        <div className="justify-center mb-4 mx-auto">
          <div
            className="flex overflow-x-auto gap-2 py-2 w-[300px] md:w-[350px] lg:w-[600px] xl:w-[800px] 2xl:w-[800px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }}
          >
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-2 border rounded-lg shadow-md snap-start whitespace-nowrap text-xs font-semibold ${
                  category === cat ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {filterMode === 'help' && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {helpCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-2 border rounded shadow-sm text-sm font-medium ${
                category === cat ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ✅ Clear Filter Button */}
      {category && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => dispatch(clearThreadFilter())}
            className="text-xs md:text-base px-4 py-1 rounded bg-red-500 text-white hover:bg-red-600"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* ✅ Loading State */}
      {status === 'loading' && <p className="text-center text-gray-500">Loading threads...</p>}

      {/* ✅ Thread List */}
      {threads.length > 0 ? (
        <ul className="space-y-4">
          {threads.map((thread) => (
            <li
  key={thread._id}
  className="border rounded-lg p-4 hover:bg-gray-100 cursor-pointer"
  onClick={() => router.push(`/threads/views/${thread._id}`)}
>
  <div className="flex flex-col space-y-1">
    {/* 🔹 Row 1: Title + Comment count */}
    <div className="flex justify-between items-center">
      <h2 className="text-base font-semibold text-gray-900">{thread.title}</h2>
      <span
        className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap
          ${thread.commentCount > 0
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-500'}
        `}
      >
        💬 {thread.commentCount > 0
          ? `${thread.commentCount} comment${thread.commentCount > 1 ? 's' : ''}`
          : 'No comments'}
      </span>
    </div>

    {/* 🔹 Row 2: Question + Image */}
    <div className="flex justify-between items-start gap-2">
      <p className="text-sm text-gray-700 italic line-clamp-2 flex-1">
        {thread.question}
      </p>
      {thread.images?.[0]?.url && (
        <img
          src={thread.images[0].url}
          alt="Thread"
          className="w-16 h-16 object-cover rounded shrink-0"
        />
      )}
    </div>

    {/* 🔹 Row 3: Posted by */}
    <div>
      <p className="text-sm text-gray-500">
        Posted by {thread.owner?.name || 'Former Member'}
      </p>
    </div>
  </div>
</li>


          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">No threads available. Start a new discussion!</p>
      )}

      {/* ✅ Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(pageNum) =>
            dispatch(updateThreadFilter({ page: pageNum }))
          }
        />
      )}
    </div>
  );
};

export default ThreadsPage;
