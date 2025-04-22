'use client';

import React, { useState } from 'react';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { FIELD_HINTS } from './AdvertCategories'; // Reuse your constants!

const libraries = ['places'];

const AddressInput = ({
  formData,
  setFormData,
  focusedField,
  handleFocus,
  handleBlur,
}) => {
  const [autocomplete, setAutocomplete] = useState(null);

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        console.error('No valid location data found');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const formattedAddress = place.formatted_address || '';
      const addressComponents = place.address_components || [];

      let street = '',
        suburb = '',
        state = '',
        postalCode = '';

      addressComponents.forEach((component) => {
        const types = component.types;
        if (types.includes('route')) {
          street = component.long_name;
        }
        if (types.includes('locality')) {
          suburb = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        }
        if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      });

      setFormData((prev) => ({
        ...prev,
        address: {
          formattedAddress,
          street,
          suburb,
          state,
          postalCode,
          location: {
            type: 'Point',
            coordinates: [lng, lat],
          },
        },
      }));
    }
  };

  return (
    <div>
      <label className="block font-bold">Address</label>

      <LoadScriptNext
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
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
            placeholder="Enter an address"
            className="w-full p-2 border rounded"
            onFocus={() => handleFocus('address')}
            onBlur={handleBlur}
            defaultValue={formData.address?.formattedAddress || ''}
          />
        </Autocomplete>
      </LoadScriptNext>

      {focusedField === 'address' && (
        <div className="text-sm text-gray-500 mt-1 space-y-1">
          {Array.isArray(FIELD_HINTS.address) ? (
            FIELD_HINTS.address.map((line, index) => (
              <p key={index}>{line}</p>
            ))
          ) : (
            <p>{FIELD_HINTS.address}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
