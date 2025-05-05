'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addAdvert, clearAdverts } from '@/store/slices/adverts/advertSlice';
import {
  CATEGORY_OPTIONS,
  CATEGORIES_REQUIRING_CONDITION,
  FIELD_HINTS,
  CATEGORIES_NOT_REQUIRING_PRICE,
  CATEGORIES_HIDE_ISFORHIRE,
  CATEGORIES_HIDE_ISFORSHARE,
} from '@/components/adverts/addadvert/AdvertCategories';
import AdTypeToggle from '@/components/adverts/addadvert/AdTypeToggle';
import PriceToggle from '@/components/adverts/addadvert/PriceToggle';
import AddressInput from '@/components/adverts/addadvert/AddressInput';
import ImageUploader from '@/components/adverts/addadvert/ImageUploader';
import ConditionToggle from '@/components/adverts/addadvert/ConditionToggle';
import { toast } from 'react-toastify';
import Link from 'next/link';




const libraries = ['places'];

const NewAdvertPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const tokenValidated = useSelector((state) => state.user.tokenValidated);
  const { user } = useSelector((state) => state.user);
  const { status, error } = useSelector((state) => state.advert);

  // Initial form statee
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    isOffered: true,
    isWanted: false,
    condition: null,
    isForSale: false,
    sellPrice: 0,
    isForHire: false,
    hirePrice: 0,
    hireUnit: 'hour',
    isForRent: false,
    rentPrice: 0,
    rentUnit: 'week',
    isForShare: false,
    sharePrice: 0,
    shareUnit: 'week',
    description: '',
    address: {
      formattedAddress: '',
      streetNumber: '',
      street: '',
      suburb: '',
      state: '',
      postalCode: '',
      location: {
        // ✅ Ensure location exists from the start
        type: 'Point',
        coordinates: [0, 0], // Default empty coordinates
      },
    },
    email: user?.email || '',
    name: user?.name || '',
    images: [],
  });



  // ✅ Check if the selected category needs a "Condition" field
  const shouldShowCondition = CATEGORIES_REQUIRING_CONDITION.includes(
    formData.category
  );

  const shouldShowPrice =
    formData.isOffered &&
    !CATEGORIES_NOT_REQUIRING_PRICE.includes(formData.category);

  const [autocomplete, setAutocomplete] = useState(null);
  const [preview, setPreview] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null); // State to track the focused field

  const handleFocus = (field) => {
    setFocusedField(field); // Set the focused field
  };

  const handleBlur = () => {
    setFocusedField(null); // Clear the hint when the field loses focus
  };


// ✅ Add handlePlaceChanged RIGHT HERE:
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
};
  };



  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      let updatedData = { ...prev };
    
      if (type === 'checkbox') {
        updatedData[name] = checked;
      } else if (name.startsWith('address')) {
        const [, key] = name.split('.');
        updatedData.address = {
          ...prev.address,
          [key]: value,
          location: prev.address.location, // ✅ Keep location intact
        };
      } else {
        updatedData[name] = value;
      }
    
      // ✅ Reset "condition" if the selected category does NOT require it
      if (name === 'category') {
        const shouldHideHire = CATEGORIES_HIDE_ISFORHIRE.includes(value);
        const shouldHideShare = CATEGORIES_HIDE_ISFORSHARE.includes(value);
        const isCategoryWithoutPrice = CATEGORIES_NOT_REQUIRING_PRICE.includes(value);
      
        if (!CATEGORIES_REQUIRING_CONDITION.includes(value)) {
          updatedData.condition = null;
        }
      
        if (shouldHideHire) {
          updatedData.isForHire = false;
          updatedData.hirePrice = 0;
          updatedData.hireUnit = 'hour';
        }
      
        if (shouldHideShare) {
          updatedData.isForShare = false;
          updatedData.sharePrice = 0;
          updatedData.shareUnit = 'week';
        }
      
        if (isCategoryWithoutPrice) {
          updatedData.isForSale = false;
          updatedData.sellPrice = 0;
          updatedData.isForRent = false;
          updatedData.rentPrice = 0;
          updatedData.rentUnit = 'week';
          updatedData.isForHire = false;
          updatedData.hirePrice = 0;
          updatedData.hireUnit = 'hour';
          updatedData.isForShare = false;
          updatedData.sharePrice = 0;
          updatedData.shareUnit = 'week';
        }
      }
      
    
      return updatedData;
    });
    
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validation mapping.
    const validations = [
      {
        condition: !tokenValidated && (!formData.email || !formData.name),
        message: 'Email and Name are required for non-logged-in users.',
      },
      {
        condition: !formData.title,
        message: 'Title is required.',
      },
      {
        condition: !formData.category,
        message: 'Category is required.',
      },
      {
        condition:
          shouldShowCondition && formData.isForSale && !formData.condition,
        message: 'Condition is required.',
      },

      {
        condition: !formData.isOffered && !formData.isWanted,
        message: 'Ad type is required.',
      },
      {
        condition:
          !formData.isForSale &&
          !formData.isForHire &&
          !formData.isForRent &&
          !formData.isForShare &&
          !CATEGORIES_NOT_REQUIRING_PRICE.includes(formData.category),
        message: 'Price Type is required.',
      },
      {
        condition: formData.isForSale && (!formData.sellPrice || formData.sellPrice <= 0),
        message: 'Sell price is required.',
      },
      {
        condition: formData.isForHire && (!formData.hirePrice || formData.hirePrice <= 0),
        message: 'Hire price is required.',
      },
      {
        condition: formData.isForRent && (!formData.rentPrice || formData.rentPrice <= 0),
        message: 'Rent price is required.',
      },
      {
        condition: formData.isForShare && (!formData.sharePrice || formData.sharePrice <= 0),
        message: 'Share price must be greater than 0.',
      },
      {
        condition: !formData.description,
        message: 'Description is required.',
      },
      {
        condition: !formData.address.formattedAddress,
        message: 'Address is required.',
      },
    ];

    // Filter all failed validations
    const errors = validations
      .filter(({ condition }) => condition)
      .map(({ message }) => message);

    // Show all validation errors as a single toast
    if (errors.length > 0) {
      toast.error(
        <div className="space-y-1">
          {' '}
          {/* Tailwind spacing utility for consistent gaps */}
          {errors.map((msg, index) => (
            <p key={index} className="text-sm text-red-600">
              {' '}
              {/* Tailwind for styling */}
              {msg}
            </p>
          ))}
        </div>,
        {
          position: 'top-right',
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          hideProgressBar: false,
        }
      );
      return;
    }

    if (!CATEGORIES_REQUIRING_CONDITION.includes(formData.category)) {
      formData.condition = null;
    }

    
    const formPayload = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      switch (key) {
        case 'images':
          // Append each selected image to FormData
          value.forEach((file) => formPayload.append('images', file));
          break;

        case 'condition':
          if (value === 'New' || value === 'Used') {
            formPayload.append(key, value);
          }
          break;

        case 'address':
          // Convert the address object to JSON before appending
          formPayload.append(key, JSON.stringify(value));
          break;

        case 'isForHire':
        case 'isForSale':
        case 'isForRent':
        case 'isForShare':
          // Convert boolean values to string ("true"/"false") to be safely sent via FormData
          formPayload.append(key, value ? 'true' : 'false');
          break;

        case 'hirePrice':
        case 'sellPrice':
        case 'rentPrice':
        case 'sharePrice':
          // Ensure number values are stored as strings to avoid sending null/undefined
          formPayload.append(key, value !== undefined ? value.toString() : '0');
          break;

        default:
          // Append all other form fields safely
          formPayload.append(key, value ?? ''); // Use nullish coalescing to prevent undefined issues
      }
    });

    try {
      const resultAction = await dispatch(addAdvert(formPayload));
      console.log('🔹 Dispatch result:', resultAction);
      if (addAdvert.fulfilled.match(resultAction)) {
        toast.success('Advert successfully added!');
        setFormData({
          title: '',
          description: '',
          category: '',
          isOffered: true, // Match initial state
          isWanted: false, // Match initial state
          condition: null, // Match initial state
          isForSale: false,
          sellPrice: 0,
          isForHire: false,
          hirePrice: 0,
          hireUnit: 'hour',
          isForRent: false,
          rentPrice: 0,
          rentUnit: 'week',
          address: {
            formattedAddress: '',
            streetNumber: '',
            street: '',
            suburb: '',
            state: '',
            postalCode: '',
            location: {
              type: 'Point',
              coordinates: [0, 0],
            },
          },
          email: user?.email || '',// Retain logic for logged-in users
          name: user?.name || '',
          images: [], // Reset images to empty array
        });

        setPreview([]);
        await router.push(tokenValidated ? '/users/profile/manageads' : '/');
        dispatch(clearAdverts());
      } else {
        console.error('❌ Dispatch failed:', resultAction);
        toast.error(resultAction.payload || 'Failed to add advert.');
      }
    } catch (error) {
      console.error('Error adding advert:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-teal-700">Add New Advert</h1>
      {!tokenValidated ? (
        <div className="border rounded-lg p-4 shadow-md bg-white text-center">
          <p className="text-gray-700 mb-4 text-xs sm:text-base">
            You must be logged in to add a new advert.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/login?preserveRedirect=true"
              onClick={() => {
                localStorage.setItem('redirectAfterLogin', '/adverts/add');
              }}
              className="px-4 py-2 text-xs sm:text-base bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100"
            >
              Login
            </Link>
            <Link
              href="/register?preserveRedirect=true"
              onClick={() => {
                localStorage.setItem('redirectAfterLogin', '/adverts/add');
              }}
              className="px-4 py-2 text-xs sm:text-base bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100"
            >
              Register
            </Link>
          </div>
        </div>
      ) : (
        <>
          
          {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
          {successMessage && (
            <p className="text-green-500 mb-4">{successMessage}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email and Name */}
            {!tokenValidated && (
              <>
                <div>
                  <label className="block font-bold">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => handleFocus('email')}
                    onBlur={handleBlur}
                    className="w-full p-2 border rounded"
                  />
                  {focusedField === 'email' && (
                    <p className="text-sm text-gray-500 mt-1">
                      {FIELD_HINTS.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => handleFocus('name')}
                    onBlur={handleBlur}
                    className="w-full p-2 border rounded"
                  />
                  {focusedField === 'name' && (
                    <p className="text-sm text-gray-500 mt-1">
                      {FIELD_HINTS.name}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Title */}
            <div>
              <label className="block font-bold">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Ad Type Toggle  */}
            <AdTypeToggle formData={formData} setFormData={setFormData} />

            {/* Category */}
            <div>
              <label className="block font-bold">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {CATEGORY_OPTIONS.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Your Price */}
            {shouldShowPrice && (
              <PriceToggle formData={formData} setFormData={setFormData} category={formData.category}/>
            )}

            {/* Condition*/}
            {shouldShowCondition && formData.isForSale && (
              <ConditionToggle formData={formData} setFormData={setFormData} />
            )}

            {/* Description */}
            <div>
              <label className="block font-bold">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                onFocus={() => handleFocus('description')}
                onBlur={handleBlur}
                className="w-full p-05 border rounded h-48"
              />
              {focusedField === 'description' && (
                <div className="text-sm text-gray-500 mt-1 space-y-1">
                  {Array.isArray(FIELD_HINTS.description) ? (
                    FIELD_HINTS.description.map((line, index) => (
                      <p key={index}>{line}</p>
                    ))
                  ) : (
                    <p>{FIELD_HINTS.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Address */}
            <AddressInput
              formData={formData}
              setFormData={setFormData}
              focusedField={focusedField}
              handleFocus={handleFocus}
              handleBlur={handleBlur}
              handlePlaceChanged={handlePlaceChanged}
              setAutocomplete={setAutocomplete}
            />

            {/* Image Upload */}
            <ImageUploader
              preview={preview}
              setPreview={setPreview}
              formData={formData}
              setFormData={setFormData}
            />

            {/* Submit and Cancel Buttons */}
            <div className="flex gap-4 mt-4">
              {/* Submit Button */}
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Advert
              </button>
              {/* cancel Button */}
              <button
                type="button"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => {
                  const backTo = localStorage.getItem('cancelRedirectUrl');
                  localStorage.removeItem('cancelRedirectUrl');
                  router.push(backTo || '/');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default NewAdvertPage;
