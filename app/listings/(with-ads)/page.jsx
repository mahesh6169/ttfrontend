'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  searchAdverts,
  fetchFilterOptions,
  toggleCategory,
  toggleSubcategory,
  setLocation,
  updateFilter,
  clearAllFilters,
  updatePagination
} from '@/store/slices/adverts/searchAdvertsSlice';
import AdvertList from '@/components/adverts/advertcomponents/AdvertList';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import PromoBanner from '@/components/PromoBanner';
import HeroListingSection from '@/components/adverts/HeroListingSection';
import { CATEGORIES } from '@/components/adverts/fieldSystem/Categories';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const libraries = ['places'];

const AdvertsPage = () => {
  const dispatch = useDispatch();
  const { filters, pagination, adverts, meta, status, error, filterOptions } = useSelector((state) => state.searchAdverts);
  
  // Local state for UI
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(filters.searchText || '');

  // Ref for scrolling to results on mobile
  const resultsRef = useRef(null);

  // Hero section - category and location picker
  const [heroParentCategory, setHeroParentCategory] = useState('');
  const [heroSubcategory, setHeroSubcategory] = useState('');
  const [heroLocationInput, setHeroLocationInput] = useState('');
  const [heroAutocomplete, setHeroAutocomplete] = useState(null);
  const [heroLocation, setHeroLocation] = useState(null);

  // Get subcategories for selected parent category
  const heroSubcategories = heroParentCategory
    ? CATEGORIES.find(c => c.label === heroParentCategory)?.subcategories || []
    : [];

  // Clear subcategory when parent changes
  const handleParentCategoryChange = (value) => {
    setHeroParentCategory(value);
    setHeroSubcategory(''); // Reset subcategory when parent changes
  };

  
  // Modal filter states
  const [tempFilters, setTempFilters] = useState({});

  //Add state for sort menu
const [showSortMenu, setShowSortMenu] = useState(false);

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  // Add more options in the future
  // { value: 'price_low', label: 'Price: low to high' },
  // { value: 'price_high', label: 'Price: high to low' },
  // { value: 'distance', label: 'Distance' },
];

  // Initialize temporary filters
  useEffect(() => {
    setTempFilters({
      subcategories: [...filters.subcategories],
      state: filters.state || '',
      adType: filters.adType,
      sortBy: filters.sortBy,
    });
  }, [showFilters, filters]);

  // Initial load - fetch filter options
  useEffect(() => {
    dispatch(fetchFilterOptions())
      .unwrap()
      .catch((error) => {
        console.error('Failed to load filter options:', error);
      });
  }, [dispatch]);

  // Search whenever filters change
  useEffect(() => {
    dispatch(searchAdverts());
  }, [filters, pagination.page, dispatch]);

  // Sync local searchText with Redux state when filters are cleared
  useEffect(() => {
    if (filters.searchText === '' && searchText !== '') {
      setSearchText('');
    }
  }, [filters.searchText]);

  // Sync hero category with Redux filters - reset when cleared from active filters
  useEffect(() => {
    // Reset parent category if it's no longer in filters
    if (heroParentCategory && !filters.categories.includes(heroParentCategory)) {
      setHeroParentCategory('');
    }
    // Reset subcategory if it's no longer in filters
    if (heroSubcategory && !filters.subcategories.includes(heroSubcategory)) {
      setHeroSubcategory('');
    }
  }, [filters.categories, filters.subcategories]);

  // Sync hero location with Redux filters - reset when location is cleared from active filters
  useEffect(() => {
    if (!filters.location && heroLocation) {
      setHeroLocation(null);
      setHeroLocationInput('');
    }
  }, [filters.location]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(updateFilter({ filterType: 'searchText', value: searchText }));
  };

  const handleClearLocation = () => {
    dispatch(updateFilter({ filterType: 'location', value: null }));
    setHeroLocation(null);
    setHeroLocationInput('');
  };

  const handleClearSearch = () => {
    dispatch(updateFilter({ filterType: 'searchText', value: '' }));
    setSearchText('');
  };

  // Hero section Go button handler
  const handleHeroGo = () => {
    // Clear existing filters first
    dispatch(clearAllFilters());

    // Apply category filter
    if (heroParentCategory) {
      // Always add parent category when selected
      dispatch(toggleCategory(heroParentCategory));

      // Also add subcategory if selected
      if (heroSubcategory) {
        dispatch(toggleSubcategory(heroSubcategory));
      }
    }

    // Apply location if selected
    if (heroLocation) {
      dispatch(setLocation(heroLocation));
    }

    // Scroll to results on mobile after a short delay
    setTimeout(() => {
      if (resultsRef.current && window.innerWidth < 768) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Hero section Clear button handler
  const handleHeroClear = () => {
    // Clear hero selections
    setHeroParentCategory('');
    setHeroSubcategory('');
    setHeroLocation(null);
    setHeroLocationInput('');
    // Clear Redux filters
    dispatch(clearAllFilters());
  };


  // Hero location place changed handler
  const handleHeroPlaceChanged = () => {
    if (heroAutocomplete) {
      const place = heroAutocomplete.getPlace();
      if (place.geometry) {
        const coordinates = [
          place.geometry.location.lng(),
          place.geometry.location.lat()
        ];
        setHeroLocation({
          coordinates,
          radius: 10,
          name: place.formatted_address || 'Selected Location'
        });
        setHeroLocationInput(place.formatted_address);
      }
    }
  };

  // Modal functions
  const handleClearAllTempFilters = () => {
    // Clear all temporary filters
    setTempFilters({
      categories: [],
      state: '',
      adType: null,
      sortBy: 'newest',
    });
    // Clear the search text
    setSearchText('');

    // Apply the clear action immediately to Redux
    dispatch(clearAllFilters());
  };

//  function to handle sort changes
const handleSortChange = (sortValue) => {
  dispatch(updateFilter({ filterType: 'sortBy', value: sortValue }));
  setShowSortMenu(false);
};

//current sort label for display
const getCurrentSortLabel = () => {
  const option = sortOptions.find(opt => opt.value === filters.sortBy);
  return option?.label || 'Newest first';
};

  const applyFilters = () => {
    // Apply all temporary filters to the store
    if (JSON.stringify(tempFilters.subcategories) !== JSON.stringify(filters.subcategories)) {
      filters.subcategories.forEach(cat => {
        if (!tempFilters.subcategories.includes(cat)) {
          dispatch(toggleSubcategory(cat));
        }
      });
      tempFilters.subcategories.forEach(cat => {
        if (!filters.subcategories.includes(cat)) {
          dispatch(toggleSubcategory(cat));
        }
      });
    }

    // Apply state filter
    if (tempFilters.state !== filters.state) {
      dispatch(updateFilter({ filterType: 'state', value: tempFilters.state }));
    }

    // Apply ad type and sort
    dispatch(updateFilter({ filterType: 'adType', value: tempFilters.adType }));
    dispatch(updateFilter({ filterType: 'sortBy', value: tempFilters.sortBy }));

    setShowFilters(false);
  };

  useEffect(() => {
    setSearchText(filters.searchText || '');
  }, [filters.searchText]);

  useEffect(() => {
    if (status === 'failed' && error) {
      console.error('Search failed:', error.message || error || 'An error occurred');
    }
  }, [status, error]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.subcategories.length > 0) count++;
    if (filters.location) count++;
    if (filters.state) count++;
    if (filters.searchText) count++;
    if (filters.adType) count++;
    return count;
  };

  // Check if there are any hero selections or active filters to clear
  const hasFiltersToShow = heroParentCategory || heroLocation || getActiveFilterCount() > 0;

  const getTotalResults = () => {
    return meta.totalRecords || adverts.length;
  };

  return (
    <div className="flex flex-col relative min-h-[calc(100vh-180px)]">
      {/* Modal Overlay */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowFilters(false)}
        ></div>
      )}

      {/* Filter Modal - Mobile and Desktop Overlay */}
      <div className={`fixed z-50 bg-white rounded-lg shadow-xl
        w-full max-w-xl
        inset-y-0 right-0
        sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[85vh]
        transition-all duration-300 ease-in-out
        overflow-y-auto
        ${showFilters
          ? 'translate-x-0 sm:opacity-100 sm:scale-100 sm:pointer-events-auto'
          : 'translate-x-full sm:translate-x-0 sm:opacity-0 sm:scale-95 sm:pointer-events-none'}`}>

          {/* Modal Header - Sticky */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-white border-b z-10">
            <h2 className="text-lg font-semibold">Filters</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAllTempFilters}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-xl text-gray-600 hover:text-gray-800 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="p-3">
            {/* State Filter */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">State</h3>
              <div className="grid grid-cols-4 gap-2">
                {AUSTRALIAN_STATES.map(state => (
                  <button
                    key={state.code}
                    onClick={() => {
                      if (tempFilters.state === state.code) {
                        setTempFilters({ ...tempFilters, state: '' });
                      } else {
                        setTempFilters({ ...tempFilters, state: state.code });
                      }
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      tempFilters.state === state.code
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={state.name}
                  >
                    {state.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Ad Type */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Ad Type</h3>
              <div className="flex gap-2">
                {['All', 'Offered', 'Wanted'].map((type) => (
                  <label key={type} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors flex-1">
                    <input
                      type="radio"
                      name="adType"
                      checked={type === 'All' ? !tempFilters.adType : tempFilters.adType === type.toLowerCase()}
                      onChange={() => {
                        const value = type === 'All' ? null : type.toLowerCase();
                        setTempFilters({ ...tempFilters, adType: value });
                      }}
                      className="w-4 h-4 text-teal-600 focus:ring-teal-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Apply Button - Sticky */}
          <div className="sticky bottom-0 p-3 bg-white border-t flex justify-center">
            <button
              onClick={applyFilters}
              className="px-8 py-2 bg-teal-700 text-lime-100 hover:bg-teal-800 hover:text-lime-50 text-sm rounded shadow font-semibold transition-colors"
            >
              Show results
            </button>
          </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Hero Banner */}
        {/* <div className="my-4 px-4">
          <div className="bg-white border-2 border-teal-700 p-6 rounded-lg shadow">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center">
              <span className="text-amber-500">Find</span>
              <span className="text-teal-700 mx-2">•</span>
              <span className="text-teal-700">Offer</span>
              <span className="text-teal-700 mx-2">•</span>
              <span className="text-amber-500">Reach</span>
            </h1>
            <p className="text-gray-600 text-center text-sm mt-2">Connect with your community</p>
          </div>
        </div> */}

        {/* Hero Section with two-tone curved container */}
        <section
          className="relative mt-2 md:mt-4 mb-4 mx-0 sm:mx-4 pt-0 pb-4 px-0 sm:pb-6 rounded-none sm:rounded-xl overflow-hidden"
          style={{ background: 'rgb(180, 210, 130)' }}
        >
          {/* Wave layer 1 - Medium green */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,50 C150,100 300,0 500,50 C700,100 850,0 1000,50 L1000,400 L0,400 Z"
                fill="rgb(205, 225, 160)"
              />
            </svg>
          </div>

          {/* Wave layer 2 - Lightest green */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,80 C200,130 400,30 600,80 C800,130 900,30 1000,80 L1000,400 L0,400 Z"
                fill="rgb(235, 245, 193)"
              />
            </svg>
          </div>

          <div className="relative p-0 sm:pt-0 sm:pb-2 sm:px-4">
            <HeroListingSection showViewAll={false} showCreate={false} compact={true} />
          </div>

          {/* Category & Location Picker inside the curved container */}
          <div className="relative px-3 sm:px-6 -mt-2 md:mt-0 pb-4">
            <div className="md:max-w-3xl md:mx-auto">
              {/* Mobile Layout - Stacked */}
              <div className="flex flex-col gap-2 md:hidden">
                {/* Post Listing Button */}
                <Link
                  href="/listings/add"
                  className="self-start bg-[#f0f7d4] hover:bg-[#e8f2c1] text-teal-900 text-sm font-bold py-2 px-4 rounded-full shadow-sm transition-colors"
                >
                  + Post Listing
                </Link>

                {/* Parent Category Dropdown */}
                <Listbox value={heroParentCategory} onChange={handleParentCategoryChange}>
                  <div className="relative">
                    <ListboxButton className="relative w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all cursor-pointer text-left">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className={heroParentCategory ? 'text-gray-900' : 'text-gray-500'}>
                        {heroParentCategory || 'Select Category'}
                      </span>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </ListboxButton>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions
                        anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                        className="z-50 w-[var(--button-width)] max-h-[var(--anchor-max-height,15rem)] overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
                      >
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                All Categories
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                        {CATEGORIES.map((group) => (
                          <ListboxOption
                            key={group.label}
                            value={group.label}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {group.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>

                {/* Subcategory Dropdown - always visible, disabled when no parent */}
                <Listbox value={heroSubcategory} onChange={setHeroSubcategory} disabled={!heroParentCategory}>
                  <div className="relative">
                    <ListboxButton className={`relative w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-left ${heroParentCategory ? 'bg-white cursor-pointer' : 'bg-gray-100 cursor-not-allowed'}`}>
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className={heroSubcategory ? 'text-gray-900' : 'text-gray-500'}>
                        {heroSubcategory || (heroParentCategory ? 'Select Subcategory' : 'Select category first')}
                      </span>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </ListboxButton>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions
                        anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                        className="z-50 w-[var(--button-width)] max-h-[var(--anchor-max-height,15rem)] overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
                      >
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                All in {heroParentCategory}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                        {heroSubcategories.map((subcat) => (
                          <ListboxOption
                            key={subcat}
                            value={subcat}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {subcat}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>

                {/* Location Autocomplete */}
                <LoadScriptNext
                  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  libraries={libraries}
                  onLoad={() => setIsScriptLoaded(true)}
                  loadingElement={
                    <div className="relative">
                      <div className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-full animate-pulse">
                        <div className="h-5 bg-gray-300 rounded w-32"></div>
                      </div>
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  }
                >
                  <div className="relative">
                    <Autocomplete
                      onLoad={(autocompleteInstance) => setHeroAutocomplete(autocompleteInstance)}
                      onPlaceChanged={handleHeroPlaceChanged}
                      options={{
                        componentRestrictions: { country: 'au' },
                        types: ['geocode']
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Enter suburb or city"
                        value={heroLocationInput}
                        onChange={(e) => setHeroLocationInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </Autocomplete>
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </LoadScriptNext>

                {/* Radius Slider - shows when location is selected */}
                {heroLocation && (
                  <div className="flex items-center gap-2 px-3 -mt-1">
                    <span className="text-xs text-gray-600">1km</span>
                    <input
                      type="range"
                      min="1"
                      max="200"
                      value={heroLocation.radius}
                      onChange={(e) => setHeroLocation({ ...heroLocation, radius: parseInt(e.target.value) })}
                      className="flex-1 h-1 bg-white/60 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-teal-600
                        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                    />
                    <span className="text-xs text-gray-600 min-w-[40px] text-right">{heroLocation.radius}km</span>
                  </div>
                )}

                {/* Go and Clear Buttons */}
                <div className="flex gap-2 self-start">
                  <button
                    onClick={handleHeroGo}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-8 rounded-full shadow-sm transition-colors"
                  >
                    Go
                  </button>
                  {hasFiltersToShow && (
                    <button
                      onClick={handleHeroClear}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow-sm transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Layout - Inline */}
              <div className="hidden md:flex items-center gap-3">
                {/* Post Listing Button */}
                <Link
                  href="/listings/add"
                  className="bg-[#f0f7d4] hover:bg-[#e8f2c1] text-teal-900 text-sm font-bold py-2.5 px-5 rounded-full shadow-sm transition-colors whitespace-nowrap"
                >
                  + Post Listing
                </Link>

                {/* Parent Category Dropdown */}
                <Listbox value={heroParentCategory} onChange={handleParentCategoryChange}>
                  <div className="relative flex-1 max-w-[200px]">
                    <ListboxButton className="relative w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all cursor-pointer text-left">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className={`block truncate ${heroParentCategory ? 'text-gray-900' : 'text-gray-500'}`}>
                        {heroParentCategory || 'Category'}
                      </span>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </ListboxButton>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions
                        anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                        className="z-50 w-72 max-h-[var(--anchor-max-height,15rem)] overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
                      >
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                All Categories
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                        {CATEGORIES.map((group) => (
                          <ListboxOption
                            key={group.label}
                            value={group.label}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {group.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>

                {/* Subcategory Dropdown - always visible, disabled when no parent */}
                <Listbox value={heroSubcategory} onChange={setHeroSubcategory} disabled={!heroParentCategory}>
                  <div className="relative w-[260px]">
                    <ListboxButton className={`relative w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-left ${heroParentCategory ? 'bg-white cursor-pointer' : 'bg-gray-100 cursor-not-allowed'}`}>
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className={`block truncate ${heroSubcategory ? 'text-gray-900' : 'text-gray-500'}`}>
                        {heroSubcategory || (heroParentCategory ? 'Subcategory' : 'Select category first')}
                      </span>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </ListboxButton>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions
                        anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                        className="z-50 w-72 max-h-[var(--anchor-max-height,15rem)] overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
                      >
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                All in {heroParentCategory}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                        {heroSubcategories.map((subcat) => (
                          <ListboxOption
                            key={subcat}
                            value={subcat}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {subcat}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>

                {/* Location Autocomplete */}
                <LoadScriptNext
                  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  libraries={libraries}
                  onLoad={() => setIsScriptLoaded(true)}
                  loadingElement={
                    <div className="relative w-[280px]">
                      <div className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-full animate-pulse">
                        <div className="h-5 bg-gray-300 rounded w-32"></div>
                      </div>
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  }
                >
                  <div className="relative w-[280px]">
                    <Autocomplete
                      onLoad={(autocompleteInstance) => setHeroAutocomplete(autocompleteInstance)}
                      onPlaceChanged={handleHeroPlaceChanged}
                      options={{
                        componentRestrictions: { country: 'au' },
                        types: ['geocode']
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Enter suburb or city"
                        value={heroLocationInput}
                        onChange={(e) => setHeroLocationInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </Autocomplete>
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </LoadScriptNext>

              </div>

              {/* Go and Clear Buttons - Desktop (separate row) */}
              <div className="hidden md:flex justify-center gap-2 mt-2">
                <button
                  onClick={handleHeroGo}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-1.5 px-6 rounded-full shadow-sm transition-colors whitespace-nowrap"
                >
                  Go
                </button>
                {hasFiltersToShow && (
                  <button
                    onClick={handleHeroClear}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-sm py-1.5 px-4 rounded-full shadow-sm transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Radius Slider - Desktop */}
              {heroLocation && (
                <div className="hidden md:flex mt-2 items-center justify-center gap-2 max-w-md mx-auto">
                  <span className="text-xs text-gray-600">1km</span>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={heroLocation.radius}
                    onChange={(e) => setHeroLocation({ ...heroLocation, radius: parseInt(e.target.value) })}
                    className="flex-1 h-1 bg-white/60 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-teal-600
                      [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                  />
                  <span className="text-xs text-gray-600 min-w-[40px] text-right">{heroLocation.radius}km</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Page Controls - Sort and Filter */}
        <div ref={resultsRef} className="px-3 mb-3 sm:px-4 sm:mb-4">
          {/* Page Controls - Sort and Filter */}
          <div className="flex gap-2 md:gap-3 justify-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="font-medium">Filter</span>
            </button>

            <div className="relative">
  <button
    className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
    onClick={() => setShowSortMenu(!showSortMenu)}
  >
    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
    <span className="font-medium">Sort: {getCurrentSortLabel()}</span>
  </button>

  {/* Sort dropdown menu */}
  {showSortMenu && (
    <>
      <div
        className="fixed inset-0 z-20"
        onClick={() => setShowSortMenu(false)}
      ></div>
      <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200 py-1">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
              filters.sortBy === option.value ? 'bg-gray-50 font-medium' : ''
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  )}
</div>
          </div>
        </div>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div className="bg-gray-50 border-y">
            <div className="px-3 py-3 sm:px-4 flex items-center gap-3 max-w-full">
              <span className="text-sm text-gray-600 font-medium whitespace-nowrap flex-shrink-0">
                Active Filters ({getActiveFilterCount()}):
              </span>

              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-2 pb-1">
                  {/* Show parent categories */}
                  {filters.categories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-1 bg-teal-50 border border-teal-300 text-teal-800 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {category}
                      <button
                        onClick={() => dispatch(toggleCategory(category))}
                        className="hover:text-teal-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {/* Show subcategories */}
                  {filters.subcategories.map((subcategory) => (
                    <span
                      key={subcategory}
                      className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {subcategory}
                      <button
                        onClick={() => dispatch(toggleSubcategory(subcategory))}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {filters.state && (
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                      State: {filters.state}
                      <button
                        onClick={() => dispatch(updateFilter({ filterType: 'state', value: '' }))}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.location && (
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {filters.location.radius}km from {filters.location.name.split(',')[0]}
                      <button
                        onClick={handleClearLocation}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.searchText && (
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                      Search: "{filters.searchText}"
                      <button
                        onClick={handleClearSearch}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.adType && (
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                      Type: {filters.adType}
                      <button
                        onClick={() => dispatch(updateFilter({ filterType: 'adType', value: null }))}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advert Listing */}
        <div className="px-3 sm:px-4 mt-4">
          <AdvertList adverts={adverts} advertStatus={status} />
        </div>

        {/* Pagination */}
        <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
          <Pagination
            currentPage={meta.currentPage}
            totalPages={meta.totalPages}
            onPageChange={(pageNum) => {
              dispatch(updatePagination({ page: pageNum }));
              // Scroll to results section
              setTimeout(() => {
                if (resultsRef.current) {
                  resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvertsPage;