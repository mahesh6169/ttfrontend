'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  searchDeals,
  fetchFilterOptions,
  toggleCategory,
  setLocation,
  setDay,
  updateFilter,
  clearAllFilters,
  updatePagination
} from '@/store/slices/dailydeals/searchDealsSlice';
import DealsGrid from '@/components/dailydeals/dealcomponents/DealsGrid';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import { FaGift } from 'react-icons/fa';

const libraries = ['places'];

const DAYS_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const DailyDealsPage = () => {
  const dispatch = useDispatch();
  const { filters, pagination, deals, meta, status, filterOptions } = useSelector(
    (state) => state.searchDeals
  );

  const [locationInput, setLocationInput] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(filters.searchText || '');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Temp filters for modal
  const [tempFilters, setTempFilters] = useState({});

  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'ending', label: 'Ending soon' },
    { value: 'oldest', label: 'Oldest first' }
  ];

  // Initialize temp filters when modal opens
  useEffect(() => {
    setTempFilters({
      categories: [...filters.categories],
      location: filters.location,
      state: filters.state || '',
      day: filters.day || '',
      sortBy: filters.sortBy
    });
    if (filters.location) {
      setLocationInput(filters.location.name || '');
    }
  }, [showFilters, filters]);

  // Fetch filter options on mount
  useEffect(() => {
    dispatch(fetchFilterOptions());
  }, [dispatch]);

  // Search whenever filters change
  useEffect(() => {
    dispatch(searchDeals());
  }, [filters, pagination.page, dispatch]);

  // Sync search text
  useEffect(() => {
    if (filters.searchText === '' && searchText !== '') {
      setSearchText('');
    }
  }, [filters.searchText]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(updateFilter({ filterType: 'searchText', value: searchText }));
  };

  const handleClearLocation = () => {
    dispatch(updateFilter({ filterType: 'location', value: null }));
    setLocationInput('');
  };

  const handleClearSearch = () => {
    dispatch(updateFilter({ filterType: 'searchText', value: '' }));
    setSearchText('');
  };

  const handleClearAllTempFilters = () => {
    setTempFilters({
      categories: [],
      location: null,
      state: '',
      day: '',
      sortBy: 'newest'
    });
    setLocationInput('');
    setSearchText('');
    dispatch(clearAllFilters());
  };

  const handleSortChange = (sortValue) => {
    dispatch(updateFilter({ filterType: 'sortBy', value: sortValue }));
    setShowSortMenu(false);
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === filters.sortBy);
    return option?.label || 'Newest first';
  };

  const applyFilters = () => {
    // Apply categories
    if (JSON.stringify(tempFilters.categories) !== JSON.stringify(filters.categories)) {
      filters.categories.forEach(cat => {
        if (!tempFilters.categories.includes(cat)) {
          dispatch(toggleCategory(cat));
        }
      });
      tempFilters.categories.forEach(cat => {
        if (!filters.categories.includes(cat)) {
          dispatch(toggleCategory(cat));
        }
      });
    }

    // Apply location
    if (tempFilters.location) {
      dispatch(setLocation(tempFilters.location));
    } else if (filters.location && !tempFilters.location) {
      dispatch(updateFilter({ filterType: 'location', value: null }));
    }

    // Apply state
    if (tempFilters.state !== filters.state) {
      dispatch(updateFilter({ filterType: 'state', value: tempFilters.state }));
    }

    // Apply day
    if (tempFilters.day !== filters.day) {
      dispatch(setDay(tempFilters.day));
    }

    // Apply sort
    dispatch(updateFilter({ filterType: 'sortBy', value: tempFilters.sortBy }));

    setShowFilters(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.location) count++;
    if (filters.state) count++;
    if (filters.day) count++;
    if (filters.searchText) count++;
    return count;
  };

  const getDayLabel = (dayValue) => {
    const day = DAYS_OPTIONS.find(d => d.value === dayValue);
    return day?.label || dayValue;
  };

  return (
    <div className="flex flex-col relative min-h-screen pb-8">
      {/* Modal Overlay */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowFilters(false)}
        ></div>
      )}

      {/* Filter Modal */}
      <div className={`fixed z-50 bg-white rounded-lg shadow-xl overflow-hidden
        w-full max-w-xl
        inset-y-0 right-0 sm:inset-y-auto sm:top-10 sm:bottom-10 sm:left-1/2 sm:right-auto sm:-translate-x-1/2
        transition-all duration-300 ease-in-out
        ${showFilters
          ? 'translate-x-0 sm:opacity-100 sm:scale-100 sm:pointer-events-auto'
          : 'translate-x-full sm:translate-x-0 sm:opacity-0 sm:scale-95 sm:pointer-events-none'}`}>

        <div className="h-full overflow-y-auto">
          {/* Modal Header */}
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
          <div className="flex-1 overflow-y-auto p-3 pb-20 sm:pb-3">
            {/* Day Filter */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Day of Week</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTempFilters({ ...tempFilters, day: '' })}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    !tempFilters.day
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Days
                </button>
                {DAYS_OPTIONS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => setTempFilters({ ...tempFilters, day: day.value })}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      tempFilters.day === day.value
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

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
                        setTempFilters({ ...tempFilters, state: state.code, location: null });
                        setLocationInput('');
                      }
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      tempFilters.state === state.code
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${tempFilters.location ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!!tempFilters.location}
                    title={state.name}
                  >
                    {state.code}
                  </button>
                ))}
              </div>
              {tempFilters.location && (
                <p className="text-xs text-gray-500 mt-2">Clear location to use state filter</p>
              )}
            </div>

            {/* Location Filter */}
            <div className={`mb-4 ${tempFilters.state ? 'opacity-50' : ''}`}>
              <h3 className="font-semibold text-gray-700 mb-3">Location</h3>
              {tempFilters.state && (
                <p className="text-xs text-gray-500 mb-2">Clear state selection to use location filter</p>
              )}
              <LoadScriptNext
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                libraries={libraries}
                onLoad={() => setIsScriptLoaded(true)}
              >
                <div className="relative">
                  <Autocomplete
                    onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)}
                    onPlaceChanged={() => {
                      if (autocomplete && !tempFilters.state) {
                        const place = autocomplete.getPlace();
                        if (place.geometry) {
                          const coordinates = [
                            place.geometry.location.lng(),
                            place.geometry.location.lat()
                          ];
                          const location = {
                            coordinates,
                            radius: tempFilters.location?.radius || 10,
                            name: place.formatted_address || 'Selected Location'
                          };
                          setTempFilters({ ...tempFilters, location, state: '' });
                          setLocationInput(place.formatted_address);
                        }
                      }
                    }}
                    options={{
                      componentRestrictions: { country: 'au' },
                      types: ['geocode']
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Enter Suburb & Radius of search..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!!tempFilters.state}
                    />
                  </Autocomplete>
                  {tempFilters.location && (
                    <button
                      onClick={() => {
                        setTempFilters({ ...tempFilters, location: null });
                        setLocationInput('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear location"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </LoadScriptNext>

              {tempFilters.location && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm text-gray-600">Search within:</label>
                    <span className="text-sm font-medium text-gray-700">{tempFilters.location.radius} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={tempFilters.location.radius || 10}
                    onChange={(e) => {
                      const radius = parseInt(e.target.value);
                      setTempFilters({
                        ...tempFilters,
                        location: { ...tempFilters.location, radius }
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>1 km</span>
                    <span>200 km</span>
                  </div>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Categories</h3>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                <div className="space-y-1 p-2">
                  {filterOptions.categories.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No categories available</p>
                  ) : (
                    filterOptions.categories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={tempFilters.categories?.includes(category) || false}
                          onChange={() => {
                            const currentCategories = tempFilters.categories || [];
                            const newCategories = currentCategories.includes(category)
                              ? currentCategories.filter(c => c !== category)
                              : [...currentCategories, category];
                            setTempFilters({ ...tempFilters, categories: newCategories });
                          }}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 focus:ring-2 transition-all"
                        />
                        <span className="ml-2 text-sm text-gray-700">{category}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              {tempFilters.categories?.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">{tempFilters.categories.length} selected</p>
              )}
            </div>
          </div>

          {/* Apply Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t sm:sticky">
            <button
              onClick={applyFilters}
              className="w-full bg-teal-700 text-lime-100 hover:bg-teal-800 hover:text-lime-50 py-3 rounded shadow font-semibold transition-colors"
            >
              Show results
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Header */}
        <div className="mt-4 mb-6 mx-3 sm:mx-4 rounded-xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] py-4 px-3 sm:px-4 shadow-[0_4px_15px_rgba(217,119,6,0.3)]">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <FaGift className="text-xl text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-md">Daily Deals</h1>
          </div>
          <p className="text-white/90 mt-1 text-sm text-center">Local deals and special offers</p>
        </div>

        {/* Search Bar with Sort/Filter buttons */}
        <div className="px-3 mb-3 sm:px-4 sm:mb-4">
          <form onSubmit={handleSearchSubmit} className="mb-3 md:max-w-md md:mx-auto">
            <div className="relative flex items-center">
              <svg
                className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search deals..."
                className="w-full pl-12 pr-14 py-3 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-1.5 bg-teal-600 text-white hover:bg-teal-700 p-2.5 rounded-full shadow-sm transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Filter and Sort buttons */}
          <div className="flex gap-2 md:gap-3 justify-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="font-medium">Filter</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-teal-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  {getActiveFilterCount()}
                </span>
              )}
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
                Active filters:
              </span>

              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-2 pb-1">
                  {filters.categories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {category}
                      <button
                        onClick={() => dispatch(toggleCategory(category))}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {filters.day && (
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                      Day: {getDayLabel(filters.day)}
                      <button
                        onClick={() => dispatch(setDay(''))}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="px-3 sm:px-4 mt-4">
          <DealsGrid deals={deals} dealStatus={status} />
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages}
              onPageChange={(pageNum) => dispatch(updatePagination({ page: pageNum }))}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyDealsPage;
