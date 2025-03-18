'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addAdvert, clearAdverts } from '@/store/slices/advertSlice';
import {
  CATEGORY_OPTIONS,
  CATEGORIES_REQUIRING_CONDITION,
  FIELD_HINTS
} from '@/components/addadvert/AdvertCategories';
import AdTypeToggle from '@/components/addadvert/AdTypeToggle';
import PriceToggle from '@/components/addadvert/PriceToggle';
import AddressInput from '@/components/addadvert/AddressInput';
import ImageUploader from '@/components/addadvert/ImageUploader';
import ConditionToggle from '@/components/addadvert/ConditionToggle';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { toast } from 'react-toastify';

const libraries = ['places'];

const NewAdvertPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const isLoggedIn = useSelector((state) => state.user.tokenValidated);
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
    isRequestQuote: false,
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
    email: isLoggedIn && user ? user.email : '',
    name: isLoggedIn && user ? user.name : '',
    images: [],
  });



  // ✅ Check if the selected category needs a "Condition" field
  const shouldShowCondition = CATEGORIES_REQUIRING_CONDITION.includes(
    formData.category
  );

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
      if (
        name === 'category' &&
        !CATEGORIES_REQUIRING_CONDITION.includes(value)
      ) {
        updatedData.condition = null;
      }

      return updatedData;
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + preview.length > 3) {
      toast.error('You can upload up to 3 images only.');
      return;
    }
    setPreview((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const handleRemoveImage = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    console.log("🔹 Submitting advert...");
    // Validation mapping.
    const validations = [
      {
        condition: !isLoggedIn && (!formData.email || !formData.name),
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
        condition: shouldShowCondition && !formData.condition,
        message: 'Condition is required for this category.',
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
          !formData.isRequestQuote,
        message: 'Price is required.',
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
        case 'isRequestQuote':
          // Convert boolean values to string ("true"/"false") to be safely sent via FormData
          formPayload.append(key, value ? 'true' : 'false');
          break;

        case 'hirePrice':
        case 'sellPrice':
        case 'rentPrice':
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
      console.log("🔹 Dispatch result:", resultAction);
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
          isRequestQuote: false,
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
          email: isLoggedIn && user ? user.email : '', // Retain logic for logged-in users
          name: isLoggedIn && user ? user.name : '',
          images: [], // Reset images to empty array
        });

        setPreview([]);
        await router.push(isLoggedIn ? '/users/profile/manageads' : '/adverts');
        dispatch(clearAdverts());
      } else {
        console.error("❌ Dispatch failed:", resultAction);
        throw new Error(resultAction.payload || 'Failed to add advert.');
      }
    } catch (error) {
      console.error('Error adding advert:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Advert</h1>
      {status === 'loading' && (
        <p className="text-blue-500 mb-4">Adding advert...</p>
      )}
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      {successMessage && (
        <p className="text-green-500 mb-4">{successMessage}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email and Name */}
        {!isLoggedIn && (
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
                <p className="text-sm text-gray-500 mt-1">{FIELD_HINTS.email}</p>
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
                <p className="text-sm text-gray-500 mt-1">{FIELD_HINTS.name}</p>
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

        {/* Condition*/}
        {shouldShowCondition && (
  <ConditionToggle formData={formData} setFormData={setFormData} />
)}


        {/* Ad Type Toggle  */}
        <AdTypeToggle formData={formData} setFormData={setFormData} />

        {/* Your Price */}
         <PriceToggle formData={formData} setFormData={setFormData} />
          
  
        {/* Description */}
        <div>
          <label className="block font-bold">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            onFocus={() => handleFocus('description')}
            onBlur={handleBlur}
            className="w-full p-05 border rounded"
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
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewAdvertPage;
