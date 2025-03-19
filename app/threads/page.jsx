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
  'Studying in Australia',
  'Living in Australia',
  'Working in Australia',
  'Migration',
  'Travel',
  'Jobs',
  'Baby & Children',
  'Antiques, Art & Collectables',
  'Books, Music & Games',
  'Cars & Vehicles',
  'Clothing & Jewellery',
  'Community',
  'Electronics & Computer',
  'Home & Garden',
  'Miscellaneous',
  'Pets',
  'Real Estate',
  'Services For Hire',
  'Sport & Fitness',
  'Restaurants and Cloud Kitchens',
  'Health & Beauty',
  'Education & Learning',
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
    <div className="mt-12 p-4">
      <h1 className="text-2xl font-bold mb-4">Threads</h1>

      {/* ✅ Create New Thread Button */}
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/threads/new"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Create New Thread
        </Link>

        {/* ✅ Filter Mode Toggle */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterMode('recent')}
            className={`px-4 py-2 rounded-lg ${
              filterMode === 'recent' ? 'bg-black text-white' : 'bg-gray-200'
            }`}
          >
            Browse Recently Added
          </button>
          <select
            onChange={handleCategoryChange}
            value={category}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Browse by Category</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
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
              <h2 className="text-lg font-semibold">{thread.title}</h2>
              <p className="text-sm text-gray-700 italic">{thread.question}</p>
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
        <div className="flex justify-center mt-4 space-x-4">
          <button
            disabled={page === 1}
            onClick={() => dispatch(updateThreadFilter({ page: page - 1 }))}
            className={`px-4 py-2 border rounded-lg ${
              page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
            }`}
          >
            Previous
          </button>
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
