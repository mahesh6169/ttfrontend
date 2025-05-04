'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFilter,
   fetchAdvertsAll, fetchAdvertsByCategory, fetchAdvertsTelugufy,
   fetchAdvertsByCity, resetFilters } from '@/store/slices/adverts/filterSlice';
import AdvertList from '@/components/adverts/advertcomponents/AdvertList';
import Pagination from '@/components/Pagination';
import SelectSlider from '@/components/SelectSlider';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { RiAdvertisementLine } from "react-icons/ri";


import Link from 'next/link';

const libraries = ['places'];

const MODES = [
  { label: 'All', value: 'all' },
  { label: 'Categories', value: 'categories' },
  { label: 'Cities', value: 'cities' },
  { label: 'Telugufy', value: 'telugufy' },
];

const categoryOptions = [
  
  'Books Art & Collectables',
  'Baby & Children',
  'Music & Games',
  'Cars & Vehicles',
  'Fashion & Accessories',
  'Academics Tutors & Arts',
  'Electronics & Computers',
  'Home & Garden',
  'Jobs',
  'Miscellaneous',
  'Pets',
  'Party Hires & Services',
  'Health, Sport & Fitness',
  'Food & Catering Services',
  'Home Improvement & Repairs',
  'Real Estate',
  'Professional Services',
  'Business & Stores',
  'Overseas',
];

const cityOptions = [
  { name: 'Sydney', coordinates: '151.2093,-33.8688' },
  { name: 'Melbourne', coordinates: '144.9631,-37.8136' },
  { name: 'Brisbane', coordinates: '153.0281,-27.4679' },
  { name: 'Perth', coordinates: '115.8605,-31.9505' },
  { name: 'Adelaide', coordinates: '138.6007,-34.9285' },
  { name: 'Hobart', coordinates: '147.3272,-42.8821' },
  { name: 'Darwin', coordinates: '130.8456,-12.4634' },
  { name: 'Canberra', coordinates: '149.1300,-35.2809' },
];

const TELUGUFY_CATEGORIES = [
  'Overseas',
  'Real Estate',
];

const AdvertsPage = () => {
  const dispatch = useDispatch();
  const { mode, all, categories, adverts, cities, telugufy, meta, status } = useSelector((state) => state.filters);
  const [locationInput, setLocationInput] = useState(all.locationInputText || '');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

 

  // 🔥 Dispatcher based on selected mode
  useEffect(() => {
    if (mode === 'all') {
      dispatch(fetchAdvertsAll());
    } else if (mode === 'categories') {
      dispatch(fetchAdvertsByCategory());
    } else if (mode === 'cities') {
      dispatch(fetchAdvertsByCity());
    } else if (mode === 'telugufy') {
      dispatch(fetchAdvertsTelugufy());
    }
  }, [mode, all, categories, cities, telugufy, dispatch]);  // ✅ Add `telugufy` to dependencies
  

  const handleModeChange = (newMode) => {
    dispatch(resetFilters(newMode));         // Reset filters per selected mode
    setLocationInput('');                    // Reset local input
  };

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        dispatch(updateFilter({
          mode: 'all',
          values: {
            location: `${coordinates.lng},${coordinates.lat}`,
            locationInputText: place.formatted_address,
          },
        }));
        setLocationInput(place.formatted_address);
      }
    }
  };

  const handleClearFilters = () => {
    dispatch(resetFilters(mode));
    setLocationInput('');
  };

  return (
    <div className="flex flex-col">
    <div className="my-2 px-4">
  <div className="flex justify-start">
    <Link
      href="/adverts/add"
      className="bg-yellow-400  text-teal-700 hover:bg-teal-700 hover:text-lime-100 px-3 py-1.5 rounded-tr-xl rounded-bl-xl shadow-lg text-sm sm:text-base font-semibold transition duration-200"
    >
      Post Advert
    </Link>
  </div>
</div>


      {/* Discover Adverts - Centered on mobile, normal on desktop */}
      <div className="my-2 px-4 py-6 bg-gradient-to-br from-teal-950 to-teal-100 shadow-sm rounded-md flex justify-center">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-yellow-400 tracking-tight flex items-center gap-2 text-center animate-[pulsezoom_1.5s_ease-in-out_infinite]">
  <span>Sell</span>
  <span className="text-yellow-400">•</span>
  <span>Buy</span>
  <span className="text-yellow-400">•</span>
  <span>Advertise</span>
</h1>
</div>

      {/* 🌟 Mode Selector */}
      <div className="flex justify-center mb-4 gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => handleModeChange(m.value)}
            className={`px-3 py-1 rounded text-xs sm:text-base font-semibold ${mode === m.value ? 'bg-teal-700 text-lime-100' : ' text-teal-700 hover:bg-lime-100'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 🟢 Filters for ALL mode */}
      {mode === 'all' && (
        <div className="flex flex-col text-xs sm:text-base md:flex-row justify-center gap-4 mb-4 px-4">
          <SelectSlider
            options={categoryOptions}
            value={all.category || 'All Categories'}
            onChange={(selected) =>
              dispatch(
                updateFilter({
                  mode: 'all',
                  values: { category: selected === 'All Categories' ? '' : selected },
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocationInput(val);
                    if (val === '')
                      dispatch(updateFilter({ mode: 'all', values: { location: '' } }));
                  }}
                />
              </Autocomplete>
            ) : (
              <div className="p-2 w-full md:w-96 bg-gray-100 text-gray-500 rounded border">Loading map…</div>
            )}
          </LoadScriptNext>

          <input
            type="number"
            min="1"
            placeholder="Proximity (km)"
            className="p-2 border rounded"
            value={all.proximity || ''}
            onChange={(e) =>
              dispatch(updateFilter({ mode: 'all', values: { proximity: parseInt(e.target.value) } }))
            }
          />
        </div>
      )}

      {/* 🟢 Filters for CATEGORIES mode */}
      {mode === 'categories' && (
  <div className="flex flex-col items-center mb-4 px-4 ">
    <div className="w-full max-w-5xl border rounded p-3 overflow-x-auto">
      <div
        className="grid grid-flow-col auto-cols-max gap-1 sm:gap-4"
        style={{ gridAutoRows: 'minmax(40px, auto)', minWidth: 'max-content' }}
      >
        {categoryOptions.map((category) => (
          <label
            key={category}
            className="flex items-center space-x-2 cursor-pointer hover:bg-lime-100 rounded "
          >
            <input
              type="checkbox"
              checked={categories.selectedCategories.includes(category)}
              onChange={(e) => {
                const selected = categories.selectedCategories.includes(category)
                  ? categories.selectedCategories.filter((c) => c !== category)
                  : [...categories.selectedCategories, category];
                dispatch(
                  updateFilter({
                    mode: 'categories',
                    values: { selectedCategories: selected },
                  })
                );
              }}
            />
            <span className="text-xs sm:text-base">{category}</span>
          </label>
        ))}
      </div>
    </div>
  </div>
)}

      {/* 🟢 Filters for Cities mode */}
{mode === 'cities' && (
  <div className="flex flex-col items-center mb-4 px-4">
    <div className="w-full max-w-5xl border rounded p-3 overflow-x-auto">
      <div
        className="grid grid-flow-col auto-cols-max gap-1 sm:gap-4"
        style={{ gridAutoRows: 'minmax(40px, auto)', minWidth: 'max-content' }}
      >
        {cityOptions.map((city) => (
          <label
            key={city.name}
            className="flex items-center space-x-2 cursor-pointer hover:bg-lime-100 rounded sm:p-2"
          >
            <input
              type="radio"
              name="city-selection"
              checked={cities.location === city.coordinates}
              onChange={() =>
                dispatch(
                  updateFilter({
                    mode: 'cities',
                    values: { location: city.coordinates },
                  })
                )
              }
            />
            <span className="text-xs sm:text-base">{city.name }</span>
          </label>
        ))}
      </div>
    </div>
  </div>
)}

      {/* 🟢 Filters for Telugufy mode */}
      {mode === 'telugufy' && (
  <div className="flex flex-col items-center mb-4 px-4">
    <div className="w-full max-w-5xl border rounded p-3 overflow-x-auto">
      <div
        className="grid grid-flow-col auto-cols-max gap-1 sm:gap-4"
        style={{ gridAutoRows: 'minmax(40px, auto)', minWidth: 'max-content' }}
      >
        {TELUGUFY_CATEGORIES.map((category) => (
          <label
            key={category}
            className="flex items-center space-x-2 cursor-pointer hover:bg-lime-100 rounded sm:p-2"
          >
            <input
              type="checkbox"
              checked={telugufy.selectedCategories.includes(category)}
              onChange={() => {
                const selected = telugufy.selectedCategories.includes(category)
                  ? telugufy.selectedCategories.filter((c) => c !== category)
                  : [...telugufy.selectedCategories, category];
                dispatch(
                  updateFilter({
                    mode: 'telugufy',
                    values: { selectedCategories: selected },
                  })
                );
              }}
            />
            <span className="text-xs sm:text-base">{category}</span>
          </label>
        ))}
      </div>
    </div>
  </div>
)}

      {/* 🔴 Clear Filters */}
      <div className="flex justify-center mb-2">
        <button
          onClick={handleClearFilters}
          className="text-xs sm:text-base bg-red-500 text-white px-3 py-1 rounded"
        >
          Clear Filters
        </button>
      </div>

      {/* 🔷 Advert Listing */}
      <AdvertList adverts={adverts} advertStatus={status} />
      <Pagination
        currentPage={all.page}
        totalPages={meta?.totalPages || 1}
        onPageChange={(pageNum) =>
          dispatch(updateFilter({ mode: 'all', values: { page: pageNum } }))
        }
      />
    </div>
  );
};

export default AdvertsPage;
