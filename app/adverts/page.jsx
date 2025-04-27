'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateFilter,
  fetchAdvertsByFilter,
  resetFilters,
  clearAdvertFilter,
} from '@/store/slices/adverts/filterSlice';
import AdvertList from '@/components/adverts/advertcomponents/AdvertList';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import Pagination from '@/components/Pagination';
import SelectSlider from '@/components/SelectSlider';
import Link from 'next/link';
import {
  FaCity,
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
} from 'react-icons/fa';
import { LuPartyPopper } from 'react-icons/lu';
import { MdRealEstateAgent, MdStore } from 'react-icons/md';
import { GiScrewdriver } from 'react-icons/gi';

const libraries = ['places'];

/* 🟢 Configurations */
const categoryIcons = [
  { name: 'Books Art & Collectables', icon: <FaBook /> },
  { name: 'Baby & Children', icon: <FaBaby /> },
  { name: 'Music & Games', icon: <FaMusic /> },
  { name: 'Cars & Vehicles', icon: <FaCarAlt /> },
  { name: 'Fashion & Accessories', icon: <FaHeart /> },
  { name: 'Academics Tutors & Arts', icon: <FaGraduationCap /> },
  { name: 'Electronics & Computers', icon: <FaLaptop /> },
  { name: 'Home & Garden', icon: <FaHome /> },
  { name: 'Jobs', icon: <FaUserTie /> },
  { name: 'Miscellaneous', icon: <FaList /> },
  { name: 'Pets', icon: <FaDog /> },
  { name: 'Party Hires & Services', icon: <LuPartyPopper /> },
  { name: 'Health, Sport & Fitness', icon: <FaDumbbell /> },
  { name: 'Food & Catering Services', icon: <FaUtensils /> },
  { name: 'Home Improvement & Repairs', icon: <GiScrewdriver /> },
  { name: 'Real Estate', icon: <MdRealEstateAgent /> },
  { name: 'Professional Services', icon: <FaGraduationCap /> },
  { name: 'Business & Stores', icon: <MdStore /> },
  { name: 'Overseas', icon: <FaCity /> },
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

/* 🟢 Centralized filter mode config */
const filterModesConfig = {
  input: {
    label: 'All',
    clear: (dispatch, setLocationInput) => {
      dispatch(
        updateFilter({ category: '', location: null, proximity: 10, page: 1 })
      );
      setLocationInput('');
    },
    isActive: (filters) =>
      filters.category || filters.location || filters.proximity !== 10,
  },
  icons: {
    label: 'Categories',
    clear: (dispatch) => dispatch(updateFilter({ category: '', page: 1 })),
    isActive: (filters) => filters.category,
  },
  cities: {
    label: 'Cities',
    clear: (dispatch) =>
      dispatch(updateFilter({ location: '', proximity: 10, page: 1 })),
    isActive: (filters) => filters.location || filters.proximity !== 10,
  },
  telugufy: {
    label: 'Telugufy',
    clear: (dispatch) =>
      dispatch(
        updateFilter({ category: ['Overseas', 'Real Estate'], page: 1 })
      ),
    isActive: (filters) =>
      Array.isArray(filters.category)
        ? filters.category.some((cat) =>
            ['Overseas', 'Real Estate'].includes(cat)
          )
        : ['Overseas', 'Real Estate'].includes(filters.category),
  },
};

const AdvertsPage = () => {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);
  const {
    adverts,
    meta,
    status: advertStatus,
    category,
    location,
    proximity,
    page,
    limit,
  } = useSelector((state) => state.filters);
  const [filterMode, setFilterMode] = useState('input');
  const [locationInput, setLocationInput] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  /* 🔄 Filter clearing using config */
  const handleClearAll = () => {
    dispatch(clearAdvertFilter());          // Use your slice's clearAdvertFilter action
    setFilterMode('input');                 // Optionally reset mode to 'input' like ThreadsPage
    dispatch(fetchAdvertsByFilter());       // Immediately re-fetch after clearing
    setLocationInput('');                   // Clear location input field
  };

  /* 🟢 Mode switching using config */
  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    filterModesConfig[mode].clear(dispatch, setLocationInput);
  };

  /* 📍 Location logic */
  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        dispatch(
          updateFilter({ location: `${coordinates.lng},${coordinates.lat}` })
        );
        setLocationInput(place.formatted_address);
      }
    }
  };

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);
    if (value === '') dispatch(updateFilter({ location: null }));
  };

  /* 🔄 Fetch on filter change */
  useEffect(() => {
    dispatch(fetchAdvertsByFilter());
  }, [
    filters.category,
    filters.location,
    filters.proximity,
    filters.page,
    filters.limit,
    dispatch,
  ]);

  const isFilterActive = filterModesConfig[filterMode].isActive(filters);

  const handleCategoryClick = (selectedCategory) => {
    if (filterMode === 'telugufy') {
      // ✅ Multiple category toggle logic for Telugufy
      const currentCategories = Array.isArray(filters.category)
        ? filters.category
        : [];
      const isSelected = currentCategories.includes(selectedCategory);
      const updatedCategories = isSelected
        ? currentCategories.filter((cat) => cat !== selectedCategory)
        : [...currentCategories, selectedCategory];

      dispatch(updateFilter({ category: updatedCategories, page: 1 }));
    } else {
      // ✅ Single category toggle logic for other modes
      dispatch(
        updateFilter({
          category:
            filters.category === selectedCategory ? '' : selectedCategory,
          page: 1,
        })
      );
    }
  };

  return (
    <div className="flex flex-col">
<div className="relative my-4">
  {/* Flex Row Always */}
  <div className="flex items-center justify-center">
    {/* Button (Absolute Positioned Relative to Parent) */}
    <div className="absolute left-0">
      <Link
        href="/adverts/add"
        className="text-xs sm:text-sm md:text-base p-2 md:p-4 bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 font-semibold text-center rounded"
      >
        Post Advert
      </Link>
    </div>

    {/* Heading */}
    <div className="w-full">
      <h1 className="text-xs sm:text-lg md:text-lg text-center text-gray-900 font-semibold">
        Discover Adverts
      </h1>
    </div>
  </div>
</div>



      {/* 🔵 Filter Mode Switch */}
      <div className="flex justify-center gap-4 mb-4">
        {Object.keys(filterModesConfig).map((mode) => (
          <button
            key={mode}
            onClick={() => handleFilterModeChange(mode)}
            className={`text-xs md:text-base p-1 rounded ${
              filterMode === mode
                ? 'bg-gray-300 text-gray-900 font-semibold'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {filterModesConfig[mode].label}
          </button>
        ))}
      </div>

      {/* 🎯 Filter Sections. */}
      {filterMode === 'input' && (
        <div className="text-xs md:text-base flex flex-col md:flex-row gap-1 md:gap-4 mb-4 justify-center">
          <SelectSlider
            options={[
              'All Categories',
              ...categoryIcons.map((cat) => cat.name),
            ]}
            value={filters.category || 'All Categories'}
            onChange={(selected) =>
              dispatch(
                updateFilter({
                  category: selected === 'All Categories' ? '' : selected,
                })
              )
            }
          />
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
                  onChange={handleLocationInputChange}
                />
              </Autocomplete>
            ) : (
              <div className="flex items-center justify-center w-full md:w-96 p-2 border rounded bg-gray-100 text-gray-500">
              Loading Google Maps...
            </div>
            )}
          </LoadScriptNext>
          <input
            type="number"
            className="p-2 border rounded"
            placeholder="Proximity (km)"
            min="1"
            value={filters.proximity || ''}
            onChange={(e) =>
              dispatch(
                updateFilter({ proximity: parseInt(e.target.value, 10) })
              )
            }
          />
        </div>
      )}

      {filterMode === 'icons' && (
        <div className="justify-center mb-4 mx-auto">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 gap-2 py-2 w-[300px] md:w-[350px] lg:w-[600px] xl:w-[800px] 2xl:w-[800px]">
            {categoryIcons.map((cat) => (
              <button
                key={cat.name}
                className={`flex flex-col items-center justify-center p-2 border rounded-lg shadow-md cursor-pointer ${
                  Array.isArray(filters.category)
                    ? filters.category.includes(cat.name)
                      ? 'bg-gray-300'
                      : 'bg-white hover:bg-gray-100'
                    : filters.category === cat.name
                    ? 'bg-gray-300'
                    : 'bg-white hover:bg-gray-100'
                }`}
                onClick={() => handleCategoryClick(cat.name)}
              >
                <div className="text-xs text-gray-600 mb-1">
                  {React.cloneElement(cat.icon, { size: 20 })}
                </div>
                <span className="text-xs font-semibold text-center whitespace-nowrap">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

{filterMode === 'cities' && (
  <div className="justify-center mb-4 mx-auto">
    <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 gap-2 py-2 w-max justify-center mx-auto">
      {cities.map((city) => (
        <button
          key={city.name}
          className={`flex flex-col items-center justify-center p-2 border rounded-lg shadow-md cursor-pointer ${
            filters.location === city.coordinates
              ? 'bg-gray-300'
              : 'bg-white hover:bg-gray-100'
          }`}
          onClick={() =>
            dispatch(
              updateFilter({
                location:
                  filters.location === city.coordinates ? '' : city.coordinates,
                proximity: 50,
                page: 1,
              })
            )
          }
        >
          <div className="text-xs text-gray-600 mb-1">
            {React.cloneElement(<FaCity />, { size: 32 })} 
            {/* Matching icon size to icons section */}
          </div>
          <span className="text-xs font-semibold text-center whitespace-nowrap">
            {city.name}
          </span>
        </button>
      ))}
    </div>
  </div>
)}


{filterMode === 'telugufy' && (
  <div className="justify-center mb-4 mx-auto">
    <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 gap-2 py-2 w-max justify-center mx-auto">
      {categoryIcons
        .filter((cat) => ['Overseas', 'Real Estate'].includes(cat.name))
        .map((cat) => (
          <button
            key={cat.name}
            className={`flex flex-col items-center justify-center p-2 border rounded-lg shadow-md cursor-pointer ${
              filters.category === cat.name ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'
            }`}
            onClick={() =>
              dispatch(
                updateFilter({
                  category: filters.category === cat.name ? '' : cat.name,
                  page: 1,
                })
              )
            }
          >
            <div className="text-xs text-gray-600 mb-1">
              {React.cloneElement(cat.icon, { size: 32 })} 
              {/* Matching icon size to icons section */}
            </div>
            <span className="text-xs font-semibold text-center whitespace-nowrap">
              {cat.name}
            </span>
          </button>
        ))}
    </div>
  </div>
)}



      {/* 🟥 Clear Filter Button */}
      {isFilterActive && (
        <div className="flex justify-center ">
          <button
            onClick={handleClearAll}
            className="text-xs md:text-base p-1 md:p-1 m-2 rounded bg-red-500 text-white hover:bg-red-600"
          >
            Clear Filter
          </button>
        </div>
      )}

      <AdvertList adverts={adverts} advertStatus={advertStatus} />
      <Pagination
        currentPage={filters.page}
        totalPages={meta?.totalPages || 1}
        onPageChange={(pageNum) => dispatch(updateFilter({ page: pageNum }))}
      />
    </div>
  );
};

export default AdvertsPage;
