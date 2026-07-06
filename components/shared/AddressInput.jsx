'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const AddressInput = ({
  formData,
  setFormData,
  errors = [],
  placeholder = 'Enter your address or suburb',
  disabled = false
}) => {
  const [formattedAddress, setFormattedAddress] = useState(
    formData?.address?.formattedAddress || ''
  );
  const autocompleteRef = useRef(null);
  const [isUserInput, setIsUserInput] = useState(false);
  const previousFormDataAddress = useRef(formData?.address?.formattedAddress);
  const [validationError, setValidationError] = useState('');

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry) {
      return;
    }

    // Block generic locations like just "Australia"
    const formattedAddressLower = (place.formatted_address || '').toLowerCase().trim();
    const genericLocations = ['australia', 'aus', 'au'];
    
    if (genericLocations.includes(formattedAddressLower)) {
      setValidationError('Please select a more specific location. Enter an address, suburb or city.');
      // Clear the input
      setFormattedAddress('');
      // Reset form data address
      setFormData((prev) => ({
        ...prev,
        address: {
          formattedAddress: '',
          streetNumber: '',
          street: '',
          suburb: '',
          state: '',
          postalCode: '',
          location: { type: 'Point', coordinates: [0, 0] }
        }
      }));
      return;
    }

    // Clear any previous validation error
    setValidationError('');

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
    console.log('[AddressInput] Input change:', value);
    setFormattedAddress(value);
    setIsUserInput(true);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
    
    // Update formData with the manually typed address
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        formattedAddress: value
      }
    }));
  };

  // Validate on blur to check if user manually entered generic location
  const handleInputBlur = () => {
    const valueLower = formattedAddress.toLowerCase().trim();
    const genericLocations = ['australia', 'aus', 'au'];
    
    if (genericLocations.includes(valueLower)) {
      setValidationError('Please enter a more specific location. Include an address, suburb or city.');
      // Don't clear it immediately, let them fix it
    }
  };

  // Reset user input flag when component unmounts
  useEffect(() => {
    return () => {
      setIsUserInput(false);
    };
  }, []);

  return (
    <div>
      <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
        Location <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-slate-500 mb-2">
        This helps users to find you by state/suburb.<br className="sm:hidden" />
        <span className="block sm:inline"> List suburb only if you are not operating from a business address.</span>
      </p>
      <LoadScriptNext
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        onLoad={() => console.log('[AddressInput] Google Maps script loaded')}
        onError={(error) => console.error('[AddressInput] Google Maps script error:', error)}
      >
        <Autocomplete
          onLoad={(auto) => {
            autocompleteRef.current = auto;
            console.log('[AddressInput] Autocomplete loaded:', !!auto);
            if (auto) {
              console.log('[AddressInput] Autocomplete instance:', auto);
              // Log any autocomplete errors
              try {
                const service = new google.maps.places.AutocompleteService();
                console.log('[AddressInput] AutocompleteService available:', !!service);
              } catch (e) {
                console.error('[AddressInput] Error checking AutocompleteService:', e);
              }
            }
          }}
          onPlaceChanged={handlePlaceChanged}
          options={{ componentRestrictions: { country: 'AU' } }}
        >
          <input
            type="text"
            placeholder={placeholder}
            className={`w-full p-2 border rounded ${validationError ? 'border-red-500' : ''}`}
            value={formattedAddress}
            onChange={handleInputChange}
            onFocus={(e) => console.log('[AddressInput] Input focused')}
            onBlur={(e) => {
              console.log('[AddressInput] Input blurred');
              handleInputBlur();
            }}
            disabled={disabled}
          />
        </Autocomplete>
      </LoadScriptNext>
      {validationError && (
        <p className="text-red-500 text-xs sm:text-sm mt-1">{validationError}</p>
      )}
    </div>
  );
};

export default AddressInput;