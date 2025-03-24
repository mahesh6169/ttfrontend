'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchThreads,
  fetchThreadsByCategory,
  updateThreadFilter,
} from '@/store/slices/threadSlice';
import Link from 'next/link';

const categoryOptions = [
  'Education',
  'Migration',
  'Travel',
  'Jobs',
  'Entertainment',
  'Hobbies',
  'Baby & Children',
  'Arts & Crafts',
  'Cars & Vehicles',
  'Fashion & Accessories',
  'Electronics & Computer',
  'Home & Garden',
  'Miscellaneous',
  'Pets',
  'Real Estate',
  'Party Hires & Services',
  'Sport & Fitness',
  'Food & Catering Services',
  'Health & Beauty',
  'Business & Shops',
  'Events & Community',
  'Services',
];

const ThreadsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { threads, status, category, page, totalPages } = useSelector(
    (state) => state.threads
  );
  const [filterMode, setFilterMode] = useState('recent'); // 'recent' or 'category'

  useEffect(() => {
    if (filterMode === 'recent') {
      dispatch(fetchThreads());
    } else {
      dispatch(fetchThreadsByCategory());
    }
  }, [dispatch, filterMode, category, page]);

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    dispatch(updateThreadFilter({ category: selectedCategory, page: 1 }));
    setFilterMode('category');
  };

  return (
    <div className="flex flex-col justify-centre">

      {/* ✅ Create New Thread Button */}
        <Link
          href="/threads/new"
          className="block my-2 p-2 mb-4 bg-blue-600 text-white lg:w-1/4 text-center rounded"
        >
          Create New Thread
        </Link>

        {/* ✅ Filter Mode Toggle */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setFilterMode('recent')}
            className={`text-xs md:text-base p-1 rounded ${
              filterMode === 'recent' ? 'bg-black text-white' : 'bg-gray-200'
            }`}
          >
            Browse Recently Added
          </button>
          <select
            onChange={handleCategoryChange}
            value={category}
            className="text-xs md:text-base p-1 rounded"
          >
            <option value="">Browse by Category</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>


      {/* ✅ Loading State */}
      {status === 'loading' && <p>Loading threads...</p>}

      {/* ✅ Thread List */}
      {threads.length > 0 ? (
        <ul className="space-y-4">
          {threads.map((thread) => (
            <li
              key={thread._id}
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-100"
              onClick={() => router.push(`/threads/${thread._id}`)}
            >
              <h2 className="text-base font-semibold">{thread.title}</h2>
              <p className="text-sm text-gray-700 italic line-clamp-2">{thread.question}</p>
              <p className="text-sm text-gray-500">
                Started by {thread.owner?.name || 'Former Member'}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No threads available. Start a new discussion!</p>
      )}

      {/* ✅ Pagination Controls */}
      {totalPages > 1 && (
  <div className="flex justify-center mt-4 space-x-2">
    {/* Previous Button */}
    <button
      disabled={page === 1}
      onClick={() => dispatch(updateThreadFilter({ page: page - 1 }))}
      className={`px-4 py-2 border rounded-lg ${
        page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
      }`}
    >
      Previous
    </button>

    {/* Page Number Buttons */}
    {Array.from({ length: totalPages }, (_, index) => {
      const pageNumber = index + 1;
      return (
        <button
          key={pageNumber}
          onClick={() => dispatch(updateThreadFilter({ page: pageNumber }))}
          className={`px-4 py-2 border rounded-lg ${
            pageNumber === page
              ? 'bg-black text-white'
              : 'hover:bg-gray-200'
          }`}
        >
          {pageNumber}
        </button>
      );
    })}

    {/* Next Button */}
    <button
      disabled={page === totalPages}
      onClick={() => dispatch(updateThreadFilter({ page: page + 1 }))}
      className={`px-4 py-2 border rounded-lg ${
        page === totalPages
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-gray-200'
      }`}
    >
      Next
    </button>
  </div>
)}
    </div>
  );
};

export default ThreadsPage;
