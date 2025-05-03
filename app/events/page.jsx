'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateEventFilter,
  fetchAllEvents, fetchEventsByCategory, fetchEventsCustomCategory,
  fetchEventsByLocation, resetEventFilters } from '@/store/slices/events/filterEventSlice';
import EventsGrid from '@/components/events/eventcomponents/EventsGrid';
import Pagination from '@/components/Pagination';
import SelectSlider from '@/components/SelectSlider';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import Link from 'next/link';
import { format, parse, addMonths } from 'date-fns';

const libraries = ['places'];

const MODES = [
  { label: 'All', value: 'all' },
  { label: 'Categories', value: 'categories' },
  { label: 'Cities', value: 'locations' },
  { label: 'Custom ', value: 'customCategories' },
];

const categoryOptions = [
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

const CUSTOM_CATEGORIES = [
  'Technology',
  'Real Estate',
  'Community & Cultural',
];

const EventsPage = () => {
  const dispatch = useDispatch();
  const { mode, all, categories, locations, customCategories, events, meta, status } = useSelector((state) => state.eventFilters);
  const [locationInput, setLocationInput] = useState(all.locationInputText || '');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  
  // Current month handling
  const currentMonth = format(new Date(), 'yyyy-MM');
  // Start with no month selected (empty string)
  const [selectedMonthDisplay, setSelectedMonthDisplay] = useState(() => {
    const currentMode = mode;
    const selectedMonth = currentMode === 'all' 
      ? all.selectedMonth 
      : currentMode === 'categories'
        ? categories.selectedMonth
        : currentMode === 'locations'
          ? locations.selectedMonth
          : customCategories.selectedMonth;
    
    return selectedMonth || '';
  });
  
  const [isMonthSelected, setIsMonthSelected] = useState(!!selectedMonthDisplay);

  // 🔥 Dispatcher based on selected mode
  useEffect(() => {
    if (mode === 'all') {
      dispatch(fetchAllEvents());
    } else if (mode === 'categories') {
      dispatch(fetchEventsByCategory());
    } else if (mode === 'locations') {
      dispatch(fetchEventsByLocation());
    } else if (mode === 'customCategories') {
      dispatch(fetchEventsCustomCategory());
    }
  }, [mode, all, categories, locations, customCategories, dispatch]);


  const handleModeChange = (newMode) => {
    dispatch(resetEventFilters(newMode));    // Reset filters per selected mode
    setLocationInput('');                     // Reset local input
    setSelectedMonthDisplay('');              // Reset month display to "Select Month"
    setIsMonthSelected(false);                // Reset month selection state
  };

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        dispatch(updateEventFilter({
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
    dispatch(resetEventFilters(mode));
    setLocationInput('');
    setSelectedMonthDisplay('');
    setIsMonthSelected(false);
    
    // Explicitly set selectedMonth to empty string to show all future events
    dispatch(updateEventFilter({
      mode: mode,
      values: { selectedMonth: '' }
    }));
  };
  
  const handleMonthChange = (direction) => {
    // If no month is currently selected, start with the current month
    if (!isMonthSelected) {
      setSelectedMonthDisplay(currentMonth);
      setIsMonthSelected(true);
      
      dispatch(updateEventFilter({
        mode: mode,
        values: { selectedMonth: currentMonth }
      }));
      return;
    }

    // If month is already selected, navigate as usual
    const currentDate = parse(selectedMonthDisplay, 'yyyy-MM', new Date());
    const newDate = addMonths(currentDate, direction);
    const formattedMonth = format(newDate, 'yyyy-MM');
    
    setSelectedMonthDisplay(formattedMonth);
    
    dispatch(updateEventFilter({
      mode: mode,
      values: { selectedMonth: formattedMonth }
    }));
  };

  return (
    <div className="flex flex-col">
      <div className="my-2 px-4">
        <div className="flex justify-start">
          <Link
            href="/events/add"
            className="bg-yellow-400 text-teal-700 hover:bg-teal-700 hover:text-lime-100 px-3 py-1.5 rounded-tr-xl rounded-bl-xl shadow-lg text-sm sm:text-base font-semibold transition duration-200"
          >
            Post Event
          </Link>
        </div>
      </div>

      {/* Discover Events - Centered header with gradient background */}
      <div className="my-2 px-4 py-6 bg-gradient-to-br from-teal-950 to-teal-100 shadow-sm rounded-md flex justify-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-yellow-400 tracking-tight flex items-center gap-2 text-center animate-[pulsezoom_1.5s_ease-in-out_infinite]">
          <span>Plan</span>
          <span className="text-yellow-400">•</span>
          <span>Attend</span>
          <span className="text-yellow-400">•</span>
          <span>Connect</span>
        </h1>
      </div>

      {/* 🌟 Mode Selector */}
      <div className="flex justify-center mb-4 gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => handleModeChange(m.value)}
            className={`px-3 py-1 rounded text-xs sm:text-base font-semibold ${
              mode === m.value ? 'bg-teal-700 text-lime-100' : 'text-teal-700 hover:bg-lime-100'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 🟢 Month Selection (common for all modes) */}
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMonthChange(-1)}
            className="px-2 py-1 rounded bg-teal-700 text-lime-100 hover:bg-teal-800"
            aria-label="Previous Month"
          >
            ◀
          </button>
          <span className="font-semibold min-w-[120px] text-center text-xs sm:text-base">
            {isMonthSelected 
              ? format(parse(selectedMonthDisplay, 'yyyy-MM', new Date()), 'MMMM yyyy')
              : "Select Month"}
          </span>
          <button
            onClick={() => handleMonthChange(1)}
            className="px-2 py-1 rounded bg-teal-700 text-lime-100 hover:bg-teal-800"
            aria-label="Next Month"
          >
            ▶
          </button>
        </div>
      </div>

      {/* 🟢 Filters for ALL mode */}
      {mode === 'all' && (
        <div className="flex flex-col text-xs sm:text-base md:flex-row justify-center gap-4 mb-4 px-4">
          <SelectSlider
            options={categoryOptions}
            value={all.category || 'All Categories'}
            onChange={(selected) =>
              dispatch(
                updateEventFilter({
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
                      dispatch(updateEventFilter({ mode: 'all', values: { location: '' } }));
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
              dispatch(updateEventFilter({ mode: 'all', values: { proximity: parseInt(e.target.value) } }))
            }
          />
        </div>
      )}

      {/* 🟢 Filters for CATEGORIES mode */}
      {mode === 'categories' && (
        <div className="flex flex-col items-center mb-4 px-4">
          <div className="w-full max-w-5xl border rounded p-3 overflow-x-auto">
            <div
              className="grid grid-flow-col auto-cols-max gap-1 sm:gap-4"
              style={{ gridAutoRows: 'minmax(40px, auto)', minWidth: 'max-content' }}
            >
              {categoryOptions.map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-lime-100 rounded"
                >
                  <input
                    type="checkbox"
                    checked={categories.selectedCategories.includes(category)}
                    onChange={(e) => {
                      const selected = categories.selectedCategories.includes(category)
                        ? categories.selectedCategories.filter((c) => c !== category)
                        : [...categories.selectedCategories, category];
                      dispatch(
                        updateEventFilter({
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

      {/* 🟢 Filters for Locations mode */}
      {mode === 'locations' && (
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
                    checked={locations.location === city.coordinates}
                    onChange={() =>
                      dispatch(
                        updateEventFilter({
                          mode: 'locations',
                          values: { location: city.coordinates },
                        })
                      )
                    }
                  />
                  <span className="text-xs sm:text-base">{city.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Filters for Custom Categories mode */}
      {mode === 'customCategories' && (
        <div className="flex flex-col items-center mb-4 px-4">
          <div className="w-full max-w-5xl border rounded p-3 overflow-x-auto">
            <div
              className="grid grid-flow-col auto-cols-max gap-1 sm:gap-4"
              style={{ gridAutoRows: 'minmax(40px, auto)', minWidth: 'max-content' }}
            >
              {CUSTOM_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-lime-100 rounded sm:p-2"
                >
                  <input
                    type="checkbox"
                    checked={customCategories.selectedCategories.includes(category)}
                    onChange={() => {
                      const selected = customCategories.selectedCategories.includes(category)
                        ? customCategories.selectedCategories.filter((c) => c !== category)
                        : [...customCategories.selectedCategories, category];
                      dispatch(
                        updateEventFilter({
                          mode: 'customCategories',
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

      {/* 🔷 Event Listing */}
      <EventsGrid events={events} eventStatus={status} />
      <Pagination
        currentPage={all.page}
        totalPages={meta?.totalPages || 1}
        onPageChange={(pageNum) =>
          dispatch(updateEventFilter({ mode, values: { page: pageNum } }))
        }
      />
    </div>
  );
};

export default EventsPage;