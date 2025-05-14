'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  searchAdverts, 
  fetchFilterOptions,
  toggleCategory,
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

const libraries = ['places'];

const AdvertsPage = () => {
  const dispatch = useDispatch();
  const { filters, pagination, adverts, meta, status, error, filterOptions } = useSelector((state) => state.searchAdverts);
  
  // Local state for UI
  const [locationInput, setLocationInput] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(filters.searchText || '');
  

  // Initial load - fetch filter options
  useEffect(() => {
    dispatch(fetchFilterOptions())
      .unwrap()
      .catch((error) => {
        toast.error('Failed to load filter options');
      });
  }, [dispatch]);

  // Search whenever filters change
  useEffect(() => {
    dispatch(searchAdverts());
  }, [filters, pagination.page, dispatch]);

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const coordinates = [
          place.geometry.location.lng(),
          place.geometry.location.lat()
        ];
        dispatch(setLocation({ 
          coordinates, 
          radius: 10,
          name: place.formatted_address || 'Selected Location' // Add name
        }));
        setLocationInput(place.formatted_address);
      }
    }
  };

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
    setSearchText(''); // This already exists, good
  };

  useEffect(() => {
    setSearchText(filters.searchText || '');
  }, [filters.searchText]);

  useEffect(() => {
    if (status === 'failed' && error) {
      toast.error(error.message || error || 'An error occurred');
    }
  }, [status, error]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.location) count++;
    if (filters.searchText) count++;
    if (filters.priceRange) count++;
    if (filters.adType) count++;
    return count;
  };

  return (
    <div className="flex flex-col">
      {/* Post Advert Button */}
      <div className="my-1 px-3 sm:my-2 sm:px-4">
        <div className="flex justify-start">
          <Link
            href="/adverts/add"
            className="bg-yellow-400 text-teal-700 hover:bg-teal-700 hover:text-lime-100 px-2 py-1 text-xs rounded-tr-lg rounded-bl-lg shadow-lg font-semibold transition duration-200 sm:px-3 sm:py-1.5 sm:text-sm sm:rounded-tr-xl sm:rounded-bl-xl md:text-base"
          >
            Post Advert
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="my-1 px-3 py-4 bg-gradient-to-br from-teal-950 to-teal-100 shadow-sm rounded-md flex justify-center sm:my-2 sm:px-4 sm:py-6">
        <h1 className="text-lg font-extrabold text-yellow-400 tracking-tight flex items-center gap-1 text-center animate-[pulsezoom_1.5s_ease-in-out_infinite] sm:text-xl sm:gap-2 md:text-2xl lg:text-3xl">
          <span>Sell</span>
          <span className="text-yellow-400">•</span>
          <span>Buy</span>
          <span className="text-yellow-400">•</span>
          <span>Advertise</span>
        </h1>
      </div>

      {/* Main Search Bar */}
      <div className="px-3 mb-3 sm:px-4 sm:mb-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-1 sm:gap-2 sm:max-w-2xl sm:mx-auto">
          <input
            type="text"
            placeholder="Search adverts..."
            className="flex-1 p-1.5 border rounded-md text-xs sm:p-2 sm:rounded-lg sm:text-sm md:text-base"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            type="submit"
            className="bg-teal-700 text-white px-3 py-1.5 rounded-md hover:bg-teal-800 transition text-xs sm:px-4 sm:py-2 sm:rounded-lg sm:text-sm md:text-base"
          >
            Search
          </button>
          {filters.searchText && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="bg-gray-200 text-gray-700 px-2 py-1.5 rounded-md hover:bg-gray-300 transition text-xs sm:px-3 sm:py-2 sm:rounded-lg sm:text-sm"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Filter Toggle Button */}
      <div className="px-3 mb-3 flex justify-center sm:px-4 sm:mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 bg-teal-700 text-white px-3 py-1.5 rounded-md hover:bg-teal-800 transition text-xs sm:gap-2 sm:px-4 sm:py-2 sm:rounded-lg sm:text-sm md:text-base"
        >
          <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="bg-yellow-400 text-teal-700 px-1.5 py-0.5 rounded-full text-xs font-bold sm:px-2 sm:py-1">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-gradient-to-b from-gray-50 to-white border-y">
          <div className="p-3 sm:p-4 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              
              {/* Categories Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:col-span-2 lg:col-span-1">
                <h3 className="font-semibold text-gray-700 text-sm mb-3 sm:text-base">Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.categories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center space-x-1.5 cursor-pointer hover:bg-teal-50 p-1.5 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={() => dispatch(toggleCategory(category))}
                        className="w-3 h-3 text-teal-600 focus:ring-teal-500 rounded sm:w-4 sm:h-4"
                      />
                      <span className="text-xs text-gray-700 sm:text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                <h3 className="font-semibold text-gray-700 text-sm mb-3 sm:text-base">Location</h3>
                <div className="space-y-2">
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
                          className="w-full p-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                        />
                      </Autocomplete>
                    ) : (
                      <div className="w-full p-2 bg-gray-100 text-gray-500 rounded-md border text-xs sm:text-sm">
                        Loading map…
                      </div>
                    )}
                  </LoadScriptNext>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Radius"
                      className="flex-1 p-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                      value={filters.location ? filters.location.radius : ''}
                      onChange={(e) => {
                        if (filters.location) {
                          const inputValue = e.target.value;
                          const radius = inputValue === '' ? '' : parseInt(inputValue) || 10;
                          dispatch(setLocation({
                            ...filters.location,
                            radius: radius
                          }));
                        }
                      }}
                      onBlur={(e) => {
                        if (filters.location && (e.target.value === '' || e.target.value < 1)) {
                          dispatch(setLocation({
                            ...filters.location,
                            radius: 10
                          }));
                        }
                      }}
                      disabled={!filters.location}
                    />
                    <span className="text-xs text-gray-600 sm:text-sm">km</span>
                    {filters.location && (
                      <button
                        onClick={handleClearLocation}
                        className="bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-md hover:bg-gray-300 transition text-xs sm:text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Ad Type & Sort Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                <div className="space-y-4">
                  {/* Ad Type */}
                  <div>
                    <h3 className="font-semibold text-gray-700 text-sm mb-2 sm:text-base">Ad Type</h3>
                    <div className="flex gap-3">
                      {['All', 'Offered', 'Wanted'].map((type) => (
                        <label key={type} className="flex-1">
                          <input
                            type="radio"
                            name="adType"
                            checked={type === 'All' ? !filters.adType : filters.adType === type.toLowerCase()}
                            onChange={() => dispatch(updateFilter({ 
                              filterType: 'adType', 
                              value: type === 'All' ? null : type.toLowerCase() 
                            }))}
                            className="sr-only"
                          />
                          <div className={`text-center py-1.5 px-2 rounded-md cursor-pointer transition-colors text-xs sm:text-sm ${
                            (type === 'All' && !filters.adType) || filters.adType === type.toLowerCase()
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}>
                            {type}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <h3 className="font-semibold text-gray-700 text-sm mb-2 sm:text-base">Sort By</h3>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                      value={filters.sortBy}
                      onChange={(e) => dispatch(updateFilter({ filterType: 'sortBy', value: e.target.value }))}
                    >
                      {filterOptions.sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear All Filters Button */}
            <div className="mt-4 text-center">
              <button
                onClick={() => dispatch(clearAllFilters())}
                className="bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600 transition text-xs sm:px-5 sm:py-2 sm:text-sm"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="px-3 py-2 bg-teal-50 sm:px-4 sm:py-3">
          <div className="flex flex-wrap gap-1.5 items-center sm:gap-2">
            <span className="text-xs text-gray-600 font-medium sm:text-sm">Active filters:</span>
            
            {filters.categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1 bg-white border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full text-xs sm:px-3 sm:py-1"
              >
                {category}
                <button
                  onClick={() => dispatch(toggleCategory(category))}
                  className="hover:text-teal-900 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
            
            {filters.location && (
              <span className="inline-flex items-center gap-1 bg-white border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full text-xs sm:px-3 sm:py-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {filters.location.radius}km from {filters.location.name.split(',')[0]}
                <button
                  onClick={handleClearLocation}
                  className="hover:text-teal-900 font-bold"
                >
                  ×
                </button>
              </span>
            )}

            {filters.searchText && (
              <span className="inline-flex items-center gap-1 bg-white border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full text-xs sm:px-3 sm:py-1">
                Search: "{filters.searchText}"
                <button
                  onClick={handleClearSearch}
                  className="hover:text-teal-900 font-bold"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Advert Listing */}
      <div className="px-3 sm:px-4">
        <AdvertList adverts={adverts} advertStatus={status} />
      </div>

      {/* Pagination */}
      <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
        <Pagination
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          onPageChange={(pageNum) => 
            dispatch(updatePagination({ page: pageNum }))
          }
        />
      </div>
    </div>
  );
};

export default AdvertsPage;