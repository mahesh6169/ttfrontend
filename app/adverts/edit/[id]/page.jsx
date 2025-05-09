'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import {
  editAdvertById,
  updateAdvertById,
} from '@/store/slices/adverts/userAdvertsSlice';
import {
  CATEGORY_OPTIONS,
  CATEGORIES_REQUIRING_CONDITION,
  FIELD_HINTS,
  CATEGORIES_NOT_REQUIRING_PRICE,
  CATEGORIES_HIDE_ISFORHIRE,
  CATEGORIES_HIDE_ISFORSHARE,
} from '@/components/adverts/editadvert/AdvertCategories';
import AdTypeToggle from '@/components/adverts/editadvert/AdTypeToggle';
import PriceToggle from '@/components/adverts/editadvert/PriceToggle';
import ConditionToggle from '@/components/adverts/editadvert/ConditionToggle';
import ImageUploader from '@/components/adverts/editadvert/ImageUploader';
import AddressInput from '@/components/adverts/editadvert/AddressInput';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';

const libraries = ['places'];

const EditAdvertPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();

  // Grab state from Redux
  const { currentAdvert, status, error } = useSelector(
    (state) => state.userAdverts
  );

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

  const shouldShowCondition = CATEGORIES_REQUIRING_CONDITION.includes(
    formData.category
  );

  const shouldShowPrice =
    formData.isOffered &&
    !CATEGORIES_NOT_REQUIRING_PRICE.includes(formData.category);

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
      } else if (name.startsWith('address')) {
        const [, key] = name.split('.');
        updatedData.address = {
          ...prev.address,
          [key]: value,
          location: prev.address.location, // Preserve location
        };
      } else {
        updatedData[name] = value;
      }
      

      // When user switches to "Wanted" mode
    if (name === 'isWanted' && checked) {
      // Disable "Offered" mode
      updatedData.isOffered = false;
      
      // Reset all price-related fields explicitly
      updatedData.isForSale = false;
      updatedData.sellPrice = 0;
      updatedData.isForHire = false;
      updatedData.hirePrice = 0;
      updatedData.hireUnit = 'hour';
      updatedData.isForRent = false;
      updatedData.rentPrice = 0;
      updatedData.rentUnit = 'week';
      updatedData.isForShare = false;
      updatedData.sharePrice = 0;
      updatedData.shareUnit = 'week';
    }
    
    // When user switches to "Offered" mode
    if (name === 'isOffered' && checked) {
      // Disable "Wanted" mode
      updatedData.isWanted = false;
      
      // Don't reset price fields when switching TO offered mode
      // This lets users keep their previous price settings
    }
      
      // ✅ Reset "condition" if not required
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
    
      if (updatedData.isWanted) {
        updatedData.isOffered = false;
        updatedData.isForSale = false;
        updatedData.sellPrice = 0;
        updatedData.isForHire = false;
        updatedData.hirePrice = 0;
        updatedData.hireUnit = 'hour';
        updatedData.isForRent = false;
        updatedData.rentPrice = 0;
        updatedData.rentUnit = 'week';
        updatedData.isForShare = false;
        updatedData.sharePrice = 0;
        updatedData.shareUnit = 'week';
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
        condition: shouldShowCondition && formData.isForSale && !formData.condition,
        message: 'Condition is required.',
      },
      {
        condition: !formData.isOffered && !formData.isWanted,
        message: 'Ad type is required.',
      },
      {
        condition:
          formData.isOffered && 
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
        case 'isForShare':
          // Convert booleans to string
          formPayload.append(key, value ? 'true' : 'false');
          break;
        case 'sellPrice':
        case 'hirePrice':
        case 'rentPrice':
        case 'sharePrice':
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

        {/* Ad Type */}
        <AdTypeToggle formData={formData} setFormData={setFormData} />

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
            {CATEGORY_OPTIONS.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Price Options */}
        {shouldShowPrice && (
          <PriceToggle
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
          />
        )}

        {/* Condition */}
        {shouldShowCondition && formData.isForSale && (
          <ConditionToggle formData={formData} setFormData={setFormData} />
        )}

        {/* Description */}
        <div>
          <label className="block font-bold">Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            onFocus={() => handleFocus('description')}
            onBlur={handleBlur}
            className="w-full p-2 border rounded h-48"
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
          autocomplete={autocomplete}
          setAutocomplete={setAutocomplete}
          handlePlaceChanged={handlePlaceChanged}
          handleFocus={handleFocus}
          handleBlur={handleBlur}
          focusedField={focusedField}
        />

        {/* UPLOAD IMAGESG EXISITNG AND NEW */}
        <ImageUploader
          existingImages={existingImages}
          setExistingImages={setExistingImages}
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
