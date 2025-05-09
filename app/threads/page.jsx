'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
  updateThreadFilter, 
  fetchThreadsAll, 
  fetchThreadsByCategory, 
  fetchThreadsByCity,
  fetchThreadsCustomCategory,
  resetThreadFilters 
} from '@/store/slices/threads/filterThreadSlice';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';

const libraries = ['places'];

const MODES = [
  { label: 'All', value: 'all' },
  { label: 'Categories', value: 'categories' },
  { label: 'Cities', value: 'cities' },
  { label: 'Popular', value: 'customCategories' },
];

const categoryOptions = [
  'Education', 'Migration', 'Travel', 'Jobs', 'Entertainment', 'Hobbies',
  'Baby & Children', 'Arts & Crafts', 'Cars & Vehicles', 'Fashion & Accessories',
  'Electronics & Computer', 'Home & Garden', 'Miscellaneous', 'Pets',
  'Real Estate', 'Party Hires & Services', 'Sport & Fitness',
  'Food & Catering Services', 'Health & Beauty', 'Business & Shops',
  'Events & Community', 'Services', 'Travel Partner', 'financial aid'
];

const cityOptions = [
  { name: 'Sydney', coordinates: '151.2093,-33.8688' },
  { name: 'Melbourne', coordinates: '144.9631,-37.8136' },
  { name: 'Brisbane', coordinates: '153.0281,-27.4679' },
  { name: 'Perth', coordinates: '115.8605,-31.9505' },
  { name: 'Adelaide', coordinates: '138.6007,-34.9285' },
  { name: 'Hobart', coordinates: '147.3272,-42.8821' },
  { name: 'Darwin', coordinates: '130.8456,-12.4634' },
  { name: 'Canberra', coordinates: '149.1300,-35.2809' },
];

// Popular categories pre-selection
const POPULAR_CATEGORIES = [
  'Travel Partner',
  'financial aid',
];

const ThreadsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { mode, all, categories, cities, customCategories, threads, meta, status } = 
    useSelector((state) => state.filterThreads);
  const [locationInput, setLocationInput] = useState(all.locationInputText || '');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Get formatted date for display
  const getPostedText = (createdAt) => {
    const daysAgo = differenceInDays(new Date(), new Date(createdAt));
    if (daysAgo <= 10) {
      return daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    } else {
      return format(new Date(createdAt), 'dd MMM yyyy'); // e.g., 12 Apr 2025
    }
  };

  // Dispatcher based on selected mode
  useEffect(() => {
    if (mode === 'all') {
      dispatch(fetchThreadsAll());
    } else if (mode === 'categories') {
      dispatch(fetchThreadsByCategory());
    } else if (mode === 'cities') {
      dispatch(fetchThreadsByCity());
    } else if (mode === 'customCategories') {      
      dispatch(fetchThreadsCustomCategory());
    }
  }, [mode, all, categories, cities, customCategories, dispatch]);

  // Handle switching between filter modes
  const handleModeChange = (newMode) => {
    dispatch(resetThreadFilters(newMode));
    setLocationInput('');
  };

  // Google Places autocomplete handler
  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        dispatch(updateThreadFilter({
          mode: 'all',
          values: {
            location: `${coordinates.lng},${coordinates.lat}`,
            locationInputText: place.formatted_address,
          },
        }));
        setLocationInput(place.formatted_address);
      }
    }
  };

  // Clear all filters for current mode
  const handleClearFilters = () => {
    dispatch(resetThreadFilters(mode));
    setLocationInput('');
  };

  return (
    <div className="flex flex-col">
      <div className="my-2 px-4">
        <div className="flex justify-start">
          <Link
            href="/threads/new"
            className="bg-yellow-400 text-teal-700 hover:bg-teal-700 hover:text-lime-100 px-3 py-1.5 rounded-tr-xl rounded-bl-xl shadow-lg text-sm sm:text-base font-semibold transition duration-200"
          >
            Create New Topic
          </Link>
        </div>
      </div>

      {/* Discover Community Threads - Centered header with gradient background */}
      <div className="my-2 px-4 py-6 bg-gradient-to-br from-teal-950 to-teal-100 shadow-sm rounded-md flex justify-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-yellow-400 tracking-tight flex items-center gap-2 text-center animate-[pulsezoom_1.5s_ease-in-out_infinite]">
          <span>Ask</span>
          <span className="text-yellow-400">•</span>
          <span>Discuss</span>
          <span className="text-yellow-400">•</span>
          <span>Connect</span>
        </h1>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center mb-4 gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => handleModeChange(m.value)}
            className={`px-3 py-1 rounded text-xs sm:text-base font-semibold ${
              mode === m.value ? 'bg-teal-700 text-lime-100' : 'text-teal-700 hover:bg-lime-100'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Filters for ALL mode */}
      {mode === 'all' && (
        <div className="flex flex-col text-xs sm:text-base md:flex-row justify-center gap-4 mb-4 px-4">
          <select
            className="p-2 border rounded"
            value={all.category || ''}
            onChange={(e) =>
              dispatch(
                updateThreadFilter({
                  mode: 'all',
                  values: { category: e.target.value },
                })
              )
            }
          >
            <option value="">All Categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <LoadScriptNext
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            onLoad={() => setIsScriptLoaded(true)}
          >
            {isScriptLoaded ? (
              <Autocomplete
                onLoad={setAutocomplete}
                onPlaceChanged={handlePlaceChanged}
                options={{ componentRestrictions: { country: 'AU' } }}
              >
                <input
                  type="text"
                  placeholder="Enter location"
                  className="p-2 border rounded w-full md:w-96"
                  value={locationInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocationInput(val);
                    if (val === '')
                      dispatch(updateThreadFilter({ mode: 'all', values: { location: '' } }));
                  }}
                />
              </Autocomplete>
            ) : (
              <div className="p-2 w-full md:w-96 bg-gray-100 text-gray-500 rounded border">Loading map…</div>
            )}
          </LoadScriptNext>

          <input
            type="number"
            min="1"
            placeholder="Proximity (km)"
            className="p-2 border rounded"
            value={all.proximity || ''}
            onChange={(e) =>
              dispatch(updateThreadFilter({ 
                mode: 'all', 
                values: { proximity: parseInt(e.target.value) } 
              }))
            }
          />
        </div>
      )}

      {/* Filters for CATEGORIES mode */}
      {mode === 'categories' && (
        <div className="flex flex-col items-center mb-4 px-4">
          <div className="w-full max-w-5xl border rounded p-3 overflow-x-auto">
            <div
              className="grid grid-flow-col auto-cols-max gap-1 sm:gap-4"
              style={{ gridAutoRows: 'minmax(40px, auto)', minWidth: 'max-content' }}
            >
              {categoryOptions.map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-lime-100 rounded"
                >
                  <input
                    type="checkbox"
                    checked={categories.selectedCategories.includes(category)}
                    onChange={(e) => {
                      const selected = categories.selectedCategories.includes(category)
                        ? categories.selectedCategories.filter((c) => c !== category)
                        : [...categories.selectedCategories, category];
                      dispatch(
                        updateThreadFilter({
                          mode: 'categories',
                          values: { selectedCategories: selected },
                        })
                      );
                    }}
                  />
                  <span className="text-xs sm:text-base">{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters for Cities mode */}
      {mode === 'cities' && (
        <div className="flex flex-col items-center mb-4 px-4">
          <div className="w-full max-w-5xl border rounded p-3 overflow-x-auto">
            <div
              className="grid grid-flow-col auto-cols-max gap-1 sm:gap-4"
              style={{ gridAutoRows: 'minmax(40px, auto)', minWidth: 'max-content' }}
            >
              {cityOptions.map((city) => (
                <label
                  key={city.name}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-lime-100 rounded sm:p-2"
                >
                  <input
                    type="radio"
                    name="city-selection"
                    checked={cities.location === city.coordinates}
                    onChange={() =>
                      dispatch(
                        updateThreadFilter({
                          mode: 'cities',
                          values: { location: city.coordinates },
                        })
                      )
                    }
                  />
                  <span className="text-xs sm:text-base">{city.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters for Popular mode (custom categories) */}
      {mode === 'customCategories' && (
        <div className="flex flex-col items-center mb-4 px-4">
          <div className="w-full max-w-5xl border rounded p-3 overflow-x-auto">
            <div
              className="grid grid-flow-col auto-cols-max gap-1 sm:gap-4"
              style={{ gridAutoRows: 'minmax(40px, auto)', minWidth: 'max-content' }}
            >
              {POPULAR_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-lime-100 rounded sm:p-2"
                >
                  <input
                    type="checkbox"
                    checked={customCategories.selectedCategories.includes(category)}
                    onChange={() => {
                      const selected = customCategories.selectedCategories.includes(category)
                        ? customCategories.selectedCategories.filter((c) => c !== category)
                        : [...customCategories.selectedCategories, category];
                      dispatch(
                        updateThreadFilter({
                          mode: 'customCategories',
                          values: { selectedCategories: selected },
                        })
                      );
                    }}
                  />
                  <span className="text-xs sm:text-base">{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      <div className="flex justify-center mb-2">
        <button
          onClick={handleClearFilters}
          className="text-xs sm:text-base bg-red-500 text-white px-3 py-1 rounded"
        >
          Clear Filters
        </button>
      </div>

      {/* Thread Listing */}
      {status === 'loading' ? (
        <div className="text-center p-4">Loading threads...</div>
      ) : threads.length > 0 ? (
        <div className="space-y-4 px-4">
          {threads.map((thread) => (
  <div
    key={thread._id}
    className="border rounded-lg p-4 bg-gray-100 hover:bg-gray-200 cursor-pointer shadow-sm transition-colors duration-200"
    onClick={() => router.push(`/threads/views/${thread._id}`)}
  >
    <div className="flex justify-between items-start gap-4">
      {/* Left content */}
      <div className="flex-1 space-y-1">
        {/* Title + Question */}
        <div className="mb-2">
          <h2 className="text-sm sm:text-base font-bold text-gray-800">{thread.title}</h2>
          <p className="text-sm text-gray-600 italic line-clamp-2">{thread.question}</p>
        </div>

        {/* Row 1: owner + date */}
        <div className="flex flex-wrap gap-x-2 text-xs  text-gray-600 ">
          <span>{thread.ownerName || 'Former Member'}</span>
          <span>|</span>
          <span>{getPostedText(thread.createdAt)}</span>
        </div>

        

        {/* Comment count */}
        <div className="mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            thread.commentCount > 0 
              ? 'bg-teal-900 text-gray-100' 
              : 'bg-gray-300 text-gray-900'
          }`}>
            💬 {thread.commentCount > 0
              ? `${thread.commentCount} comment${thread.commentCount > 1 ? 's' : ''}`
              : 'No comments'}
          </span>
        </div>
      </div>

      {/* Right image */}
      {thread.images?.[0]?.url && (
        <img
          src={thread.images[0].url}
          alt="Thread"
          className=" w-16 h-16 sm:w-40 sm:h-20 object-cover rounded shrink-0"
        />
      )}
    </div>
  </div>
))}

        </div>
      ) : (
        <div className="text-center p-4 text-gray-500">No threads available. Start a new discussion!</div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          onPageChange={(pageNum) =>
            dispatch(updateThreadFilter({ 
              mode, 
              values: { page: pageNum } 
            }))
          }
        />
      )}
    </div>
  );
};

export default ThreadsPage;