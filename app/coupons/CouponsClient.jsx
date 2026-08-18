'use client';

import React, { useEffect, useState, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  searchCoupons,
  fetchFilterOptions,
  updateFilter,
  setLocation,
  clearAllFilters,
  updatePagination
} from '@/store/slices/coupons/searchCouponsSlice';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import CouponGrid from '@/components/coupons/couponcomponents/CouponGrid';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { toast } from 'react-toastify';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import axios from '@/utils/axiosConfig';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';
import { getParentForSubcategory } from '@/components/coupons/storeCategories';

const libraries = ['places'];

// Client body of the /coupons landing (split out of the old page.jsx so the page can be a
// server component that owns metadata + SSR pre-fill). `initialData` ({ campaigns, meta }) is
// the server-fetched default first page; it seeds the grid on first paint (default view only)
// so the server HTML has real campaigns, then Redux takes over after mount.
const DiscountCodePage = ({ heading, initialData = null }) => {
  const dispatch = useDispatch();
  const { filters, pagination, campaigns, meta, status, filterOptions } = useSelector((state) => state.searchCoupons);

  const [locationInput, setLocationInput] = useState(filters.location?.name || '');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({ state: filters.state || '' });

  const sortOptions = [
    { value: 'latest', label: 'Latest' },
    { value: 'expiring', label: 'Expiring soon' },
  ];

  const selectedCategory = filters.categories[0] || '';
  const selectedSubcategory = filters.subcategories[0] || '';
  // Only offer subcategories (from live stores) that belong to the chosen parent
  const subcategoryOptions = selectedCategory
    ? (filterOptions.subcategories || []).filter((s) => getParentForSubcategory(s) === selectedCategory)
    : [];
  const hasActiveFilters = filters.categories.length > 0 || filters.subcategories.length > 0 || !!filters.location || !!filters.state;

  // Fetch filter options (categories) on mount
  useEffect(() => {
    dispatch(fetchFilterOptions());
  }, [dispatch]);

  // Search whenever filters or page change
  useEffect(() => {
    dispatch(searchCoupons());
  }, [filters, pagination.page, dispatch]);

  // Sync temp filters with the store each time the modal opens
  useEffect(() => {
    if (showFilters) {
      setTempFilters({ state: filters.state || '' });
    }
  }, [showFilters, filters.state]);

  // Keep the location input text in sync with the location filter
  useEffect(() => {
    if (!filters.location) {
      setLocationInput('');
    } else if (filters.location.name) {
      setLocationInput(filters.location.name);
    }
  }, [filters.location]);

  // Hero fields — apply immediately
  const handleCategoryChange = (value) => {
    dispatch(updateFilter({ filterType: 'categories', value: value ? [value] : [] }));
    // Changing the parent clears any selected subcategory
    dispatch(updateFilter({ filterType: 'subcategories', value: [] }));
  };

  const handleSubcategoryChange = (value) => {
    dispatch(updateFilter({ filterType: 'subcategories', value: value ? [value] : [] }));
  };

  const handlePlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (place?.geometry) {
      const coordinates = [
        place.geometry.location.lng(),
        place.geometry.location.lat()
      ];
      dispatch(setLocation({
        coordinates,
        radius: filters.location?.radius || 10,
        name: place.formatted_address || 'Selected Location'
      }));
      setLocationInput(place.formatted_address || '');
    }
  };

  const handleRadiusChange = (radius) => {
    if (!filters.location) return;
    dispatch(setLocation({ ...filters.location, radius }));
  };

  const handleClearLocation = () => {
    dispatch(updateFilter({ filterType: 'location', value: null }));
    setLocationInput('');
  };

  // Filter modal — State applies on "Show results"
  const applyFilters = () => {
    dispatch(updateFilter({ filterType: 'state', value: tempFilters.state }));
    setShowFilters(false);
  };

  const handleClearTempFilters = () => {
    setTempFilters({ state: '' });
  };

  const handleClearAll = () => {
    dispatch(clearAllFilters());
    setLocationInput('');
  };

  const handleSortChange = (sortValue) => {
    dispatch(updateFilter({ filterType: 'sortBy', value: sortValue }));
    setShowSortMenu(false);
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === filters.sortBy);
    return option?.label || 'Latest';
  };

  const handleGenerateCode = async (campaignId) => {
    try {
      const response = await axios.post(`/coupons/campaigns/${campaignId}/generate-code`);

      if (response.data.success) {
        toast.success('Code generated successfully!');
        dispatch(searchCoupons());
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please login to get coupon');
      } else {
        toast.error(error.response?.data?.message || 'Failed to generate code');
      }
    }
  };

  const isLoading = status === 'loading' || status === 'idle';

  // SSR pre-fill bridge: on the default view, before Redux has loaded, render the
  // server-provided initialData so the grid is in the server HTML and there is no skeleton
  // flash. Once Redux resolves (status succeeded/failed) we switch to the live store data.
  const isDefaultView =
    filters.categories.length === 0 && filters.subcategories.length === 0 &&
    !filters.location && !filters.state && !filters.searchText &&
    filters.sortBy === 'latest' && pagination.page === 1;
  const useInitial =
    !!initialData && isDefaultView && (status === 'idle' || status === 'loading') && campaigns.length === 0;
  const displayCampaigns = useInitial ? (initialData.campaigns || []) : campaigns;
  const displayMeta = useInitial ? (initialData.meta || meta) : meta;
  const showSkeleton = isLoading && !useInitial;

  return (
    <div className="flex flex-col relative">
      {/* Filter modal overlay */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowFilters(false)}
        ></div>
      )}

      {/* Filter modal */}
      <div className={`fixed z-50 bg-white rounded-lg shadow-xl
        w-full max-w-xl
        inset-y-0 right-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[85vh]
        transition-all duration-300 ease-in-out overflow-y-auto
        ${showFilters
          ? 'translate-x-0 sm:opacity-100 sm:scale-100 sm:pointer-events-auto'
          : 'translate-x-full sm:translate-x-0 sm:opacity-0 sm:scale-95 sm:pointer-events-none'}`}>
        <div className="h-full overflow-y-auto flex flex-col">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b border-slate-200 z-10">
            <h2 className="text-xl font-semibold text-slate-900">Filters</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleClearTempFilters}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-xl text-teal-700 hover:text-teal-800 font-bold leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-3">State</h3>
              <div className="grid grid-cols-4 gap-2">
                {AUSTRALIAN_STATES.map((s) => (
                  <button
                    key={s.code}
                    onClick={() =>
                      setTempFilters((t) => ({ ...t, state: t.state === s.code ? '' : s.code }))
                    }
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      tempFilters.state === s.code
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={s.name}
                  >
                    {s.code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 p-3 bg-white border-t border-slate-200 flex justify-center">
            <button
              onClick={applyFilters}
              className="px-8 py-2 bg-teal-700 text-white hover:bg-teal-800 text-sm rounded-lg shadow-sm font-semibold transition-colors"
            >
              Show results
            </button>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-2 sm:gap-3">
        {/* Page heading (server-rendered, passed from the server page) */}
        {heading}

        {/* Hero fields: Category + Location + radius (apply immediately) */}
        <div className="w-full max-w-[920px] mx-auto flex flex-col gap-2 sm:gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2 sm:gap-3">
            {/* Category */}
            <div className="flex-1 md:max-w-[340px]">
              <Listbox value={selectedCategory} onChange={handleCategoryChange}>
                <div className="relative">
                  <ListboxButton className="relative w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-left">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className={selectedCategory ? 'text-slate-900' : 'text-slate-500'}>
                      {selectedCategory || 'All Categories'}
                    </span>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </ListboxButton>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <ListboxOptions
                      anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                      className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                    >
                      <ListboxOption value="" className={({ active }) => `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`}>
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>All Categories</span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </span>
                            )}
                          </>
                        )}
                      </ListboxOption>
                      {filterOptions.categories.map((catOption) => (
                        <ListboxOption key={catOption} value={catOption} className={({ active }) => `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`}>
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{catOption}</span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
            </div>

            {/* Subcategory (enabled once a category is picked) */}
            <div className="flex-1 md:max-w-[340px]">
              <Listbox value={selectedSubcategory} onChange={handleSubcategoryChange} disabled={!selectedCategory}>
                <div className="relative">
                  <ListboxButton className="relative w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-left disabled:bg-slate-50 disabled:cursor-not-allowed">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className={selectedSubcategory ? 'text-slate-900' : 'text-slate-500'}>
                      {selectedSubcategory || (selectedCategory ? 'All Subcategories' : 'Select category first')}
                    </span>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </ListboxButton>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <ListboxOptions
                      anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                      className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                    >
                      <ListboxOption value="" className={({ active }) => `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`}>
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>All Subcategories</span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </span>
                            )}
                          </>
                        )}
                      </ListboxOption>
                      {subcategoryOptions.map((subOption) => (
                        <ListboxOption key={subOption} value={subOption} className={({ active }) => `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`}>
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{subOption}</span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
            </div>

            {/* Location */}
            <div className="flex-1 md:max-w-[460px]">
              <LoadScriptNext
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                libraries={libraries}
                onLoad={() => setIsScriptLoaded(true)}
                loadingElement={
                  <div className="relative">
                    <div className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg animate-pulse">
                      <div className="h-4 bg-slate-300 rounded w-32"></div>
                    </div>
                  </div>
                }
              >
                <div className="relative">
                  <Autocomplete
                    onLoad={(instance) => setAutocomplete(instance)}
                    onPlaceChanged={handlePlaceChanged}
                    options={{ componentRestrictions: { country: 'au' }, types: ['geocode'] }}
                  >
                    <input
                      type="text"
                      placeholder="Enter suburb or city"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </Autocomplete>
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {filters.location && (
                    <button
                      onClick={handleClearLocation}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Clear location"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </LoadScriptNext>
            </div>
          </div>

          {/* Radius slider (only when a location is chosen) - width matched to the location field */}
          {filters.location && (
            <div className="flex flex-col md:flex-row md:items-center gap-2 sm:gap-3">
              <div className="hidden md:block flex-1 md:max-w-[340px]" aria-hidden="true"></div>
              <div className="hidden md:block flex-1 md:max-w-[340px]" aria-hidden="true"></div>
              <div className="flex-1 md:max-w-[460px] flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={filters.location.radius || 10}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-600
                    [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                />
                <span className="text-xs text-slate-600 min-w-[40px] text-right">{filters.location.radius || 10}km</span>
              </div>
            </div>
          )}
        </div>

        {/* Filter + Sort controls */}
        <div className="flex gap-2 md:gap-3 justify-center">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-xs md:text-sm text-slate-900"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Filter</span>
            {filters.state && (
              <span className="bg-teal-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">1</span>
            )}
          </button>

          <div className="relative">
            <button
              className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-xs md:text-sm text-slate-900"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span>Sort: {getCurrentSortLabel()}</span>
            </button>

            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)}></div>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-slate-200 py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors ${
                        filters.sortBy === option.value ? 'bg-slate-50 font-medium' : ''
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

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              className="flex-shrink-0 border border-slate-300 text-slate-600 hover:bg-slate-100 text-[11px] md:text-sm font-medium py-1 px-3 md:py-1.5 md:px-4 rounded-full transition-colors"
            >
              Clear
            </button>

            <div className="flex-1 min-w-0 overflow-x-auto">
              <div className="flex gap-2 pb-1">
                {selectedCategory && (
                  <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                    {selectedCategory}
                    <button onClick={() => handleCategoryChange('')} className="hover:text-slate-900 font-bold p-0.5 -mr-0.5">×</button>
                  </span>
                )}

                {selectedSubcategory && (
                  <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                    {selectedSubcategory}
                    <button onClick={() => handleSubcategoryChange('')} className="hover:text-slate-900 font-bold p-0.5 -mr-0.5">×</button>
                  </span>
                )}

                {filters.state && (
                  <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                    State: {filters.state}
                    <button onClick={() => dispatch(updateFilter({ filterType: 'state', value: '' }))} className="hover:text-slate-900 font-bold p-0.5 -mr-0.5">×</button>
                  </span>
                )}

                {filters.location && (
                  <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {(filters.location.radius || 10)}km from {filters.location.name.split(',')[0]}
                    <button onClick={handleClearLocation} className="hover:text-slate-900 font-bold p-0.5 -mr-0.5">×</button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mt-1">
          {showSkeleton ? (
            <PageSkeleton variant="card" rows={8} />
          ) : status === 'failed' ? (
            <ErrorState onRetry={() => dispatch(searchCoupons())} />
          ) : displayCampaigns.length === 0 ? (
            <EmptyState
              title="No coupons found"
              description="Try adjusting your filters or search."
            />
          ) : (
            <CouponGrid
              campaigns={displayCampaigns}
              campaignStatus={useInitial ? 'succeeded' : status}
              onGenerateCode={handleGenerateCode}
            />
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
          <Pagination
            currentPage={displayMeta.currentPage}
            totalPages={displayMeta.totalPages}
            onPageChange={(pageNum) =>
              dispatch(updatePagination({ page: pageNum }))
            }
          />
        </div>
      </section>
    </div>
  );
};

export default DiscountCodePage;
