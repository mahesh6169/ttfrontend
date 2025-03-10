'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addAdvert, clearAdverts } from '@/store/slices/advertSlice';
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

  const categoryOptions = [
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

  const categoriesRequiringCondition = [
    'Electronics & Computer',
    'Cars & Vehicles',
    'Clothing & Jewellery',
    'Home & Garden',
    'Sport & Fitness',
    'Antiques, Art & Collectables',
    'Baby & Children',
  ];

  // ✅ Check if the selected category needs a "Condition" field
  const shouldShowCondition = categoriesRequiringCondition.includes(
    formData.category
  );

  const [autocomplete, setAutocomplete] = useState(null);
  const [preview, setPreview] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null); // State to track the focused field

  // Field-specific hints
  const fieldHints = {
    email: 'Required to avoid spam.',
    name: 'Required to avoid spam.',
    description: [
      ' Hint: ',
      'Provide detailed information about your advert.',
      'Include dimensions, condition, and any special features.',
    ],
    address: [
      ' Hint: ',
      'If you dont have business address, please provide your suburb to get listed on search results.',
    ],
  };

  const handleFocus = (field) => {
    setFocusedField(field); // Set the focused field
  };

  const handleBlur = () => {
    setFocusedField(null); // Clear the hint when the field loses focus
  };

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        console.error('No valid location data found');
        return;
      }

      // Extract longitude and latitude
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // Extract address details
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

      // Ensure location is included in formData
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
            coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
          },
        },
      }));
    }
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
        !categoriesRequiringCondition.includes(value)
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
    // Validation mapping
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

    if (!categoriesRequiringCondition.includes(formData.category)) {
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
                <p className="text-sm text-gray-500 mt-1">{fieldHints.email}</p>
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
                <p className="text-sm text-gray-500 mt-1">{fieldHints.name}</p>
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
            {categoryOptions.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Condition*/}
        {shouldShowCondition && (
          <div className="mb-4">
            <label className="block font-bold mb-2">Condition</label>
            <div className="flex border border-gray-500 rounded overflow-hidden">
              {/* New Condition Button */}
              <button
                type="button"
                className={`flex-1 p-2 text-center border-r-2 ${
                  formData.condition === 'New'
                    ? 'bg-gray-200 border-gray-500' // Selected: Grey Highlight & Strong Border
                    : 'bg-white border-gray-300' // Unselected: Light Grey Border
                }`}
                onClick={() =>
                  setFormData({
                    ...formData,
                    condition: 'New',
                  })
                }
              >
                New
              </button>

              {/* Used Condition Button */}
              <button
                type="button"
                className={`flex-1 p-2 text-center ${
                  formData.condition === 'Used'
                    ? 'bg-gray-200 border-gray-500' // Selected: Grey Highlight & Strong Border
                    : 'bg-white border-gray-300' // Unselected: Light Grey Border
                }`}
                onClick={() =>
                  setFormData({
                    ...formData,
                    condition: 'Used',
                  })
                }
              >
                Used
              </button>
            </div>
          </div>
        )}

        {/* Ad Type Toggle */}
        <div className="mb-4">
          <label className="block font-bold mb-2">Ad Type</label>

          <div className="flex border rounded">
            <button
              type="button"
              className={`flex-1 p-2 ${
                formData.isOffered
                  ? 'bg-gray-200 border-gray-500'
                  : 'bg-white border-gray-300'
              }`}
              onClick={() =>
                setFormData({ ...formData, isOffered: true, isWanted: false })
              }
            >
              Offered
            </button>

            <button
              type="button"
              className={`flex-1 p-2 ${
                formData.isWanted
                  ? 'bg-gray-200 border-gray-500'
                  : 'bg-white border-gray-300'
              }`}
              onClick={() =>
                setFormData({ ...formData, isOffered: false, isWanted: true })
              }
            >
              Wanted
            </button>
          </div>
        </div>

        {/* Your Price */}
        <div className="mb-4">
          <label className="block font-bold mb-2">Price</label>

          {/* Price Type Toggle Buttons */}
          <div className="flex border border-gray-500 rounded overflow-hidden">
            {/* Sell Option */}
            <button
              type="button"
              className={`flex-1 p-2 text-center border-r-2 ${
                formData.isForSale
                  ? 'bg-gray-200 border-gray-500' // Selected: Grey Highlight & Strong Border
                  : 'bg-white border-gray-300' // Unselected: Light Grey Border
              }`}
              onClick={() =>
                setFormData({
                  ...formData,
                  isForSale: true,
                  isForHire: false,
                  isForRent: false,
                  isRequestQuote: false,
                })
              }
            >
              Sell
            </button>

            {/* Hire Option */}
            <button
              type="button"
              className={`flex-1 p-2 text-center border-r-2 ${
                formData.isForHire
                  ? 'bg-gray-200 border-gray-500' // Selected: Grey Highlight & Strong Border
                  : 'bg-white border-gray-300' // Unselected: Light Grey Border
              }`}
              onClick={() =>
                setFormData({
                  ...formData,
                  isForHire: true,
                  isForSale: false,
                  isForRent: false,
                  isRequestQuote: false,
                })
              }
            >
              Hire
            </button>

            {/* Rent Option */}
            <button
              type="button"
              className={`flex-1 p-2 text-center border-r-2 ${
                formData.isForRent
                  ? 'bg-gray-200 border-gray-500' // Selected: Grey Highlight & Strong Border
                  : 'bg-white border-gray-300' // Unselected: Light Grey Border
              }`}
              onClick={() =>
                setFormData({
                  ...formData,
                  isForRent: true,
                  isForSale: false,
                  isForHire: false,
                  isRequestQuote: false,
                })
              }
            >
              Rent
            </button>

            {/* Request Quote Option */}
            <button
              type="button"
              className={`flex-1 p-2 text-center ${
                formData.isRequestQuote
                  ? 'bg-gray-200 border-gray-500' // Selected: Grey Highlight & Strong Border
                  : 'bg-white border-gray-300' // Unselected: Light Grey Border
              }`}
              onClick={() =>
                setFormData({
                  ...formData,
                  isRequestQuote: true,
                  isForSale: false,
                  isForHire: false,
                  isForRent: false,
                })
              }
            >
              Quote
            </button>
          </div>

          {/* Conditional Input Fields */}
          <div className="mt-4">
            {/* Sell Price Input */}
            {formData.isForSale && (
              <input
                type="number"
                name="sellPrice"
                value={formData.sellPrice}
                onChange={handleChange}
                placeholder="Enter your price"
                className="w-full p-2 border rounded"
              />
            )}

            {/* Hire Inputs */}
            {formData.isForHire && (
              <>
                <input
                  type="number"
                  name="hirePrice"
                  value={formData.hirePrice}
                  onChange={handleChange}
                  placeholder="Enter hire price"
                  className="w-full p-2 border rounded mb-2"
                />
                <select
                  name="hireUnit"
                  value={formData.hireUnit}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
                </select>
              </>
            )}

            {/* Rent Inputs */}
            {formData.isForRent && (
              <>
                <input
                  type="number"
                  name="rentPrice"
                  value={formData.rentPrice}
                  onChange={handleChange}
                  placeholder="Enter rent price"
                  className="w-full p-2 border rounded mb-2"
                />
                <select
                  name="rentUnit"
                  value={formData.rentUnit}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="week">Per Week</option>
                  <option value="month">Per Month</option>
                </select>
              </>
            )}

            {/* Request Quote Message */}
            {formData.isRequestQuote && (
              <p className="text-sm text-gray-500">
                You have chosen to allow users to request a quote. No price
                input is required.
              </p>
            )}
          </div>
        </div>

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
              {Array.isArray(fieldHints.description) ? (
                fieldHints.description.map((line, index) => (
                  <p key={index}>{line}</p>
                ))
              ) : (
                <p>{fieldHints.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Address */}
        <div>
          {/* Label for Address Input */}
          <label className="block font-bold">Address</label>

          {/* Load Google Maps API with Places Library */}
          <LoadScriptNext
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} // Uses API Key from environment variables
            libraries={libraries} // Loads Places API for autocomplete
          >
            {/* Google Places Autocomplete Component */}
            <Autocomplete
              onLoad={(auto) => setAutocomplete(auto)} // Stores the autocomplete instance in state
              onPlaceChanged={handlePlaceChanged} // Calls function when the user selects an address
              options={{
                componentRestrictions: { country: 'AU' }, // Restricts search results to Australia
              }}
            >
              {/* Address Input Field with onFocus and onBlur */}
              <input
                type="text"
                placeholder="Enter an address" // Placeholder text guiding user input
                className="w-full p-2 border rounded"
                onFocus={() => handleFocus('address')} // Set focused field to "address"
                onBlur={handleBlur} // Reset focus when input loses focus
              />
            </Autocomplete>
          </LoadScriptNext>

          {/* Display Address Field Hint Dynamically */}
          {focusedField === 'address' && (
            <div className="text-sm text-gray-500 mt-1 space-y-1">
              {Array.isArray(fieldHints.address) ? (
                fieldHints.address.map((line, index) => (
                  <p key={index}>{line}</p>
                ))
              ) : (
                <p>{fieldHints.address}</p>
              )}
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div>
          {/* Label for Image Upload */}
          <label className="block font-bold">Upload Images (Max 3)</label>

          {/* File Input for Selecting Multiple Images */}
          <input
            type="file" // Allows file selection
            multiple // Enables selecting multiple images
            accept="image/*" // Restricts selection to images only
            onChange={handleFileChange} // Calls handleFileChange when an image is selected
            className="w-full p-2 border rounded"
          />

          {/* Container for Image Previews */}
          <div className="mt-4 flex gap-4">
            {/* Loop through preview images and display each */}
            {preview.map((src, index) => (
              <div key={index} className="relative">
                {/* Display the Image Preview */}
                <img
                  src={src} // Uses the generated preview URL as the image source
                  alt={`Preview ${index + 1}`} // Accessibility: Shows index in alt text
                  className="w-24 h-24 object-cover border" // Styles image size & border
                />

                {/* Button to Remove an Image */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)} // Calls function to remove the selected image
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

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
