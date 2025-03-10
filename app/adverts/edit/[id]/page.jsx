'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import {  editAdvertById,   updateAdvertById,} from '@/store/slices/userAdvertsSlice';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';

const libraries = ['places'];

const EditAdvertPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();

  // Grab state from Redux
  const { currentAdvert, status, error } = useSelector((state) => state.userAdverts);

  /**
   * ---------------------------------------------------------------------
   * State Definitions
   * ---------------------------------------------------------------------
   */
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
        type: 'Point',
        coordinates: [0, 0],
      },
    },
    images: [], // New images (File objects) will go here
  });

  // Store existing image objects (from DB). Each image has { url, publicId, _id, ... }
  const [existingImages, setExistingImages] = useState([]);

  // For previewing newly added Files
  const [preview, setPreview] = useState([]);

  // Google Places Autocomplete
  const [autocomplete, setAutocomplete] = useState(null);

  // For error/success feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // For field hints
  const [focusedField, setFocusedField] = useState(null);

  /**
   * ---------------------------------------------------------------------
   * Effects: Fetch & Prefill
   * ---------------------------------------------------------------------
   */
  useEffect(() => {
    // Fetch the current advert by ID
    dispatch(editAdvertById(id));
  }, [dispatch, id]);

  

  useEffect(() => {
    // Once we have currentAdvert, populate the form & existing images
    if (currentAdvert) {
      setFormData((prev) => ({
        ...prev,
        ...currentAdvert,
        address: {
          // Merge nested address fields carefully
          ...prev.address,
          ...currentAdvert.address,
          location: {
            ...prev.address.location,
            ...currentAdvert.address?.location,
          },
        },
        // Reset new images (Files) to empty array each time we fetch
        images: [],
      }));

      // Store the existing image objects from DB into state
      if (
        Array.isArray(currentAdvert.images) &&
        currentAdvert.images.length > 0
      ) {
        setExistingImages(currentAdvert.images); // e.g. [ { url, publicId }, ... ]
      } else {
        setExistingImages([]);
      }
    }
  }, [currentAdvert]);

  /**
   * ---------------------------------------------------------------------
   * Data & UI Constants
   * ---------------------------------------------------------------------
   */
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

  const shouldShowCondition = categoriesRequiringCondition.includes(
    formData.category
  );

  const fieldHints = {
    email: 'Required to avoid spam.',
    name: 'Required to avoid spam.',
    description: [
      'Hint:',
      'Provide detailed information about your advert.',
      'Include dimensions, condition, and any special features.',
    ],
    address: [
      'Hint:',
      'If you dont have business address, please provide your suburb to get listed on search results.',
    ],
  };

  /**
   * ---------------------------------------------------------------------
   * Handlers
   * ---------------------------------------------------------------------
   */
  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  // Google Maps place changed
  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        console.error('No valid location data found');
        return;
      }

      // Extract lat/lng
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

  // Handle text/checkbox changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      let updatedData = { ...prev };

      if (type === 'checkbox') {
        updatedData[name] = checked;
      } else if (name.startsWith('address.')) {
        const key = name.split('.')[1];
        updatedData.address = { ...prev.address, [key]: value };
      } else {
        updatedData[name] = value;
      }

      // ✅ Reset "condition" if the selected category does NOT require it
      if (
        name === 'category' &&
        !categoriesRequiringCondition.includes(value)
      ) {
        updatedData.condition = '';
      }

      return updatedData;
    });
  };

  // Handle new image files chosen
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Total images (existing + new) must not exceed 3
    const totalImagesCount =
      existingImages.length + preview.length + files.length;
    if (totalImagesCount > 3) {
      toast.error('You can have up to 3 images total.');
      return;
    }

    // Preview each newly selected file
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...newPreviews]);

    // Add the actual File objects to formData.images
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  // Remove a newly selected image (File)
  const handleRemoveNewImage = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Remove an existing image (from DB)
  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    console.log('Edit page Form data:', formData);

    // Basic validations
    const validations = [
      { condition: !formData.title, message: 'Title is required.' },
      { condition: !formData.category, message: 'Category is required.' },
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
        message: 'Price option is required.',
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

    const errors = validations
      .filter(({ condition }) => condition)
      .map(({ message }) => message);

    if (errors.length > 0) {
      toast.error(
        <div className="space-y-1">
          {errors.map((msg, i) => (
            <p key={i} className="text-sm text-red-600">
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

    /**
     * -------------------------------------------------
     * Build FormData for the update request
     * -------------------------------------------------
     */
    const formPayload = new FormData();

    // 1) Append existing images that remain.
    //    Each item in existingImages is an object: { url, publicId, _id, ... }
    //    Suppose the API needs the entire object or just the publicId.
    //    We'll pass the full object via JSON.
    existingImages.forEach((imgObj) => {
      formPayload.append('existingImages', JSON.stringify(imgObj));
    });

    // 2) Append the rest of the fields
    Object.entries(formData).forEach(([key, value]) => {
      switch (key) {
        case 'images':
          // Append only new File objects
          value.forEach((file) => {
            formPayload.append('images', file);
          });
          break;
        case 'condition':
          if (value === 'New' || value === 'Used') {
            formPayload.append(key, value);
          }
          break;
        case 'address':
          // Stringify nested address object
          formPayload.append(key, JSON.stringify(value));
          break;
        case 'isForHire':
        case 'isForSale':
        case 'isForRent':
        case 'isRequestQuote':
          // Convert booleans to string
          formPayload.append(key, value ? 'true' : 'false');
          break;
        case 'sellPrice':
        case 'hirePrice':
        case 'rentPrice':
          // Ensure numeric fields are stored as string
          formPayload.append(key, String(value || 0));
          break;
        default:
          // All other fields
          formPayload.append(key, value ?? '');
      }
    });

    try {
      console.log('edit page dispatching payload');
      // Dispatch the update thunk
      const resultAction = await dispatch(
        updateAdvertById({
          id: currentAdvert._id, // or just `id` from params
          data: formPayload,
        })
      );
      console.log('✅ Dispatch result:', resultAction);

      if (updateAdvertById.fulfilled.match(resultAction)) {
        toast.success('Advert successfully updated!');
        router.push('/users/profile/manageads');
      } else {
        throw new Error(resultAction.payload || 'Failed to update advert.');
      }
    } catch (err) {
      console.error('Error updating advert:', err);
      toast.error('An unexpected error occurred while updating.');
    }
  };

  /**
   * ---------------------------------------------------------------------
   * Render
   * ---------------------------------------------------------------------
   */

  if (status === 'loading' && !currentAdvert) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Advert</h1>

      {/* Display any global errors */}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      {successMessage && (
        <p className="text-green-500 mb-4">{successMessage}</p>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block font-bold">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-bold">Category</label>
          <select
            name="category"
            value={formData.category || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categoryOptions.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Condition */}
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

        {/* Ad Type */}
        <div className="mb-4">
          <label className="block font-bold mb-2">Ad Type</label>
          <div className="flex border rounded overflow-hidden">
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

        {/* Price Options */}
        <div className="mb-4">
          <label className="block font-bold mb-2">Price</label>
          <div className="flex border border-gray-500 rounded overflow-hidden">
            <button
              type="button"
              className={`flex-1 p-2 text-center border-r-2 ${
                formData.isForSale
                  ? 'bg-gray-200 border-gray-500'
                  : 'bg-white border-gray-300'
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
            <button
              type="button"
              className={`flex-1 p-2 text-center border-r-2 ${
                formData.isForHire
                  ? 'bg-gray-200 border-gray-500'
                  : 'bg-white border-gray-300'
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
            <button
              type="button"
              className={`flex-1 p-2 text-center border-r-2 ${
                formData.isForRent
                  ? 'bg-gray-200 border-gray-500'
                  : 'bg-white border-gray-300'
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
            <button
              type="button"
              className={`flex-1 p-2 text-center ${
                formData.isRequestQuote
                  ? 'bg-gray-200 border-gray-500'
                  : 'bg-white border-gray-300'
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

          {/* Conditional Price Inputs */}
          <div className="mt-4">
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
            value={formData.description || ''}
            onChange={handleChange}
            onFocus={() => handleFocus('description')}
            onBlur={handleBlur}
            className="w-full p-2 border rounded"
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

        {/* Existing Images (from DB) */}
        {existingImages.length > 0 && (
          <div>
            <label className="block font-bold mb-2">Existing Images</label>
            <div className="flex gap-4 flex-wrap">
              {existingImages.map((imgObj, idx) => (
                <div key={idx} className="relative inline-block">
                  <img
                    src={imgObj.url} // <-- IMPORTANT: use the .url property
                    alt={`Existing image ${idx + 1}`}
                    className="w-24 h-24 object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                    title="Remove this existing image"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Image Upload */}
        <div>
          <label className="block font-bold">
            Upload New Images (Max Total 3)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
          {preview.length > 0 && (
            <div className="mt-4 flex gap-4 flex-wrap">
              {preview.map((src, index) => (
                <div key={index} className="relative inline-block">
                  <img
                    src={src}
                    alt={`Preview ${index + 1}`}
                    className="w-24 h-24 object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                    title="Remove this new image"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Submit and Cancel Buttons */}
        <div className="flex gap-4 mt-4">

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Update Advert
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

export default EditAdvertPage;
