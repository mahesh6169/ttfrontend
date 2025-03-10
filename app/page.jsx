'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFilter, fetchAdvertsByFilter } from '@/store/slices/filterSlice';
import AdvertList from '@/components/advertcomponents/AdvertList';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  FaMusic,
  FaHeart,
  FaCarAlt,
  FaBaby,
  FaDog,
  FaBook,
  FaLaptop,
  FaHome,
  FaCity,
} from 'react-icons/fa';

const categoryIcons = [
  { name: 'Music', icon: <FaMusic /> },
  { name: 'Dating', icon: <FaHeart /> },
  { name: 'Cars & Vehicles', icon: <FaCarAlt /> },
  { name: 'Baby & Children', icon: <FaBaby /> },
  { name: 'Pets', icon: <FaDog /> },
  { name: 'Books, Music & Games', icon: <FaBook /> },
  { name: 'Electronics & Computer', icon: <FaLaptop /> },
  { name: 'Home & Garden', icon: <FaHome /> },
];

const cities = [
  { name: 'Sydney', coordinates: '151.2093,-33.8688' },
  { name: 'Melbourne', coordinates: '144.9631,-37.8136' },
  { name: 'Brisbane', coordinates: '153.0281,-27.4679' },
  { name: 'Perth', coordinates: '115.8605,-31.9505' },
  { name: 'Adelaide', coordinates: '138.6007,-34.9285' },
  { name: 'Hobart', coordinates: '147.3272,-42.8821' },
  { name: 'Darwin', coordinates: '130.8456,-12.4634' },
  { name: 'Canberra', coordinates: '149.1300,-35.2809' },
];

const HomePage = () => {
  const dispatch = useDispatch();
  const { adverts, meta, status, category, location, proximity, page, limit } =
    useSelector((state) => state.filters);
  const [filterMode, setFilterMode] = useState('input'); // 'input', 'icons', or 'cities'

  // State for location input
  const [locationInput, setLocationInput] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Clear all filters
  const handleClearAll = () => {
    dispatch(updateFilter({ category: '', location: null, proximity: '' }));
    setLocationInput('');
  };

  // Handle filter mode change
  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    handleClearAll(); // Clear all filters when switching modes
  };

  // Handle category selection
  const handleCategoryChange = (e) => {
    dispatch(updateFilter({ category: e.target.value }));
  };

  // Handle proximity input
  const handleProximityChange = (e) => {
    dispatch(updateFilter({ proximity: parseInt(e.target.value, 10) }));
  };

  // Handle category icon click
  const handleCategoryClick = (selectedCategory) => {
    dispatch(updateFilter({ category: selectedCategory }));
  };

  // Handle city click
  const handleCityClick = (city) => {
    dispatch(updateFilter({ location: city.coordinates, proximity: 50 })); // Default proximity: 50km
  };

  // Handle Google Maps Autocomplete location selection
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

  // Handle manual changes in the location input field
  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);

    if (value === '') {
      // If the input is cleared, set location to null
      dispatch(updateFilter({ location: null }));
    }
  };

  // Fetch adverts whenever filters change
  useEffect(() => {
    dispatch(fetchAdvertsByFilter());
  }, [category, location, proximity, page, limit, dispatch]);

  // Display loading spinner when status is "loading" and no adverts are available
  if (status === 'loading' && (!adverts || adverts.length === 0)) {
    //console.log('loading');
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <LoadingSpinner />
      </div>
    );
  }

  if ((!adverts || adverts.length === 0) && status !== 'loading') {
    return (
      <div className="flex justify-center items-center text-center p-8">
        <p className="text-lg text-gray-500">No adverts found.</p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">
        Discover Adverts
      </h1>
      {/* Filter Mode Toggle */}
      <div className="mx-auto flex justify-center gap-4 mb-6">
        <button
          onClick={() => handleFilterModeChange('input')}
          className={` text-xs md:text-base px-1 py-1 rounded ${
            filterMode === 'input' ? 'bg-gray-950 text-white' : 'bg-gray-200'
          }`}
        >
          Search All
        </button>
        <button
          onClick={() => handleFilterModeChange('icons')}
          className={`text-xs md:text-base px-1 py-1 rounded ${
            filterMode === 'icons' ? 'bg-gray-950 text-white' : 'bg-gray-200'
          }`}
        >
          Browse Categories
        </button>
        <button
          onClick={() => handleFilterModeChange('cities')}
          className={`text-xs md:text-base px-1 py-1 rounded ${
            filterMode === 'cities' ? 'bg-gray-950 text-white' : 'bg-gray-200'
          }`}
        >
          Browse Cities
        </button>
      </div>

      {/* Input Filter Section */}
      {filterMode === 'input' && (
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center mx-auto">
          <select
            className="p-2 border rounded w-full md:w-auto"
            onChange={handleCategoryChange}
            value={category}
          >
            <option value="">All Categories</option>
            {categoryIcons.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

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
                  className="p-2 border rounded w-full md:w-80 lg:w-96"
                  value={locationInput}
                  onChange={handleLocationInputChange}
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                placeholder="Enter location"
                className="p-2 border rounded w-full md:w-80 lg:w-96"
                value={locationInput}
                onChange={handleLocationInputChange}
                disabled
              />
            )}
          </LoadScriptNext>

          <input
            type="number"
            className="p-2 border rounded w-full md:w-auto"
            placeholder="Proximity (km)"
            min="1"
            value={proximity || ''}
            onChange={handleProximityChange}
          />

          {/* Clear All Button */}
          <button
            type="button"
            className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-950"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        </div>
      )}

{/* Icon Categories Section */}
{filterMode === 'icons' && (
  <div className="w-full overflow-hidden px-4">
    {/* Scrollable Wrapper */}
    <div
      className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 gap-4 py-2 justify-start"
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x mandatory',
        maxWidth: '100%',
        overflowX: 'auto',
      }}
    >
      {/* Category Buttons */}
      {categoryIcons.map((cat) => (
        <button
          key={cat.name}
          className={`flex flex-col items-center justify-center p-2 w-[140px] min-w-[140px] border rounded-lg shadow-md cursor-pointer snap-start ${
            category === cat.name ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'
          }`}
          onClick={() => handleCategoryClick(cat.name)}
        >
          <div className="text-xs text-gray-600 mb-1">{cat.icon}</div>
          <span className="text-xs font-semibold text-center whitespace-nowrap">{cat.name}</span>
        </button>
      ))}
    </div>
  </div>
)}




      {/* Browse by Cities Section */}
      {filterMode === 'cities' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-6 mb-8">
          {cities.map((city) => (
            <button
              key={city.name}
              className={`flex flex-col items-center justify-center p-4 border rounded-lg shadow-md cursor-pointer ${
                location === city.coordinates
                  ? 'bg-gray-300'
                  : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => handleCityClick(city)}
            >
              <div className="text-3xl text-gray-600 mb-2">
                <FaCity />
              </div>
              <span className="text-sm font-semibold">{city.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Advert List */}
      <AdvertList adverts={adverts} status={status} />

      {/* Pagination Controls */}
      {meta?.totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <button
            disabled={page === 1}
            onClick={() => dispatch(updateFilter({ page: page - 1 }))}
            className="p-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {meta.totalPages}
          </span>
          <button
            disabled={page === meta.totalPages}
            onClick={() => dispatch(updateFilter({ page: page + 1 }))}
            className="p-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default HomePage;
