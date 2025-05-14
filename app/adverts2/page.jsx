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
  const [showFilters, setShowFilters] = useState(false); // Used for modal
  const [searchText, setSearchText] = useState(filters.searchText || '');
  
  // Modal filter states
  const [tempFilters, setTempFilters] = useState({});
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  // Initialize temporary filters
  useEffect(() => {
    setTempFilters({
      categories: [...filters.categories],
      location: filters.location,
      searchText: filters.searchText,
      adType: filters.adType,
      sortBy: filters.sortBy,
    });
    // Set location input when filter modal opens
    if (filters.location) {
      setLocationInput(filters.location.name || '');
    }
  }, [showFilters, filters]);

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
          name: place.formatted_address || 'Selected Location'
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
    setSearchText('');
  };

  // Modal functions
  const handleClearAllTempFilters = () => {
    setTempFilters({
      categories: [],
      location: null,
      searchText: '',
      adType: null,
      sortBy: 'newest',
    });
    setLocationInput(''); // Clear the location input
  };

  const applyFilters = () => {
    // Apply all temporary filters to the store
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
    
    // Apply location filter
    if (tempFilters.location) {
      dispatch(setLocation(tempFilters.location));
    } else if (filters.location && !tempFilters.location) {
      dispatch(updateFilter({ filterType: 'location', value: null }));
    }
    
    // Apply ad type
    dispatch(updateFilter({ filterType: 'adType', value: tempFilters.adType }));
    dispatch(updateFilter({ filterType: 'sortBy', value: tempFilters.sortBy }));
    
    setShowFilters(false);
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
    if (filters.adType) count++;
    return count;
  };

  const getTotalResults = () => {
    return meta.totalRecords || adverts.length;
  };

  return (
    <div className="flex flex-col relative">
      {/* Modal Overlay */}
      {showFilters && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 z-40"
    onClick={() => setShowFilters(false)}
  ></div>
)}

      {/* Filter Modal - Mobile and Desktop Overlay */}
      <div className={`fixed z-50 bg-white sm:rounded-lg overflow-y-auto
  w-full inset-y-0 right-0 sm:inset-0 sm:mx-auto sm:max-w-xl sm:top-20 sm:bottom-auto sm:shadow-lg
  transition-all duration-300 ease-in-out
  ${showFilters 
    ? 'translate-x-0 sm:opacity-100 sm:scale-100 sm:pointer-events-auto' 
    : 'translate-x-full sm:translate-x-0 sm:opacity-0 sm:scale-95 sm:pointer-events-none'}`}>


        <div className="h-full overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b z-10">
            <h2 className="text-xl font-semibold">Filters</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleClearAllTempFilters}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-2xl text-gray-600 hover:text-gray-800 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

{/* Filter Content */}
<div className="p-4 pb-20">
  {/* Location with Radius */}
  <div className="mb-6">
  <h3 className="font-semibold text-gray-700 mb-3">Location</h3>
  <LoadScriptNext
    googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
    libraries={libraries}
    onLoad={() => setIsScriptLoaded(true)}
  >
    <Autocomplete
      onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)}
      onPlaceChanged={() => {
        if (autocomplete) {
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
            setTempFilters({ ...tempFilters, location });
            setLocationInput(place.formatted_address);
          }
        }
      }}
      options={{
        componentRestrictions: { country: 'au' }, // Restrict to Australia
        types: ['geocode'] // Restrict to geographic locations
      }}
    >
      <input
        type="text"
        placeholder="Enter location..."
        value={locationInput}
        onChange={(e) => setLocationInput(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      />
    </Autocomplete>
  </LoadScriptNext>
  
  {tempFilters.location && (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm text-gray-600">
          Search within:
        </label>
        <span className="text-sm font-medium text-gray-700">
          {tempFilters.location.radius} km
        </span>
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
          [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:bg-teal-700
          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-600 
          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:bg-teal-700"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>1 km</span>
        <span>200 km</span>
      </div>
      <button
        onClick={() => {
          setTempFilters({ ...tempFilters, location: null });
          setLocationInput('');
        }}
        className="mt-3 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        Clear location
      </button>
    </div>
  )}
</div>

{/* Categories */}
<div className="mb-6">
  <h3 className="font-semibold text-gray-700 mb-3">Categories</h3>
  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
    <div className="space-y-2 p-2">
      {filterOptions.categories.map((category) => (
        <label
          key={category}
          className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
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
          <span className="ml-3 text-gray-700">{category}</span>
        </label>
      ))}
    </div>
  </div>
  {/* Optional: Show selected count */}
  {tempFilters.categories?.length > 0 && (
    <p className="text-sm text-gray-600 mt-2">
      {tempFilters.categories.length} selected
    </p>
  )}
</div>

  {/* Ad Type */}
  <div className="mb-6">
    <h3 className="font-semibold text-gray-700 mb-3">Ad Type</h3>
    <div className="space-y-2">
      {['All', 'Offered', 'Wanted'].map((type) => (
        <label key={type} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
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
          <span className="ml-3 text-gray-700">{type}</span>
        </label>
      ))}
    </div>
  </div>
</div>

          {/* Apply Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button
    onClick={applyFilters}
    className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
  >
    Show results
  </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
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

          {/* Search Bar with Sort/Filter buttons */}
          <div className="px-3 mb-3 sm:px-4 sm:mb-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Search adverts..."
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button
                type="submit"
                className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition-colors text-sm font-medium"
              >
                Search
              </button>
            </form>

            {/* Sort and Filter Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="font-medium">Filter</span>
                {getActiveFilterCount() > 0 && (
                  <span className="bg-teal-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="font-medium">Sort</span>
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
{getActiveFilterCount() > 0 && (
  <div className="bg-gray-50 border-y">
    <div className="px-3 py-3 sm:px-4 flex items-center gap-3 max-w-full">
      <span className="text-sm text-gray-600 font-medium whitespace-nowrap flex-shrink-0">
        Active filters:
      </span>
      
      {/* Scrollable container */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2 pb-1"> {/* pb-1 gives space for potential scrollbar */}
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
      </div>
    
  );
};

export default AdvertsPage;