'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createThread } from '@/store/slices/threads/threadSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api';

const libraries = ['places'];

const categoryOptions = [
  'Education',
  'Migration',
  'Travel',
  'Jobs',
  'Entertainment & Hobbies',
  'Baby & Children',
  'Arts & Crafts',
  'Cars & Vehicles',
  'Fashion & Accessories',
  'Electronics & Computer',
  'Home & Garden',
  'Miscellaneous',
  'Pets',
  'Real Estate',
  'Party Hires & Services',
  'Sport & Fitness',
  'Food & Catering Services',
  'Health & Beauty',
  'Business & Shops',
  'Events & Community',
  'Services',
  'Travel Partner',
  'financial aid',
];

const CreateThreadPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const isLoggedIn = useSelector((state) => state.user.tokenValidated);
  const { user } = useSelector((state) => state.user) || {};

  const [formData, setFormData] = useState({
    title: '',
    question: '',
    category: '',
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
    if (files.length + preview.length > 3) {
      alert('You can upload up to 3 images only.');
      return;
    }
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
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
      if (types.includes('locality')) suburb = component.long_name;
      if (types.includes('administrative_area_level_1'))
        state = component.short_name;
      if (types.includes('postal_code')) postalCode = component.long_name;
    });

    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      coordinates = [lng, lat];
    }

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
    setLocationInput(`${suburb}, ${state} ${postalCode}`);

    if (errors.suburb) {
      setErrors((prev) => ({ ...prev, suburb: '' }));
    }
  };

  // Update useEffect to set location input when suburb data changes
  useEffect(() => {
    if (formData.suburb.name) {
      setLocationInput(`${formData.suburb.name}, ${formData.suburb.state} ${formData.suburb.postalCode}`);
    }
  }, [formData.suburb]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.question.trim()) newErrors.question = 'Question is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';

    const { name, state, postalCode, location } = formData.suburb;
    if (!name || !state || !postalCode || location.coordinates.length !== 2) {
      newErrors.suburb = 'Please select a valid suburb using the autocomplete field';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!isLoggedIn) {
      router.push('/users/login?preserveRedirect=true');
      return;
    }

    const formPayload = new FormData();
    
    // Append basic fields
    formPayload.append('title', formData.title);
    formPayload.append('question', formData.question);
    formPayload.append('category', formData.category);
    
    // Append suburb data
    formPayload.append('suburb', JSON.stringify(formData.suburb));
    
    // Append images
    formData.images.forEach((file) => formPayload.append('images', file));

    await dispatch(createThread(formPayload));
    router.push('/threads');
  };

  return (
    <div className="max-w-lg mx-auto mt-08 p-6 border rounded-lg shadow-lg bg-white">
      <h1 className="text-2xl font-bold mb-4">Create a New Thread</h1>

      {!isLoggedIn ? (
        <div className="border rounded-lg p-4 shadow-md bg-white text-center">
          <p className="text-gray-700 mb-4">
            You must be logged in to add a new thread.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/users/login?preserveRedirect=true"
              onClick={() => {
                localStorage.setItem('redirectAfterLogin', '/threads/new');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              href="/users/register?preserveRedirect=true"
              onClick={() => {
                localStorage.setItem('redirectAfterLogin', '/threads/new');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Register
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="title"
              placeholder="Thread Title"
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
              placeholder="Describe your question..."
              value={formData.question}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg ${
                errors.question ? 'border-red-500' : ''
              }`}
              required
            />
            {errors.question && (
              <p className="text-red-500 text-sm mt-1">{errors.question}</p>
            )}
          </div>

          <div>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg ${
                errors.category ? 'border-red-500' : ''
              }`}
              required
            >
              <option value="">Select Category</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
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
                  types: ['(regions)'],
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
            <label className="block font-semibold">Upload Images (Max 3)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded"
            />
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
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create Thread
            </button>
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
      )}
    </div>
  );
};

export default CreateThreadPage;