'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateFilter,
  fetchAdvertsByFilter,
} from '@/store/slices/adverts/filterSlice';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import AdvertList from '@/components/adverts/advertcomponents/AdvertList';
import { useRouter } from 'next/navigation';

const categories = [
  'Antiques, Art & Collectables',
  'Baby & Children',
  'Books, Music & Games',
  'Cars & Vehicles',
  'Clothing & Jewellery',
  'Community',
  'Electronics & Computer',
  'Home & Garden',
  'Jobs',
  'Miscellaneous',
  'Pets',
  'Real Estate',
  'Services For Hire',
  'Sport & Fitness',
  'Restaurants and Cloud Kitchens',
];

const CategoriesPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    adverts,
    meta,
    status,
    error,
    category,
    location,
    proximity,
    page,
    limit,
  } = useSelector((state) => state.filters);
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // New state to manage the location input value
  const [locationInput, setLocationInput] = useState('');

  // Function to handle category selection
  const handleCategoryChange = (e) => {
    dispatch(updateFilter({ category: e.target.value }));
  };

  // Function to handle Google Maps Autocomplete location selection
  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        console.error('Selected place has no geometry.');
        return;
      }

      const coordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      dispatch(
        updateFilter({ location: `${coordinates.lng},${coordinates.lat}` })
      );

      // Update the location input with the formatted address
      setLocationInput(place.formatted_address);
    } else {
      console.error('Autocomplete not loaded yet!');
    }
  };

  // New function to handle manual changes in the location input field
  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);

    if (value === '') {
      // If the input is cleared, set location to null
      dispatch(updateFilter({ location: null }));
    }
  };

  // Function to handle proximity input change
  const handleProximityChange = (e) => {
    dispatch(updateFilter({ proximity: parseInt(e.target.value, 10) }));
  };

  // Fetch adverts when filters change
  useEffect(() => {
    dispatch(fetchAdvertsByFilter());
  }, [category, location, proximity, page, limit, dispatch]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Marketplace</h1>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          className="p-2 border rounded"
          onChange={handleCategoryChange}
          value={category}
        >
          <option value="">All Categories</option>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Google Maps Autocomplete for Location Selection */}
        <LoadScriptNext
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          libraries={['places']}
          onLoad={() => setIsScriptLoaded(true)}
        >
          {isScriptLoaded ? (
            <Autocomplete
              onLoad={(auto) => setAutocomplete(auto)}
              onPlaceChanged={handlePlaceChanged}
              options={{ componentRestrictions: { country: 'AU' } }}
            >
              <input
                type="text"
                placeholder="Enter location"
                className="p-2 border rounded w-full"
                value={locationInput}
                onChange={handleLocationInputChange}
              />
            </Autocomplete>
          ) : (
            <input
              type="text"
              placeholder="Enter location"
              className="p-2 border rounded w-full"
              value={locationInput}
              onChange={handleLocationInputChange}
              disabled
            />
          )}
        </LoadScriptNext>

        <input
          type="number"
          className="p-2 border rounded"
          placeholder="Proximity (km)"
          min="1"
          value={proximity}
          onChange={handleProximityChange}
        />

        {/* cancel Button */}
        <button
          type="button"
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-400"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>

      {/* Display Adverts using AdvertList Component */}
      <AdvertList adverts={adverts} status={status} />

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="mt-4 flex justify-between">
          <button
            disabled={page === 1}
            onClick={() => dispatch(updateFilter({ page: page - 1 }))}
            className="p-2 bg-gray-200 rounded"
          >
            Previous
          </button>
          <span>
            Page {page} of {meta.totalPages}
          </span>
          <button
            disabled={page === meta.totalPages}
            onClick={() => dispatch(updateFilter({ page: page + 1 }))}
            className="p-2 bg-gray-200 rounded"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
