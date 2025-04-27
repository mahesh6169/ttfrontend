'use client';
import { format, addMonths, parse } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateEventFilter,
  fetchEventsByFilter,
} from '@/store/slices/events/filterEventSlice';
import EventsGrid from '@/components/events/eventcomponents/EventsGrid';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import SelectSlider from '@/components/SelectSlider';
import Link from 'next/link';
import { FaCity } from 'react-icons/fa';

const libraries = ['places'];
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

/* 🟢 Centralized filter mode config for Events */
const eventFilterModesConfig = {
  input: {
    label: 'All',
    clear: (dispatch, setLocationInput) => {
      dispatch(
        updateEventFilter({ category: '', location: null, proximity: '10', page: 1 })
      );
      if (setLocationInput) setLocationInput('');
    },
    isActive: (filters) =>
      filters.category || filters.location || filters.proximity !== '10',
  },
  icons: {
    label: 'Categories',
    clear: (dispatch) => dispatch(updateEventFilter({ category: '', page: 1 })),
    isActive: (filters) => filters.category,
  },
  cities: {
    label: 'Cities',
    clear: (dispatch) =>
      dispatch(updateEventFilter({ location: '', proximity: '10', page: 1 })),
    isActive: (filters) => filters.location || filters.proximity !== '10',
  },
};


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
    selectedMonth,
  } = useSelector((state) => state.eventFilters);

  const [filterMode, setFilterMode] = useState('input');
  const [locationInput, setLocationInput] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [localMonth, setLocalMonth] = useState(currentMonth);

  const handleClearAll = () => {
    eventFilterModesConfig[filterMode].clear(dispatch, setLocationInput);
  };
  

  const isFilterActive = eventFilterModesConfig[filterMode].isActive({
    category,
    location,
    proximity,
  });

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    eventFilterModesConfig[mode].clear(dispatch, setLocationInput);
  };
  

  const handleCategoryClick = (selectedCategory) => {
    if (category === selectedCategory) {
      dispatch(updateEventFilter({ category: '', page: 1 }));
    } else {
      dispatch(updateEventFilter({ category: selectedCategory, page: 1 }));
    }
  };

  const handleCityClick = (city) => {
    if (location === city.coordinates) {
      dispatch(updateEventFilter({ location: '', proximity: 10, page: 1 }));
    } else {
      dispatch(
        updateEventFilter({
          location: city.coordinates,
          proximity: 50,
          page: 1,
        })
      );
    }
  };

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      const coordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      dispatch(
        updateEventFilter({ location: `${coordinates.lng},${coordinates.lat}` })
      );
      setLocationInput(place.formatted_address);
    }
  };

  const handleMonthChange = (direction) => {
    const parsed = parse(localMonth, 'yyyy-MM', new Date());
    const newDate = addMonths(parsed, direction);
    const formatted = format(newDate, 'yyyy-MM');
    setLocalMonth(formatted);
    dispatch(updateEventFilter({ selectedMonth: formatted, page: 1 }));
  };

  useEffect(() => {
    dispatch(updateEventFilter({ selectedMonth: currentMonth }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchEventsByFilter());
  }, [category, location, proximity, selectedMonth, page, limit, dispatch]);

  return (
    <div className="flex flex-col">
<div className="relative my-4">
  {/* Flex Row Always */}
  <div className="flex items-center justify-center">
    {/* Button (Absolute Positioned Relative to Parent) */}
    <div className="absolute left-0">
      <Link
        href="/events/add"
        className="text-xs sm:text-sm md:text-base p-2 md:p-4 bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 font-semibold text-center rounded"
      >
        Post Event
      </Link>
    </div>

    {/* Heading */}
    <div className="w-full">
      <h1 className="text-xs sm:text-lg md:text-lg text-center text-gray-900 font-semibold">
        Discover Events
      </h1>
    </div>
  </div>
</div>

     {/* 🔵 Filter Mode Switch */}
      <div className="flex justify-center gap-4 mb-4">
      {Object.keys(eventFilterModesConfig).map((mode) => (
  <button
    key={mode}
    onClick={() => handleFilterModeChange(mode)}
    className={`text-xs md:text-base p-1 rounded ${
      filterMode === mode
        ? 'bg-gray-300 text-gray-900 font-semibold'
        : 'bg-gray-100 text-gray-800'
    }`}
  >
    {eventFilterModesConfig[mode].label}
  </button>
))}

      </div>

        {/* 🎯 Filter Sections. */}
      {filterMode === 'input' && (
        <div className="text-xs md:text-base flex flex-col md:flex-row gap-1 md:gap-4 mb-4 justify-center">
          <SelectSlider
            options={['All Categories', ...CATEGORY_OPTIONS]}
            value={category || 'All Categories'}
            onChange={(val) =>
              dispatch(
                updateEventFilter({
                  category: val === 'All Categories' ? '' : val,
                })
              )
            }
          />

          <LoadScriptNext
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            onLoad={() => setIsScriptLoaded(true)}
          >
            {isScriptLoaded && (
              <Autocomplete
                onLoad={setAutocomplete}
                onPlaceChanged={handlePlaceChanged}
                options={{ componentRestrictions: { country: 'AU' } }}
              >
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
            onChange={(e) =>
              dispatch(
                updateEventFilter({ proximity: parseInt(e.target.value, 10) })
              )
            }
          />

        </div>
      )}

      {filterMode === 'icons' && (
        <div className="justify-center mb-4 mx-auto">
          {/* Scrollable Wrapper .*/}
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
                className={`flex items-center justify-center px-3 py-2 border rounded-lg shadow-md snap-start whitespace-nowrap font-semibold text-xs ${
                  category === cat
                    ? 'bg-gray-300'
                    : 'bg-white hover:bg-gray-100'
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
                  location === city.coordinates
                    ? 'bg-gray-300'
                    : 'bg-white hover:bg-gray-100'
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
      {/* 🗓️ Month Filter */}
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMonthChange(-1)}
            className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
            aria-label="Previous Month"
          >
            ◀
          </button>
          <span className="font-semibold min-w-[120px] text-center">
            {format(parse(localMonth, 'yyyy-MM', new Date()), 'MMMM yyyy')}
          </span>
          <button
            onClick={() => handleMonthChange(1)}
            className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
            aria-label="Next Month"
          >
            ▶
          </button>
        </div>
      </div>

   {/* 🟥 Clear Filter Button */}
   {isFilterActive && (
        <div className="flex justify-center ">
          <button
            onClick={handleClearAll}
            className="text-xs md:text-base p-1 md:p-1 rounded bg-red-500 text-white hover:bg-red-600"
          >
            Clear Filter
          </button>
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
