'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const AddressInput = ({
  formData,
  setFormData,
  errors = [],
  placeholder = 'Enter your address or suburb',
}) => {
  const [formattedAddress, setFormattedAddress] = useState(
    formData?.address?.formattedAddress || ''
  );
  const autocompleteRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry) return;

    const parsed = {
      formattedAddress: place.formatted_address,
      streetNumber: '',
      street: '',
      suburb: '',
      state: '',
      postalCode: '',
      location: {
        type: 'Point',
        coordinates: [
          place.geometry.location.lng(),
          place.geometry.location.lat(),
        ],
      },
    };

    place.address_components.forEach((comp) => {
      const types = comp.types;
      if (types.includes('street_number')) parsed.streetNumber = comp.long_name;
      if (types.includes('route')) parsed.street = comp.long_name;
      if (types.includes('locality')) parsed.suburb = comp.long_name;
      if (types.includes('administrative_area_level_1')) parsed.state = comp.short_name;
      if (types.includes('postal_code')) parsed.postalCode = comp.long_name;
    });

    setFormData((prev) => ({
      ...prev,
      address: parsed,
    }));
    setFormattedAddress(parsed.formattedAddress);
  };

  // ✅ Fix: Sync formatted address from formData (for edit mode)
  useEffect(() => {
    if (formData?.address?.formattedAddress) {
      setFormattedAddress(formData.address.formattedAddress);
    }
  }, [formData?.address?.formattedAddress]);

  return (
    <div>
      <label className="block font-bold mb-2 text-gray-700">
        Address <span className="text-red-500">*</span>
      </label>
      <LoadScriptNext
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
      >
        <Autocomplete
          onLoad={(auto) => (autocompleteRef.current = auto)}
          onPlaceChanged={handlePlaceChanged}
          options={{ componentRestrictions: { country: 'AU' } }}
        >
          <input
            type="text"
            placeholder={placeholder}
            className="w-full p-2 border rounded"
            value={formattedAddress}
            onChange={(e) => setFormattedAddress(e.target.value)}
          />
        </Autocomplete>
      </LoadScriptNext>
    </div>
  );
};

export default AddressInput;
