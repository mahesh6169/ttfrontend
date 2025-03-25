'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchThreads,
  fetchThreadsByCategory,
  updateThreadFilter,
} from '@/store/slices/threadSlice';
import SelectSlider from '@/components/SelectSlider';
import Pagination from '@/components/Pagination';
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
          <SelectSlider
  className="w-[180px] text-xs md:text-base"
  options={['Browse by Category', ...categoryOptions]}
  value={category || 'Browse by Category'}
  onChange={(selected) => {
    const value = selected === 'Browse by Category' ? '' : selected;
    dispatch(updateFilter({ category: value }));
  }}
/>
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
  <Pagination
    currentPage={page}
    totalPages={totalPages}
    onPageChange={(pageNum) => dispatch(updateThreadFilter({ page: pageNum }))}
  />
)}


    </div>
  );
};

export default ThreadsPage;
