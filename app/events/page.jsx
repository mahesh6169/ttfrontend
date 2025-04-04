'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateEventFilter, fetchEventsByFilter } from '@/store/slices/filterEventSlice';
import EventsGrid from '@/components/events/EventsGrid';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import SelectSlider from '@/components/SelectSlider';
import Link from 'next/link';
import { FaCity } from 'react-icons/fa';

const CATEGORY_OPTIONS = [
  'Technology',
  'Real Estate',
  'Spiritual & Devotional',
  'Community & Cultural',
  'Education',
  'Migration',
  'Sports',
  'Entertainment & Music',
  'Miscellaneous',
  'Travel & Adventure',
  'Art & Exhibitions',
  'Volunteering & Charity',
  'Family & Kids',
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

const EventsPage = () => {
  const dispatch = useDispatch();
  const {
    events,
    meta,
    status: eventStatus,
    category,
    location,
    proximity,
    page,
    limit,
  } = useSelector((state) => state.eventFilters);

  const [filterMode, setFilterMode] = useState('input');
  const [locationInput, setLocationInput] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const handleClearAll = () => {
    dispatch(updateEventFilter({ category: '', location: null, proximity: '' }));
    setLocationInput('');
  };

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    handleClearAll();
  };

  const handleCategoryClick = (selectedCategory) => {
    dispatch(updateEventFilter({ category: selectedCategory }));
  };

  const handleCityClick = (city) => {
    dispatch(updateEventFilter({ location: city.coordinates, proximity: 50 }));
  };

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      const coordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      dispatch(updateEventFilter({ location: `${coordinates.lng},${coordinates.lat}` }));
      setLocationInput(place.formatted_address);
    }
  };

  useEffect(() => {
    dispatch(fetchEventsByFilter());
  }, [category, location, proximity, page, limit, dispatch]);

  return (
    <div className="flex flex-col">
      <Link
        href="/events/add"
        className="block my-2 p-2 bg-green-600 text-white lg:w-1/4 text-center rounded"
      >
        + Post New Event
      </Link>

      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">Browse Events</h1>

      <div className="flex justify-center gap-4 mb-4">
        {['input', 'icons', 'cities'].map((mode) => (
          <button
            key={mode}
            onClick={() => handleFilterModeChange(mode)}
            className={`text-xs md:text-base p-1 rounded ${
              filterMode === mode ? 'bg-gray-950 text-white' : 'bg-gray-200'
            }`}
          >
            {mode === 'input' ? 'Search All' : mode === 'icons' ? 'Browse Categories' : 'Browse Cities'}
          </button>
        ))}
      </div>

      {filterMode === 'input' && (
        <div className="flex flex-col md:flex-row gap-4 mb-4 justify-center">
          <SelectSlider
            options={['All Categories', ...CATEGORY_OPTIONS]}
            value={category || 'All Categories'}
            onChange={(val) => dispatch(updateEventFilter({ category: val === 'All Categories' ? '' : val }))}
          />

          <LoadScriptNext
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            libraries={['places']}
            onLoad={() => setIsScriptLoaded(true)}
          >
            {isScriptLoaded && (
              <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceChanged}>
                <input
                  type="text"
                  className="p-2 border rounded w-full md:w-96"
                  placeholder="Enter location"
                  value={locationInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocationInput(value);
                    if (!value) dispatch(updateEventFilter({ location: null }));
                  }}
                />
              </Autocomplete>
            )}
          </LoadScriptNext>

          <input
            type="number"
            className="p-2 border rounded"
            placeholder="Proximity (km)"
            min="1"
            value={proximity || ''}
            onChange={(e) => dispatch(updateEventFilter({ proximity: parseInt(e.target.value, 10) }))}
          />

          <button
            type="button"
            className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        </div>
      )}

{filterMode === 'icons' && (
  <div className="justify-center mb-4 mx-auto">
    {/* Scrollable Wrapper */}
    <div
      className="flex overflow-x-auto gap-2 py-2 w-[300px] md:w-[350px] lg:w-[600px] xl:w-[800px] 2xl:w-[800px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x mandatory',
      }}
    >
      {/* Category Buttons (Text only) */}
      {CATEGORY_OPTIONS.map((cat) => (
        <button
          key={cat}
          className={`flex items-center justify-center p-2 min-w-[120px] border rounded-lg shadow-md snap-start whitespace-nowrap font-semibold text-sm ${
            category === cat ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'
          }`}
          onClick={() => handleCategoryClick(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  </div>
)}


      {filterMode === 'cities' && (
        <div className="overflow-hidden mb-4">
          <div className="flex overflow-x-auto gap-2 py-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            {cities.map((city) => (
              <button
                key={city.name}
                className={`flex flex-col items-center justify-center p-4 min-w-[140px] border rounded-lg shadow-md cursor-pointer snap-start  ${
                  location === city.coordinates ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'
                }`}
                onClick={() => handleCityClick(city)}
              >
                <FaCity className="text-2xl text-gray-600 mb-1" />
                <span className="text-sm font-semibold">{city.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Events Grid */}
      <EventsGrid events={events} eventStatus={eventStatus} />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={(p) => dispatch(updateEventFilter({ page: p }))}
      />
    </div>
  );
};

export default EventsPage;
