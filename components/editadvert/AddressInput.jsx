'use client';

import React from 'react';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { FIELD_HINTS } from './AdvertCategories';

const libraries = ['places'];

const AddressInput = ({
  formData,
  setFormData,
  autocomplete,
  setAutocomplete,
  handlePlaceChanged,
  handleFocus,
  handleBlur,
  focusedField,
}) => {
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
            value={formData.address.formattedAddress || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                address: {
                  ...prev.address,
                  formattedAddress: e.target.value,
                },
              }))
            }
            onFocus={() => handleFocus('address')}
            onBlur={handleBlur}
          />
        </Autocomplete>
      </LoadScriptNext>

      {focusedField === 'address' && (
        <div className="text-sm text-gray-500 mt-1 space-y-1">
          {Array.isArray(FIELD_HINTS.address) ? (
            FIELD_HINTS.address.map((line, index) => <p key={index}>{line}</p>)
          ) : (
            <p>{FIELD_HINTS.address}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
