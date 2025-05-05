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
import { useRef } from 'react';

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

const EditThreadPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const threadId = params?.id;

  const thread = useSelector((state) => state.threads.selectedThread);

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
  
  const [existingImages, setExistingImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [autocomplete, setAutocomplete] = useState(null);
  const [errors, setErrors] = useState({});
  const [locationInput, setLocationInput] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (threadId) {
      dispatch(fetchThreadById(threadId));
    }
  }, [dispatch, threadId]);

  useEffect(() => {
    if (thread) {
      const updatedFormData = {
        title: thread.title || '',
        question: thread.question || '',
        category: thread.category || '',
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
      };
  
      setFormData(updatedFormData);
      setExistingImages(thread.images || []);
      setPreview((thread.images || []).map((img) => img.url));
  
      if (thread.suburb && thread.suburb.name) {
        setLocationInput(`${thread.suburb.name}, ${thread.suburb.state} ${thread.suburb.postalCode}`);
      }
    }
  }, [thread]);
  

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
  
    if (files.length + preview.length > 5) {
      toast.error('You can upload up to 5 images only.');
      return;
    }
  
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const validFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Unsupported file type: ${file.type}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Each image must be under 10MB.');
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
    
    // Clear suburb error if typing
    if (errors.suburb) {
      setErrors((prev) => ({ ...prev, suburb: '' }));
    }
  };

  const handlePlaceChanged = () => {
    if (!autocomplete) return;
  
    const place = autocomplete.getPlace();
  
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

    const { name, state, postalCode, location } = suburb;
    if (!name || !state || !postalCode || location.coordinates.length !== 2) {
      newErrors.suburb = 'Please select a valid suburb using the autocomplete field';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formPayload = new FormData();
    formPayload.append('title', title);
    formPayload.append('question', question);
    formPayload.append('category', category);
    
    // Append suburb data
    formPayload.append('suburb', JSON.stringify(suburb));
    
    existingImages.forEach((img) =>
      formPayload.append('existingImages', JSON.stringify(img))
    );
    images.forEach((file) => formPayload.append('images', file));

    const result = await dispatch(
      updateThread({ threadId, formData: formPayload })
    );

    if (updateThread.fulfilled.match(result)) {
      toast.success('Thread updated successfully.');
      router.push('/users/profile/managethreads');
    } else {
      toast.error(result.payload || 'Failed to update thread.');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 mt-10 bg-white border rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Edit Thread</h1>
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
            placeholder="Thread Title"
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
            className={`w-full p-2 border rounded-lg ${
              errors.question ? 'border-red-500' : ''
            }`}
            placeholder="Describe your question..."
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
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        {/* Location/Suburb Selector */}
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

        <div>
          <label className="block font-semibold mb-1">Images (max 5)</label>
          <input
  ref={fileInputRef} // 👈 Add this ref here
  type="file"
  multiple
  accept="image/*"
  onChange={handleFileChange}
  className="w-full p-2 border rounded"
/>
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Update Thread
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditThreadPage;