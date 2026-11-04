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
import ThreadWriteStep from '@/components/threads/ThreadWriteStep';
import { discardPostPictures } from '@/utils/helpers/threads/threadPictures';
import useLeaveWarning from '@/hooks/threads/useLeaveWarning';
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
    allowChat: true,
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

  const [autocomplete, setAutocomplete] = useState(null);
  const [errors, setErrors] = useState({});
  const [locationInput, setLocationInput] = useState('');
  const authorSectionRef = useRef(null);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [updatedThread, setUpdatedThread] = useState(null);
  const [locationValidationError, setLocationValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Feature 1012: two steps - 1 write (title + post), 2 details. `touched` = the writer changed the
  // title or post, so leaving the page asks first.
  const [step, setStep] = useState(1);
  const [touched, setTouched] = useState(false);
  // Pictures uploaded in this session - sent on save / cancel so removed ones are deleted.
  const sessionPicsRef = useRef([]);
  const notePicture = (src) => { sessionPicsRef.current.push(src); setTouched(true); };
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
        allowChat: thread.allowChat !== false,
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

  // The rich-text editor emits HTML (or '' when empty). Mirror handleChange's error-clearing.
  const handleQuestionChange = (html) => {
    setTouched(true);
    setFormData((prev) => ({ ...prev, question: html }));
    if (errors.question) setErrors((prev) => ({ ...prev, question: '' }));
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

  const handleTitleChange = (value) => {
    setTouched(true);
    setFormData((prev) => ({ ...prev, title: value }));
    if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
  };

  // Step 1 -> 2: the title and post must be there first.
  const goToDetails = () => {
    const writeErrors = {};
    if (!(formData.title || '').trim()) writeErrors.title = 'Please add a title.';
    if (!(formData.question || '').trim()) writeErrors.question = 'Please write your post.';
    if (Object.keys(writeErrors).length) {
      setErrors((prev) => ({ ...prev, ...writeErrors }));
      toast.error(writeErrors.title || writeErrors.question);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0 });
  };

  const backToWriting = () => {
    setStep(1);
    window.scrollTo({ top: 0 });
  };

  const { confirmLeave, leaveModal } = useLeaveWarning(touched && !showSuccessView, () => discardPostPictures(sessionPicsRef.current, formData.question));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, question, category, suburb } = formData;
    const newErrors = {};

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
      toast.error('Form Errors — please fix the highlighted fields.');
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

    // Feature 1012: the author (at least the name) is always sent.
    formPayload.append('author', JSON.stringify(formData.author));

    // Feature 1012: pictures live inside the post; the server reads them from the text and
    // deletes any picture taken out of it.
    formPayload.append('picturesInText', 'true');
    formPayload.append('sessionPictures', JSON.stringify(sessionPicsRef.current));
    formPayload.append('allowChat', formData.allowChat ? 'true' : 'false');

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

      setUpdatedThread(updated);
      setShowSuccessView(true);
    } else {
      toast.error(result.payload || 'Failed to update thread.');
    }
  };

  const handleCancel = () => {
    confirmLeave(() => {
      setTouched(false);
      const backTo = localStorage.getItem('cancelRedirectUrl');
      localStorage.removeItem('cancelRedirectUrl');
      router.push(backTo || '/users/profile/managethreads');
    });
  };

  const getInputClasses = (hasError) => `w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
    hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'
  }`;

  if (isLoading) {
    return (
      <div>
        <div className="w-full text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700 mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading thread...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {leaveModal}
      <RequireVerifiedAccount>
        {showSuccessView && updatedThread ? (
          <div className="mx-auto w-full max-w-3xl"><SuccessView
            thread={updatedThread}
            mode="edit"
          /></div>
        ) : step === 1 ? (
          <div className="mx-auto w-full max-w-6xl">
            <ThreadWriteStep
              heading="Edit thread"
              title={formData.title || ''}
              onTitleChange={handleTitleChange}
              question={formData.question || ''}
              onQuestionChange={handleQuestionChange}
              onPictureUploaded={notePicture}
              errors={errors}
              onNext={goToDetails}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl">
            {/* Top Toolbar — Cancel (left), above the title */}
            <div className="mb-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                ✕ Cancel
              </button>
              <button
                type="button"
                onClick={backToWriting}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Back
              </button>
            </div>

            {/* Page Title — centered, below the toolbar (forms.md standard) */}
            <div className="text-center mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 2 of 2: Details</p>
              <h1 data-testid="thread-details-title" className="mt-1 text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight break-words">{formData.title}</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white p-3 sm:p-6 rounded-lg shadow-md border border-slate-200 space-y-4 sm:space-y-6">
              {/* Category */}
              <div>
                <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
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
                <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
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
                  userName={currentUser?.isCurator ? 'Desify Team' : (currentUser?.name || '')}
                />
              </div>

              {/* Group chat switch (feature 1012) */}
              <div className="border-t border-slate-200 pt-4 sm:pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowChat"
                    checked={formData.allowChat}
                    onChange={(e) => setFormData((prev) => ({ ...prev, allowChat: e.target.checked }))}
                    className="mt-1 h-5 w-5 accent-teal-700"
                  />
                  <span>
                    <span className="block font-medium text-slate-700 text-sm sm:text-base">Allow group chat on this post</span>
                    <span className="block text-xs text-slate-500">Off: readers see no chat box and nobody can send messages. Earlier messages are kept and come back when you turn it on.</span>
                  </span>
                </label>
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
