'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchThreads,
  fetchThreadsByCategory,
  updateThreadFilter,
  clearThreadFilter,
} from '@/store/slices/threads/filterThreadSlice';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';

/* 🟢 Centralized Config */
const modesConfig = {
  categories: {
    label: 'Browse All Topics',
    categories: [
      'Education', 'Migration', 'Travel', 'Jobs', 'Entertainment', 'Hobbies',
      'Baby & Children', 'Arts & Crafts', 'Cars & Vehicles', 'Fashion & Accessories',
      'Electronics & Computer', 'Home & Garden', 'Miscellaneous', 'Pets',
      'Real Estate', 'Party Hires & Services', 'Sport & Fitness',
      'Food & Catering Services', 'Health & Beauty', 'Business & Shops',
      'Events & Community', 'Services', 'Travel Partner', 'financial aid'
    ],
  },
  popular: {
    label: 'Popular Topics',
    categories: ['Travel Partner', 'financial aid'],
  },
  // Example: Add sports in future
  // sports: { label: 'Sports Topics', categories: ['Cricket', 'Football'] },
};

const ThreadsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { threads, status, category, page, totalPages } = useSelector((state) => state.filterThreads);
  const [filterMode, setFilterMode] = useState('categories');
  const allowedCategories = modesConfig[filterMode].categories;

  const getPostedText = (createdAt) => {
    const daysAgo = differenceInDays(new Date(), new Date(createdAt));
    if (daysAgo <= 10) {
      return daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    } else {
      return format(new Date(createdAt), 'dd MMM yyyy'); // e.g., 12 Apr 2025
    }
  };

/* 🔄 Load data */
useEffect(() => {
  if (filterMode === 'categories') {
    if (category) {
      dispatch(fetchThreadsByCategory());
    } else {
      dispatch(fetchThreads());
    }
  } else {
    // In 'popular' or other modes, always use fetchThreadsByCategory (since we want filtering)
    dispatch(fetchThreadsByCategory());
  }
}, [dispatch, category, page, filterMode]);

  /* 🟢 Handle Category Click */
  const handleCategoryClick = (cat) => {
    const isSelected = category === cat;
  
    if (filterMode === 'categories') {
      // Normal toggle logic for Browse All
      dispatch(updateThreadFilter({ category: isSelected ? '' : cat, page: 1 }));
    } else {
      // For Popular / Sports / Any group-based mode
      dispatch(
        updateThreadFilter({
          category: isSelected ? modesConfig[filterMode].categories : cat, 
          page: 1,
        })
      );
    }
  };
  

 /* 🟢 Handle Mode Switch */
const handleFilterModeChange = (mode) => {
  setFilterMode(mode);
  dispatch(clearThreadFilter());

  // If it's 'categories' (Browse All), fetch all
  if (mode === 'categories') {
    dispatch(fetchThreads());
  } else {
    // If it's popular (or any other future group), fetch threads by these categories
    dispatch(updateThreadFilter({ category: modesConfig[mode].categories, page: 1 }));
  }
};

  return (
    <div className="flex flex-col justify-center px-2">
      {/* 🟢 Create Thread */}
      <Link href="/threads/new" className="block my-2 p-2 mb-4 bg-blue-600 text-white lg:w-1/4 text-center rounded">
        Create New Thread
      </Link>

      {/* 🟢 Mode Switch */}
      <div className="flex justify-center gap-4 mb-4">
        {Object.keys(modesConfig).map((mode) => (
          <button
            key={mode}
            onClick={() => handleFilterModeChange(mode)}
            className={`text-xs md:text-base p-1 rounded ${filterMode === mode ? 'bg-gray-300 text-gray-900 font-semibold' : 'bg-gray-100 text-gray-800'}`}
          >
            {modesConfig[mode].label}
          </button>
        ))}
      </div>

      {/* 🟢 Subcategories */}
      <div className={`flex ${filterMode === 'popular' ? 'flex-wrap justify-center' : 'overflow-x-auto'} gap-2 py-2 mb-4`}>
        {allowedCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-3 py-2 border rounded-lg shadow-md whitespace-nowrap text-xs font-semibold ${category === cat ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 🟢 Clear Filter */}
      {category && (
        <div className="flex justify-center mb-4">
          <button
  onClick={() => {
    dispatch(clearThreadFilter());
    setFilterMode('categories'); // ✅ Switch back to Browse All Topics
    dispatch(fetchThreads());    // ✅ Reload all threads
  }}
  className="text-xs md:text-base px-4 py-1 rounded bg-red-500 text-white hover:bg-red-600"
>
  Clear Filter
</button>

        </div>
      )}

      {/* 🟢 Threads */}
      {status === 'loading' ? (
        <p className="text-center text-gray-500">Loading threads...</p>
      ) : threads.length > 0 ? (
        <ul className="space-y-4">
          {threads.map((thread) => (
            <li
              key={thread._id}
              className="border rounded-lg p-4 hover:bg-gray-100 cursor-pointer"
              onClick={() => router.push(`/threads/views/${thread._id}`)}
            >
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-semibold text-gray-900">{thread.title}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${thread.commentCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    💬 {thread.commentCount > 0 ? `${thread.commentCount} comment${thread.commentCount > 1 ? 's' : ''}` : 'No comments'}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm text-gray-700 italic line-clamp-2 flex-1">{thread.question}</p>
                  {thread.images?.[0]?.url && (
                    <img src={thread.images[0].url} alt="Thread" className="w-16 h-16 object-cover rounded shrink-0" />
                  )}
                </div>
                <div className="flex justify-start items-center text-sm text-gray-500 ">
  <p>Posted by: {thread.owner?.name || 'Former Member'}</p>
  <p className="ml-3">| Posted: {getPostedText(thread.createdAt)}</p>
  {thread.category && <p className="ml-3">| Category: {thread.category}</p>}
</div>

              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">No threads available. Start a new discussion!</p>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={(pageNum) => dispatch(updateThreadFilter({ page: pageNum }))} />
      )}
    </div>
  );
};

export default ThreadsPage;
