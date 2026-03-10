'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateThread,
  fetchThreadById,
} from '@/store/slices/threads/threadSlice';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (threadId) {
      dispatch(fetchThreadById(threadId)).finally(() => setIsLoading(false));
    }
  }, [dispatch, threadId]);

  useEffect(() => {
    if (thread) {
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

      setFormData(updatedFormData);
      setExistingImages(thread.images || []);
      setPreview((thread.images || []).map((img) => img.url));

      if (thread.suburb && thread.suburb.name) {
        setLocationInput(`${thread.suburb.name}, ${thread.suburb.state} ${thread.suburb.postalCode}`);
      }
    }
  }, [thread, currentUser?.name]);

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
    const totalImages = existingImages.length + preview.length - existingImages.length + files.length;

    if (totalImages > 10) {
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

    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleLocationInputChange = (e) => {
    setLocationInput(e.target.value);
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
      return;
    }

    const formattedAddressLower = (place.formatted_address || '').toLowerCase().trim();
    const genericLocations = ['australia', 'aus', 'au'];

    if (genericLocations.includes(formattedAddressLower)) {
      setLocationValidationError('Please select a more specific location. Enter suburb or city.');
      setLocationInput('');
      return;
    }

    setLocationValidationError('');

    const addressComponents = place.address_components;
    let suburb = '';
    let state = '';
    let postalCode = '';
    let coordinates = [];

    addressComponents.forEach((component) => {
      const types = component.types;

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

    if (!suburb && place.formatted_address) {
      suburb = place.formatted_address.split(',')[0].trim();
    }

    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      coordinates = [lng, lat];
    }

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
    if (!name || !state || location.coordinates.length !== 2) {
      newErrors.suburb = 'Please select a valid location using the autocomplete field';
    }

    // Validate author section (shows its own errors internally)
    const authorValid = authorSectionRef.current ? authorSectionRef.current.validateFields() : true;

    // Show page errors and stop if any validation failed
    if (Object.keys(newErrors).length > 0 || !authorValid) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const formPayload = new FormData();
    formPayload.append('title', title);
    formPayload.append('question', question);
    formPayload.append('category', category);

    if (formData.communities && formData.communities.length > 0) {
      formPayload.append('communities', JSON.stringify(formData.communities));
    }

    formPayload.append('suburb', JSON.stringify(suburb));

    if (authorSectionRef.current?.isOptedIn()) {
      if (formData.author && (formData.author.name || formData.author.website ||
          formData.author.contact || formData.author.email ||
          formData.author.aboutMyself ||
          (formData.author.socialMedia && formData.author.socialMedia.length > 0))) {
        formPayload.append('author', JSON.stringify(formData.author));
      }
    } else {
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

    setIsSubmitting(false);

    if (updateThread.fulfilled.match(result)) {
      const updated = result.payload?.thread;

      if (!updated) {
        toast.error('Thread updated but failed to get updated data');
        return;
      }

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
      setShowSuccessView(true);
    } else {
      toast.error(result.payload || 'Failed to update thread.');
    }
  };

  const handleCancel = () => {
    const backTo = localStorage.getItem('cancelRedirectUrl');
    localStorage.removeItem('cancelRedirectUrl');
    router.push(backTo || '/users/profile/managethreads');
  };

  const getInputClasses = (hasError) => `w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
    hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'
  }`;

  const totalImages = existingImages.length + (preview.length - existingImages.length);
  const isMaxImagesReached = totalImages >= 10;

  if (isLoading) {
    return (
      <div className="px-2 py-6 sm:px-6 sm:py-8">
        <div className="max-w-3xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700 mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading thread...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-6 sm:px-6 sm:py-8">
      <RequireVerifiedAccount>
        {showSuccessView && updatedThread ? (
          <SuccessView
            thread={updatedThread}
            mode="edit"
          />
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Page Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Edit Topic</h1>
              <p className="text-sm text-slate-500 mt-1">Update your discussion or question</p>
              <button
                type="button"
                onClick={handleCancel}
                className="mt-4 inline-flex items-center justify-center bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-5 py-2 rounded-full shadow font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Title */}
              <div>
                <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="What's your topic about?"
                  value={formData.title || ''}
                  onChange={handleChange}
                  className={getInputClasses(errors.title)}
                  maxLength="200"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Question/Description */}
              <div>
                <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="question"
                  placeholder="Describe what you'd like to discuss or ask..."
                  value={formData.question || ''}
                  onChange={handleChange}
                  className={`w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg min-h-[12rem] sm:min-h-[10rem] resize-none sm:resize-y focus:outline-none focus:ring-2 ${
                    errors.question ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'
                  }`}
                  maxLength="15000"
                />
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    {errors.question && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.question}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {(formData.question || '').length}/15000
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
                  Category <span className="text-red-500">*</span>
                </label>
                <CategorySelector
                  value={formData.category}
                  onChange={(value) => {
                    const updates = { category: value };
                    if (!needsCommunityField(value)) {
                      updates.communities = [];
                    }
                    setFormData({ ...formData, ...updates });
                    if (errors.category) {
                      setErrors({ ...errors, category: '' });
                    }
                  }}
                  placeholder="Select a category"
                  hasError={!!errors.category}
                />
                {errors.category && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.category}</p>
                )}
              </div>

              {/* Community/Language */}
              {needsCommunityField(formData.category) && (
                <div>
                  <CommunitySelector
                    value={formData.communities}
                    onChange={(value) => setFormData({ ...formData, communities: value })}
                    label="Community/Language"
                    showHint={true}
                  />
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
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
                      className={getInputClasses(errors.suburb || locationValidationError)}
                      value={locationInput}
                      onChange={handleLocationInputChange}
                      onBlur={(e) => {
                        const value = e.target.value.toLowerCase().trim();
                        const genericLocations = ['australia', 'aus', 'au'];
                        if (genericLocations.includes(value)) {
                          setLocationValidationError('Please enter a more specific location.');
                        }
                      }}
                    />
                  </Autocomplete>
                </LoadScriptNext>
                {errors.suburb && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.suburb}</p>
                )}
                {locationValidationError && !errors.suburb && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{locationValidationError}</p>
                )}
              </div>

              {/* Author Details */}
              <div className="border-t border-slate-200 pt-4 sm:pt-6">
                <AuthorDetailsSection
                  ref={authorSectionRef}
                  formData={formData}
                  onChange={setFormData}
                  errors={errors}
                  userName={currentUser?.name || ''}
                />
              </div>

              {/* Images */}
              <div className="border-t border-slate-200 pt-4 sm:pt-6">
                <span className="block font-semibold sm:font-bold text-slate-700 text-sm sm:text-base">
                  Upload Images
                </span>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  JPEG, PNG, WebP & GIF only · Max 10 images · {preview.length}/10 uploaded
                </p>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isMaxImagesReached}
                    className="hidden"
                    id="thread-edit-image-upload"
                  />
                  <label
                    htmlFor="thread-edit-image-upload"
                    className={`inline-block px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      isMaxImagesReached
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                    }`}
                  >
                    Choose Files
                  </label>
                  {isMaxImagesReached && (
                    <p className="text-xs text-amber-600 mt-2">
                      Maximum reached. Remove images to add new ones.
                    </p>
                  )}
                </div>

                {preview.length > 0 && (
                  <div className="mt-3 flex gap-3 flex-wrap">
                    {preview.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={src}
                          alt={`Image ${idx + 1}`}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                        />
                        {idx < existingImages.length && (
                          <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                            Saved
                          </span>
                        )}
                        {idx >= existingImages.length && (
                          <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors ${
                    isSubmitting
                      ? 'bg-slate-400 cursor-not-allowed text-white'
                      : 'bg-teal-700 hover:bg-teal-800 text-white'
                  }`}
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
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
