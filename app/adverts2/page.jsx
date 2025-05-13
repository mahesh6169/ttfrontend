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

const libraries = ['places'];

const AdvertsPage = () => {
  const dispatch = useDispatch();
  const { filters, adverts, meta, status, filterOptions } = useSelector((state) => state.searchAdverts);
  
  // Local state for UI
  const [locationInput, setLocationInput] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(filters.searchText || '');
  

  // Initial load - fetch filter options
  useEffect(() => {
    dispatch(fetchFilterOptions());
  }, [dispatch]);

  // Search whenever filters change
  useEffect(() => {
    dispatch(searchAdverts());
  }, [filters, meta.currentPage, dispatch]);

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
      <div className="my-2 px-4">
        <div className="flex justify-start">
          <Link
            href="/adverts/add"
            className="bg-yellow-400 text-teal-700 hover:bg-teal-700 hover:text-lime-100 px-3 py-1.5 rounded-tr-xl rounded-bl-xl shadow-lg text-sm sm:text-base font-semibold transition duration-200"
          >
            Post Advert
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="my-2 px-4 py-6 bg-gradient-to-br from-teal-950 to-teal-100 shadow-sm rounded-md flex justify-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-yellow-400 tracking-tight flex items-center gap-2 text-center animate-[pulsezoom_1.5s_ease-in-out_infinite]">
          <span>Sell</span>
          <span className="text-yellow-400">•</span>
          <span>Buy</span>
          <span className="text-yellow-400">•</span>
          <span>Advertise</span>
        </h1>
      </div>

      {/* Main Search Bar */}
      <div className="px-4 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search adverts..."
            className="flex-1 p-2 border rounded-lg text-sm sm:text-base"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            type="submit"
            className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition text-sm sm:text-base"
          >
            Search
          </button>
          {filters.searchText && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Filter Toggle Button */}
      <div className="px-4 mb-4 flex justify-center">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition text-sm sm:text-base"
        >
          <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="bg-yellow-400 text-teal-700 px-2 py-1 rounded-full text-xs font-bold">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-gray-50 p-4 mb-4 border-t border-b">
          <div className="max-w-6xl mx-auto space-y-4">
            
            {/* Categories */}
            <div>
              <h3 className="font-semibold mb-2 text-gray-700">Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filterOptions.categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-lime-100 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => dispatch(toggleCategory(category))}
                    />
                    <span className="text-xs sm:text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-semibold mb-2 text-gray-700">Location</h3>
              <div className="flex gap-2 items-end">
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
                        className="p-2 border rounded w-full sm:w-96 text-sm sm:text-base"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                      />
                    </Autocomplete>
                  ) : (
                    <div className="p-2 w-full sm:w-96 bg-gray-100 text-gray-500 rounded border">
                      Loading map…
                    </div>
                  )}
                </LoadScriptNext>
                
                <input
  type="number"
  min="1"
  placeholder="Radius (km)"
  className="p-2 border rounded w-24 text-sm sm:text-base"
  value={filters.location ? filters.location.radius : ''}
  onChange={(e) => {
    if (filters.location) {
      const inputValue = e.target.value;
      // Allow empty string temporarily while typing
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
                
{filters.location && (
  <button
    onClick={handleClearLocation}
    className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 transition text-sm"
  >
    Clear
  </button>
)}           
              </div>
            </div>

            {/* Ad Type */}
            <div>
              <h3 className="font-semibold mb-2 text-gray-700">Ad Type</h3>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adType"
                    checked={filters.adType === 'offered'}
                    onChange={() => dispatch(updateFilter({ filterType: 'adType', value: 'offered' }))}
                  />
                  <span className="text-sm">Offered</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adType"
                    checked={filters.adType === 'wanted'}
                    onChange={() => dispatch(updateFilter({ filterType: 'adType', value: 'wanted' }))}
                  />
                  <span className="text-sm">Wanted</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adType"
                    checked={!filters.adType}
                    onChange={() => dispatch(updateFilter({ filterType: 'adType', value: null }))}
                  />
                  <span className="text-sm">All</span>
                </label>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="font-semibold mb-2 text-gray-700">Sort By</h3>
              <select
                className="p-2 border rounded text-sm sm:text-base"
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

            {/* Clear All Filters */}
            <div className="flex justify-center">
              <button
                onClick={() => dispatch(clearAllFilters())}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition text-sm sm:text-base"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="px-4 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Active filters:</span>
            
            {filters.categories.map((category) => (
              <span
                key={category}
                className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs flex items-center gap-1"
              >
                {category}
                <button
                  onClick={() => dispatch(toggleCategory(category))}
                  className="hover:text-teal-900"
                >
                  ×
                </button>
              </span>
            ))}
            
            
            
            {filters.location && (
  <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs flex items-center gap-1">
    {filters.location.name}: {filters.location.radius}km radius
    <button
      onClick={handleClearLocation}
      className="hover:text-teal-900"
    >
      ×
    </button>
  </span>
)}

            {filters.searchText && (
              <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                Search: "{filters.searchText}"
                <button
                  onClick={handleClearSearch}
                  className="hover:text-teal-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Advert Listing */}
      <div className="px-4">
        <AdvertList adverts={adverts} advertStatus={status} />
      </div>

      {/* Pagination */}
      <div className="mt-6 mb-4">
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