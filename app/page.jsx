'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFilter, fetchAdvertsByFilter } from '@/store/slices/filterSlice';
import AdvertList from '@/components/advertcomponents/AdvertList';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  FaMusic,
  FaCarAlt,
  FaBaby,
  FaDog,
  FaBook,
  FaLaptop,
  FaHome,
  FaUserTie,
  FaList,
  FaDumbbell,
  FaUtensils,
  FaGraduationCap,
  FaHeart,
  FaCity,
} from 'react-icons/fa';

import { LuPartyPopper } from 'react-icons/lu';
import { MdRealEstateAgent, MdStore } from 'react-icons/md'; // ✅ Store icon from Materiall Design
import { GiScrewdriver } from 'react-icons/gi'; // ✅ Use GameIcons for tools.
import SelectSlider from '@/components/SelectSlider';

import Link from 'next/link';

const libraries = ['places'];

const categoryIcons = [
  { name: 'Books Art & Collectables', icon: <FaBook /> },
  { name: 'Baby & Children', icon: <FaBaby /> },
  { name: 'Music & Games', icon: <FaMusic /> },
  { name: 'Cars & Vehicles', icon: <FaCarAlt /> },
  { name: 'Fashion & Accessories', icon: <FaHeart /> }, // Example placeholder
  { name: 'Academics Tutors & Arts', icon: <FaGraduationCap /> },
  { name: 'Electronics & Computers', icon: <FaLaptop /> },
  { name: 'Home & Garden', icon: <FaHome /> },
  { name: 'Jobs', icon: <FaUserTie /> },
  { name: 'Miscellaneous', icon: <FaList /> },
  { name: 'Pets', icon: <FaDog /> },
  { name: 'Party Hires & Services', icon: <LuPartyPopper /> },
  { name: 'Health, Sport & Fitness', icon: <FaDumbbell /> },
  { name: 'Food & Catering Services', icon: <FaUtensils /> },
  { name: 'Home Improvement & Repairs', icon: <GiScrewdriver /> }, // ✅ Correct replacement
  { name: 'Real Estate', icon: <MdRealEstateAgent /> },
  { name: 'Professional Services', icon: <FaGraduationCap /> }, // Reusing graduation cap
  { name: 'Business & Stores', icon: <MdStore /> }, // ✅ Correct replacement
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
  const { adverts, meta, status: advertStatus, category, location, proximity, page, limit } =
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
      if (category === selectedCategory) {
        dispatch(updateFilter({ category: '', page: 1 }));
      } else {
        dispatch(updateFilter({ category: selectedCategory, page: 1 }));
      }
    };
    

  // Handle city click
  const handleCityClick = (city) => {
      if (location === city.coordinates) {
        dispatch(updateFilter({ location: '', proximity: 10, page: 1 }));
      } else {
        dispatch(updateFilter({ location: city.coordinates, proximity: 50, page: 1 }));
      }
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

  return (
    <div className="flex flex-col ">
      {/* Post New Advert */}
      <Link
        href="/adverts/add"
        className="block my-2 p-2 bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 font-semibold lg:w-1/4 text-center rounded"
      >
        + Post New Advertisement
      </Link>

      <h1 className="text-lg md:text-2xl  mb-2 text-center  text-gray-900 font-semibold">
        Discover Adverts
      </h1>

      {/* Filter Mode Toggle */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => handleFilterModeChange('input')}
          className={` text-xs md:text-base p-1 rounded ${
            filterMode === 'input' ? 'bg-gray-300 text-gray-900 font-semibold' : 'bg-gray-100 text-gray-800'
          }`}
        >
          Search All
        </button>
        <button
          onClick={() => handleFilterModeChange('icons')}
          className={`text-sm md:text-base p-1 rounded ${
            filterMode === 'icons' ? 'bg-gray-300 text-gray-900 font-semibold' : 'bg-gray-100 text-gray-800'
          }`}
        >
          Browse Categories
        </button>
        <button
          onClick={() => handleFilterModeChange('cities')}
          className={`text-sm md:text-base px-1 rounded ${
            filterMode === 'cities' ? 'bg-gray-300 text-gray-900 font-semibold' : 'bg-gray-100 text-gray-800'
          }`}
        >
          Browse Cities
        </button>
      </div>

      {/* Input Filter Section */}
      {filterMode === 'input' && (
        <div className=" text-sm lg:text-base p-1 w-full  flex flex-col md:flex-row gap-4 mb-4 justify-center">
          <SelectSlider  
            options={[
              'All Categories',
              ...categoryIcons.map((cat) => cat.name),
            ]}
            value={category || 'All Categories'}
            onChange={(selected) => {
              const value = selected === 'All Categories' ? '' : selected;
              dispatch(updateFilter({ category: value }));
            }}
          />

          <LoadScriptNext
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
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
                  className="p-2 border rounded w-full md:w-96"
                  value={locationInput}
                  onChange={handleLocationInputChange}
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                placeholder="Enter location"
                className="p-2 border rounded"
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
            value={proximity || ''}
            onChange={handleProximityChange}
          />

          {/* Clear All Button */}
          <button
            type="button"
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 "
            onClick={handleClearAll}
          >
            Clear All
          </button>
          
        </div>
      )}

      {/* Icon Categories Section. */}
      {filterMode === 'icons' && (
        <div className="justify-center mb-4 mx-auto">
          {/* Scrollable Wrapper */}
          <div
            className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 gap-2 py-2 w-[300px] md:w-[350px] lg:w-[600px] xl:w-[800px] 2xl:w-[800px]"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }}
          >
            {/* Category Buttons */}
            {categoryIcons.map((cat) => (
              <button
                key={cat.name}
                className={`flex flex-col items-center justify-center p-2  border rounded-lg shadow-md cursor-pointer snap-start  ${
                  category === cat.name
                    ? 'bg-gray-300'
                    : 'bg-white hover:bg-gray-100'
                }`}
                onClick={() => handleCategoryClick(cat.name)}
              >
                <div className="text-xs text-gray-600 mb-1">
                  {React.cloneElement(cat.icon, { size: 32 })}
                </div>
                <span className="text-xs font-semibold text-center whitespace-nowrap">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Browse by Cities Section */}
      {filterMode === 'cities' && (
        <div className="overflow-hidden mb-4">
          {/* Scrollable Wrapper */}
          <div
            className="flex overflow-x-auto gap-2 py-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 scroll-smooth"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }}
          >
            {cities.map((city) => (
              <button
                key={city.name}
                className={`flex flex-col items-center justify-center p-4 min-w-[140px] border rounded-lg shadow-md cursor-pointer snap-start  ${
                  location === city.coordinates
                    ? 'bg-gray-300'
                    : 'bg-white hover:bg-gray-100'
                }`}
                onClick={() => handleCityClick(city)}
              >
                <div className="text-3xl text-gray-600 mb-2">
                  <FaCity />
                </div>
                <span className="text-sm font-semibold text-center whitespace-nowrap">
                  {city.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advert List */}
      <AdvertList adverts={adverts} advertStatus={advertStatus} />

      {/* Pagination Controls */}
      <Pagination
        currentPage={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={(pageNum) => dispatch(updateFilter({ page: pageNum }))}
      />
    </div>
  );
};

export default HomePage;
