'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const AddressInput = ({
  formData,
  setFormData,
  errors = [],
  placeholder = 'Enter your address or suburb',
  disabled = false,
  mode = 'add' // Add mode prop
}) => {
  const [formattedAddress, setFormattedAddress] = useState(
    formData?.address?.formattedAddress || ''
  );
  const autocompleteRef = useRef(null);
  const [isUserInput, setIsUserInput] = useState(false);
  const previousFormDataAddress = useRef(formData?.address?.formattedAddress);

  // Error styling function
  const getFieldClasses = (hasErrors) => {
    const baseClasses = 'w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2';
    const errorClasses = hasErrors ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300';
    const readOnlyClasses = disabled
      ? 'bg-slate-100 cursor-not-allowed text-slate-600'
      : '';

    return `${baseClasses} ${errorClasses} ${readOnlyClasses}`;
  };

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
      
      // Try multiple suburb types for Australian locations
      if (types.includes('locality')) parsed.suburb = comp.long_name;
      if (!parsed.suburb && types.includes('sublocality_level_1')) parsed.suburb = comp.long_name;
      if (!parsed.suburb && types.includes('administrative_area_level_2')) parsed.suburb = comp.long_name;
      if (!parsed.suburb && types.includes('postal_town')) parsed.suburb = comp.long_name;
      
      if (types.includes('administrative_area_level_1')) parsed.state = comp.short_name;
      if (types.includes('postal_code')) parsed.postalCode = comp.long_name;
    });

    // Fallback: Extract from formatted address if no suburb found
    if (!parsed.suburb && place.formatted_address) {
      parsed.suburb = place.formatted_address.split(',')[0].trim();
    }

    setFormData((prev) => ({
      ...prev,
      address: parsed,
    }));
    setFormattedAddress(parsed.formattedAddress);
    setIsUserInput(true);
  };

  // Only sync from formData when it's actually different and user hasn't typed
  useEffect(() => {
    if (!isUserInput && 
        formData?.address?.formattedAddress !== previousFormDataAddress.current) {
      setFormattedAddress(formData?.address?.formattedAddress || '');
      previousFormDataAddress.current = formData?.address?.formattedAddress;
    }
  }, [formData?.address?.formattedAddress, isUserInput]);

  // Handle manual input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormattedAddress(value);
    setIsUserInput(true);
    
    // Update formData with the manually typed address
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        formattedAddress: value
      }
    }));
  };

  // Reset user input flag when component unmounts
  useEffect(() => {
    return () => {
      setIsUserInput(false);
    };
  }, []);

  // Check if there are errors
  const hasErrors = errors && (Array.isArray(errors) ? errors.length > 0 : errors);

  return (
    <div>
      <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
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
            placeholder={disabled ? 'Event address' : placeholder}
            className={getFieldClasses(hasErrors)}
            value={formattedAddress}
            onChange={handleInputChange}
            disabled={disabled}
            maxLength="500"
          />
        </Autocomplete>
      </LoadScriptNext>
      
      {/* Error Display */}
      {hasErrors && (
        <p className="text-red-500 text-xs sm:text-sm mt-1">
          {Array.isArray(errors) ? errors[0] : errors}
        </p>
      )}
    </div>
  );
};

export default AddressInput;