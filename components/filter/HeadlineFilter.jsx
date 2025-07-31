'use client';
import React from 'react';
import { useDispatch } from 'react-redux';
import { updateFilter } from '@/store/slices/adverts/searchAdvertsSlice';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';

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

const HeadlineFilter = ({ filters, onFiltersChange }) => {
  const dispatch = useDispatch();
  const [autocomplete, setAutocomplete] = React.useState(null);
  const [selectedState, setSelectedState] = React.useState(filters.state || '');
  const [locationInput, setLocationInput] = React.useState(filters.location || '');

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    onFiltersChange({ category: selectedCategory });
    dispatch(updateFilter({ filterType: 'category', value: selectedCategory }));
  };

  const handleStateChange = (state) => {
    if (selectedState === state) {
      // Deselect if clicking the same state
      setSelectedState('');
      onFiltersChange({ state: '', location: locationInput, coordinates: filters.coordinates });
      dispatch(updateFilter({ filterType: 'state', value: '' }));
    } else {
      // Select new state and clear location
      setSelectedState(state);
      setLocationInput('');
      onFiltersChange({ state, location: '', coordinates: null, proximity: null });
      dispatch(updateFilter({ filterType: 'state', value: state }));
      dispatch(updateFilter({ filterType: 'location', value: null }));
    }
  };

  const handleProximityChange = (e) => {
    const proximity = e.target.value;
    if (!selectedState) {
      onFiltersChange({ proximity: parseInt(proximity, 10) });
      dispatch(updateFilter({ filterType: 'proximity', value: parseInt(proximity, 10) }));
    }
  };

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.formatted_address) {
        console.error(
          'Invalid place object or missing geometry/formatted_address'
        );
        return;
      }

      const coordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      const formattedAddress = place.formatted_address;

      onFiltersChange({ location: formattedAddress });
      dispatch(updateFilter({ location: formattedAddress, coordinates }));
    } else {
      console.error('Autocomplete not loaded yet!');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <select
        className="p-2 border rounded"
        onChange={handleCategoryChange}
        value={filters.category || ''}
      >
        <option value="">All Categories</option>
        {categories.map((category, index) => (
          <option key={index} value={category}>
            {category}
          </option>
        ))}
      </select>

      <LoadScriptNext
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        libraries={['places']}
      >
        <Autocomplete
          onLoad={(auto) => setAutocomplete(auto)}
          onPlaceChanged={handlePlaceChanged}
          options={{
            componentRestrictions: { country: 'AU' },
          }}
        >
          <input
            type="text"
            placeholder="Enter location (Australia only)"
            className="p-2 border rounded"
            defaultValue={filters.location || ''}
          />
        </Autocomplete>
      </LoadScriptNext>

      <input
        type="number"
        className="p-2 border rounded"
        placeholder="Proximity (km)"
        min="1"
        value={filters.proximity}
        onChange={handleProximityChange}
      />
    </div>
  );
};

export default HeadlineFilter;
