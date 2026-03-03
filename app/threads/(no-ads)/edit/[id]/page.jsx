'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateThread,
  fetchThreadById,
} from '@/store/slices/threads/threadSlice';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
import { useRef } from 'react';
import CategorySelector from '@/components/threads/CategorySelector';
import CommunitySelector from '@/components/shared/CommunitySelector';
import { needsCommunityField } from '@/components/threads/categories';
import SuccessView from '@/components/threads/SuccessView';
import AuthorDetailsSection from '@/components/threads/AuthorDetailsSection';

const libraries = ['places'];

const EditThreadPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const threadId = params?.id;

  const thread = useSelector((state) => state.threads.selectedThread);
  const currentUser = useSelector((state) => state.user.user);

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
    author: {
      name: '',
      website: '',
      contact: '',
      email: '',
      aboutMyself: '',
      socialMedia: []
    },
  });
  
  const [existingImages, setExistingImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [autocomplete, setAutocomplete] = useState(null);
  const [errors, setErrors] = useState({});
  const [locationInput, setLocationInput] = useState('');
  const fileInputRef = useRef(null);
  const authorSectionRef = useRef(null);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [updatedThread, setUpdatedThread] = useState(null);
  const [locationValidationError, setLocationValidationError] = useState('');

  useEffect(() => {
    if (threadId) {
      dispatch(fetchThreadById(threadId));
    }
  }, [dispatch, threadId]);

  useEffect(() => {
    if (thread) {
      console.log('🔍 Loading thread author data:', thread.author);
      const updatedFormData = {
        title: thread.title || '',
        question: thread.question || '',
        category: thread.category || '',
        communities: thread.communities || [],
        images: [],
        suburb: thread.suburb || {
          name: '',
          state: '',
          postalCode: '',
          location: {
            type: 'Point',
            coordinates: [],
          },
        },
        author: thread.author || {
          name: '',
          website: '',
          contact: '',
          email: '',
          aboutMyself: '',
          socialMedia: []
        },
      };
  
      console.log('📝 Setting formData with author:', updatedFormData.author);
      setFormData(updatedFormData);
      setExistingImages(thread.images || []);
      setPreview((thread.images || []).map((img) => img.url));
  
      if (thread.suburb && thread.suburb.name) {
        setLocationInput(`${thread.suburb.name}, ${thread.suburb.state} ${thread.suburb.postalCode}`);
      }
    }
  }, [thread, currentUser?.name]);
  

  // Add this useEffect to update locationInput when formData.suburb changes
useEffect(() => {
  if (formData.suburb && formData.suburb.name) {
    setLocationInput(`${formData.suburb.name}, ${formData.suburb.state} ${formData.suburb.postalCode}`);
  }
}, [formData.suburb]);

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
    const validFiles = files.filter((file) => {
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
  
    if (fileInputRef.current) fileInputRef.current.value = ''; // 👈 Reset file input
  };
  

  const handleRemoveImage = (index) => {
    if (index < existingImages.length) {
      const updated = [...existingImages];
      updated.splice(index, 1);
      setExistingImages(updated);
    } else {
      const adjustedIndex = index - existingImages.length;
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== adjustedIndex),
      }));
    }
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  // Location input handler
  const handleLocationInputChange = (e) => {
    setLocationInput(e.target.value);
    
    // Clear validation errors when user starts typing
    if (errors.suburb) {
      setErrors((prev) => ({ ...prev, suburb: '' }));
    }
    if (locationValidationError) {
      setLocationValidationError('');
    }
  };

  const handlePlaceChanged = () => {
    if (!autocomplete) return;
  
    const place = autocomplete.getPlace();
  
    if (!place || !place.address_components) {
      console.log("No valid place selected");
      return;
    }
  
    // Validate against "Australia" only
    const formattedAddressLower = (place.formatted_address || '').toLowerCase().trim();
    const genericLocations = ['australia', 'aus', 'au'];
    
    if (genericLocations.includes(formattedAddressLower)) {
      setLocationValidationError('Please select a more specific location. Enter suburb or city.');
      setLocationInput('');
      return;
    }

    // Clear any previous validation error
    setLocationValidationError('');

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
  
    // ✅ Update formData with selected location
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
  
    // ✅ Important: Clear existingImages because suburb is being changed
    setExistingImages((prev) => [...prev]);
  
    // Update the input field
    setLocationInput(`${suburb}, ${state} ${postalCode}`);
  
    if (errors.suburb) {
      setErrors((prev) => ({ ...prev, suburb: '' }));
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, question, category, images, suburb } = formData;
    const newErrors = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!question.trim()) newErrors.question = 'Question is required';
    if (!category.trim()) newErrors.category = 'Category is required';

    // Validate author fields
    if (authorSectionRef.current && !authorSectionRef.current.validateFields()) {
      return;
    }

    const { name, state, postalCode, location } = suburb;
    // Postal code is now optional
    if (!name || !state || location.coordinates.length !== 2) {
      newErrors.suburb = 'Please select a valid location using the autocomplete field';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formPayload = new FormData();
    formPayload.append('title', title);
    formPayload.append('question', question);
    formPayload.append('category', category);
    
    // Append communities
    if (formData.communities && formData.communities.length > 0) {
      formPayload.append('communities', JSON.stringify(formData.communities));
    }
    
    // Append suburb data
    formPayload.append('suburb', JSON.stringify(suburb));
    
    // Handle author data based on opt-in status
    if (authorSectionRef.current?.isOptedIn()) {
      // User opted in - send author data
      if (formData.author && (formData.author.name || formData.author.website || 
          formData.author.contact || formData.author.email || 
          formData.author.aboutMyself || 
          (formData.author.socialMedia && formData.author.socialMedia.length > 0))) {
        formPayload.append('author', JSON.stringify(formData.author));
      }
    } else {
      // User opted out - send empty author object to clear existing data
      formPayload.append('author', JSON.stringify({
        name: '',
        website: '',
        contact: '',
        email: '',
        aboutMyself: '',
        socialMedia: []
      }));
    }
    
    existingImages.forEach((img) =>
      formPayload.append('existingImages', JSON.stringify(img))
    );
    images.forEach((file) => formPayload.append('images', file));

    const result = await dispatch(
      updateThread({ threadId, formData: formPayload })
    );

    if (updateThread.fulfilled.match(result)) {
      // Get the updated thread from the result
      // Backend returns { message: '...', thread: {...} }
      const updated = result.payload?.thread;
      
      if (!updated) {
        console.error('No thread data in update response:', result.payload);
        toast.error('Thread updated but failed to get updated data');
        return;
      }
      
      // Revalidate metadata cache for WhatsApp sharing
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag: `thread-${threadId}` })
        });
      } catch (error) {
        console.error('Failed to revalidate metadata:', error);
      }
      
      setUpdatedThread(updated);
      // Show success view
      setShowSuccessView(true);
    } else {
      toast.error(result.payload || 'Failed to update thread.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 mt-10">
      <RequireVerifiedAccount>
        {showSuccessView && updatedThread ? (
          <SuccessView
            thread={updatedThread}
            mode="edit"
          />
        ) : (
          <div className="bg-white border rounded-lg shadow-lg p-4 sm:p-6">
            <h1 className="text-2xl font-bold mb-4">Edit Topic</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            className={`w-full p-2 border rounded-lg ${
              errors.title ? 'border-red-500' : ''
            }`}
            placeholder="Topic Title"
            required
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>
        
        <div>
          <textarea
            name="question"
            value={formData.question || ''}
            onChange={handleChange}
            className={`w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg sm:rounded min-h-[12rem] sm:min-h-[10rem] resize-none sm:resize-y focus:outline-none focus:ring-2 ${
              errors.question ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-teal-300'
            }`}
            placeholder="Describe your question..."
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
            onChange={(value) => {
              // Clear communities if switching to a non-eligible category
              const updates = { category: value };
              if (!needsCommunityField(value)) {
                updates.communities = [];
              }
              setFormData({ ...formData, ...updates });
            }}
            placeholder="Select Category"
            required={true}
          />
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        {/* Community/Language - Only for eligible categories */}
        {needsCommunityField(formData.category) && (
          <div>
            <CommunitySelector
              value={formData.communities}
              onChange={(value) => setFormData({ ...formData, communities: value })}
              label="Community/Language (Optional)"
              showHint={true}
            />
          </div>
        )}

        {/* Location/Suburb Selector */}
        <div>
          <label className="block font-bold mb-2 text-gray-700">
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
                  errors.suburb || locationValidationError ? 'border-red-500' : 'border-gray-300'
                }`}
                value={locationInput}
                onChange={handleLocationInputChange}
                onBlur={(e) => {
                  const value = e.target.value.toLowerCase().trim();
                  const genericLocations = ['australia', 'aus', 'au'];
                  
                  if (genericLocations.includes(value)) {
                    setLocationValidationError('Please enter a more specific location. Include an address, suburb or city.');
                  }
                }}
              />
            </Autocomplete>
          </LoadScriptNext>
          {errors.suburb && (
            <p className="text-red-500 text-sm mt-1">{errors.suburb}</p>
          )}
          {locationValidationError && !errors.suburb && (
            <p className="text-red-500 text-sm mt-1">{locationValidationError}</p>
          )}
        </div>

        {/* Author Details Section */}
        <AuthorDetailsSection
          ref={authorSectionRef}
          formData={formData}
          onChange={setFormData}
          errors={errors}
          userName={currentUser?.name || ''}
        />

        <div>
          <label className="block font-bold mb-2 text-gray-700">Upload Images (Optional)</label>
          <p className="text-xs text-gray-600 mb-2">
            You can upload up to 10 images. Current: {preview.length}/10
          </p>
          <input
  ref={fileInputRef} // 👈 Add this ref here
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
          <div className="flex gap-4 mt-4 flex-wrap">
            {preview.map((src, idx) => (
              <div key={idx} className="relative">
                <img
                  src={src}
                  alt={`img-${idx}`}
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

        <div className="flex justify-between mt-4">
          <button
            type="submit"
            className="bg-teal-600 text-lime-100 hover:bg-teal-700 hover:text-lime-100 px-4 py-2 rounded"
          >
            Update Thread
          </button>
          <button
            type="button"
            onClick={() => {
              const backTo = localStorage.getItem('cancelRedirectUrl');
              localStorage.removeItem('cancelRedirectUrl');
              router.push(backTo || '/users/profile/managethreads');
            }}
            className="bg-red-400 text-white hover:bg-red-600 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
            </form>
          </div>
        )}
      </RequireVerifiedAccount>
    </div>
  );
};

export default EditThreadPage;