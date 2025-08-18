'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createThread } from '@/store/slices/threads/threadSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api';
import { toast } from 'react-toastify';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
import CategorySelector from '@/components/shared/CategorySelector';
import CommunitySelector from '@/components/shared/CommunitySelector';

const libraries = ['places'];

const categoryOptions = [
  'Migration',
  "Community & Cultural",
  "Devotional & Spiritual",
  "Entertainment & Music",
  "Family & Kids",
  "Arts & Dance",
  "Sports",
  "Wellness & Fitness",
  'Food & Catering',
  "Academic & Education",
  'Cars & Vehicles',
  'Home & Garden',  
  'Electronics & Computer',
  'Fashion & Accessories',
  'Real Estate',
  'Jobs',
  "Travel & Adventure",
  'Pets',
  "Business & Professional",
  "Community Aid & Fundraisers",
  "Volunteering & Charity",
  'Travel Partner',
  "Miscellaneous",
];

const CreateThreadPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const isLoggedIn = useSelector((state) => state.user.tokenValidated);
  const { user } = useSelector((state) => state.user) || {};
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    question: '',
    category: '',
    communities: [],
    images: [],
    suburb: {
      name: '',
      state: '',
      postalCode: '',
      location: {
        type: 'Point',
        coordinates: [],
      },
    },
  });

  const [preview, setPreview] = useState([]);
  const [autocomplete, setAutocomplete] = useState(null);
  const [errors, setErrors] = useState({});
  const [locationInput, setLocationInput] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
  
    if (files.length + preview.length > 10) {
      toast.error('You can upload up to 10 images only.');
      return;
    }
  
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Unsupported file type: ${file.name}. Only JPEG, PNG, WebP, and GIF formats are allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Each image must be under 5MB.`);
        return false;
      }
      return true;
    });
  
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...newPreviews]);
  
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...validFiles],
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  

  const handleRemoveImage = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Update location input handler
  const handleLocationInputChange = (e) => {
    setLocationInput(e.target.value);
    
    // Clear suburb error if typing
    if (errors.suburb) {
      setErrors((prev) => ({ ...prev, suburb: '' }));
    }
  };

  const handlePlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    
    // Check if we have a valid place with address components
    if (!place || !place.address_components) {
      console.log("No valid place selected");
      return;
    }
    
    const addressComponents = place.address_components;

    let suburb = '';
    let state = '';
    let postalCode = '';
    let coordinates = [];

    addressComponents.forEach((component) => {
      const types = component.types;
      
      // Try multiple suburb types for Australian locations
      if (!suburb) {
        if (types.includes('locality')) {
          suburb = component.long_name;
        } else if (types.includes('sublocality_level_1')) {
          suburb = component.long_name;
        } else if (types.includes('administrative_area_level_2')) {
          suburb = component.long_name;
        } else if (types.includes('postal_town')) {
          suburb = component.long_name;
        }
      }
      
      if (types.includes('administrative_area_level_1'))
        state = component.short_name;
      if (types.includes('postal_code')) postalCode = component.long_name;
    });

    // Fallback: Extract from formatted address if no suburb found
    if (!suburb && place.formatted_address) {
      suburb = place.formatted_address.split(',')[0].trim();
    }

    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      coordinates = [lng, lat];
    }

    // Debug logging
    console.log('📍 Thread Location Data:', {
      suburb,
      state,
      postalCode: postalCode || '',
      coordinates
    });

    // Update formData with selected location
    setFormData((prev) => ({
      ...prev,
      suburb: {
        name: suburb,
        state,
        postalCode,
        location: {
          type: 'Point',
          coordinates,
        },
      },
    }));

    // Update the input value to show the selected location
    const locationDisplay = postalCode 
      ? `${suburb}, ${state} ${postalCode}`
      : `${suburb}, ${state}`;
    setLocationInput(locationDisplay);

    if (errors.suburb) {
      setErrors((prev) => ({ ...prev, suburb: '' }));
    }
  };

  // Update useEffect to set location input when suburb data changes
  useEffect(() => {
    if (formData.suburb.name) {
      const display = formData.suburb.postalCode 
        ? `${formData.suburb.name}, ${formData.suburb.state} ${formData.suburb.postalCode}`
        : `${formData.suburb.name}, ${formData.suburb.state}`;
      setLocationInput(display);
    }
  }, [formData.suburb]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.question.trim()) newErrors.question = 'Question is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';

    const { name, state, postalCode, location } = formData.suburb;
    
    // Debug logging
    console.log('🚀 Thread Submit - Suburb Data:', {
      name,
      state,
      postalCode: postalCode || '(empty)',
      coordinates: location?.coordinates,
      fullSuburb: formData.suburb
    });
    
    // Postal code is now optional
    if (!name || !state || !location?.coordinates || location.coordinates.length !== 2 || 
        (location.coordinates[0] === 0 && location.coordinates[1] === 0)) {
      console.log('❌ Suburb validation failed:', {
        hasName: !!name,
        hasState: !!state,
        hasCoordinates: !!location?.coordinates,
        coordinatesLength: location?.coordinates?.length,
        coordinates: location?.coordinates
      });
      newErrors.suburb = 'Please select a valid location using the autocomplete field';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!isLoggedIn) {
      router.push('/login?preserveRedirect=true');
      return;
    }

    const formPayload = new FormData();
    
    // Append basic fields
    formPayload.append('title', formData.title);
    formPayload.append('question', formData.question);
    formPayload.append('category', formData.category);
    
    // Append communities
    if (formData.communities && formData.communities.length > 0) {
      formPayload.append('communities', JSON.stringify(formData.communities));
    }
    
    // Append suburb data
    formPayload.append('suburb', JSON.stringify(formData.suburb));
    
    // Append images
    formData.images.forEach((file) => formPayload.append('images', file));

    const resultAction = await dispatch(createThread(formPayload));

if (createThread.fulfilled.match(resultAction)) {
  toast.success('Thread created successfully!');
  router.push('/threads');
} else {
  toast.error(resultAction?.error?.message || 'Failed to create thread.');
}

  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4 sm:p-6 border rounded-lg shadow-lg bg-white">
      <h1 className="text-2xl font-bold mb-4">Create a New Topic</h1>
      <RequireVerifiedAccount>
      
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="title"
              placeholder="Topic Title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg ${
                errors.title ? 'border-red-500' : ''
              }`}
              required
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <textarea
              name="question"
              placeholder="Describe what would you like to ask"
              value={formData.question}
              onChange={handleChange}
              className={`w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg sm:rounded min-h-[12rem] sm:min-h-[10rem] resize-none sm:resize-y focus:outline-none focus:ring-2 ${
                errors.question ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-teal-300'
              }`}
              required
              maxLength="15000"
            />
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                {errors.question && (
                  <p className="text-red-500 text-sm mt-1">{errors.question}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {(formData.question || '').length}/15000
              </span>
            </div>
          </div>

          <div>
            <CategorySelector
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              categories={categoryOptions}
              placeholder="Select Category"
              required={true}
            />
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>
          
          <div>
            <CommunitySelector
              value={formData.communities}
              onChange={(value) => setFormData({ ...formData, communities: value })}
              label="Community/Language (Optional)"
              showHint={true}
            />
          </div>

          {/* Location/Suburb Selector - Fixed to allow typing */}
          <div>
            <label className="block font-medium">
              Location <span className="text-red-500">*</span>
            </label>
            <LoadScriptNext
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              libraries={libraries}
            >
              <Autocomplete
                onLoad={(auto) => setAutocomplete(auto)}
                onPlaceChanged={handlePlaceChanged}
                options={{
                  componentRestrictions: { country: 'AU' },
                  types: ['geocode'],
                }}
              >
                <input
                  type="text"
                  placeholder="Enter your suburb"
                  className={`w-full p-2 border rounded ${
                    errors.suburb ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={locationInput}
                  onChange={handleLocationInputChange}
                />
              </Autocomplete>
            </LoadScriptNext>
            {errors.suburb && (
              <p className="text-red-500 text-sm mt-1">{errors.suburb}</p>
            )}
            
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-semibold">Upload Images (Max 10)</label>
            <div className="text-sm text-gray-600 mb-2">
              Current: {preview.length}/10
            </div>
            <input
             ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={preview.length >= 10}
              className={`w-full p-2 border rounded ${
                preview.length >= 10 
                  ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                  : 'cursor-pointer'
              }`}
            />
            {preview.length >= 10 && (
              <p className="text-sm text-amber-600 mt-1">
                Maximum image limit reached. Remove existing images to add new ones.
              </p>
            )}
            <div className="mt-4 flex gap-4 flex-wrap">
              {preview.map((src, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={src}
                    alt={`Preview ${idx}`}
                    className="w-24 h-24 object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100 px-4 py-2 rounded"
            >
              Create Thread
            </button>
            <button
              type="button"
              className="bg-red-400 text-white hover:bg-red-600   px-4 py-2 rounded"
              onClick={() => {
                const backTo = localStorage.getItem('cancelRedirectUrl');
                localStorage.removeItem('cancelRedirectUrl');
                router.push(backTo || '/threads');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
</RequireVerifiedAccount>
    </div>
  );
};

export default CreateThreadPage;