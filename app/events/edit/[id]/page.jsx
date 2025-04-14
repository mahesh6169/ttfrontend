'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import { fetchEventById, updateEventById } from '@/store/slices/eventSlice';
import { CATEGORY_OPTIONS } from '@/components/events/EventCategories';
import AddressInput from '@/components/addadvert/AddressInput';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';
import { utcToZonedTime , zonedTimeToUtc  } from 'date-fns-tz';
import { format } from 'date-fns';

const AU_TIMEZONES = [
  { label: 'Sydney (NSW)', value: 'Australia/Sydney', key: 'Australia/Sydney-NSW' },
  { label: 'Melbourne (VIC)', value: 'Australia/Melbourne', key: 'Australia/Melbourne-VIC' },
  { label: 'Brisbane (QLD)', value: 'Australia/Brisbane', key: 'Australia/Brisbane-QLD' },
  { label: 'Perth (WA)', value: 'Australia/Perth', key: 'Australia/Perth-WA' },
  { label: 'Adelaide (SA)', value: 'Australia/Adelaide', key: 'Australia/Adelaide-SA' },
  { label: 'Hobart (TAS)', value: 'Australia/Hobart', key: 'Australia/Hobart-TAS' },
  { label: 'Darwin (NT)', value: 'Australia/Darwin', key: 'Australia/Darwin-NT' },
  { label: 'Canberra (ACT)', value: 'Australia/Sydney', key: 'Australia/Sydney-ACT' },
];

const EditEventPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();
  const { selectedEvent, loading } = useSelector((state) => state.events);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    dateTime: '',
    timeZone: '',
    venue: '',
    description: '',
    organiserName: '',
    organiserEmail: '',
    organiserWebsite: '',
    organiserPrimaryContactName: '',
    organiserPrimaryContactPhone: '',
    organiserSecondaryContactName: '',
    organiserSecondaryContactPhone: '',
    address: {
      formattedAddress: '',
      streetNumber: '',
      street: '',
      suburb: '',
      state: '',
      postalCode: '',
      location: { type: 'Point', coordinates: [0, 0] },
    },
    images: [],
  });

  const [existingImages, setExistingImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [focusedField, setFocusedField] = useState(null);

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  useEffect(() => {
    dispatch(fetchEventById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedEvent) {
      const org = selectedEvent.organiser || {};
      const zone = selectedEvent.timeZone;
      const zonedDate = utcToZonedTime(new Date(selectedEvent.dateTime), zone);
      const formattedDate = format(zonedDate, "yyyy-MM-dd'T'HH:mm");
      setFormData((prev) => ({
        ...prev,
        ...selectedEvent,
        dateTime: formattedDate,
        organiserName: org.name || '',
        organiserEmail: org.email || '',
        organiserWebsite: org.website || '',
        organiserPrimaryContactName: org.primaryContact?.name || '',
        organiserPrimaryContactPhone: org.primaryContact?.phone || '',
        organiserSecondaryContactName: org.secondaryContact?.name || '',
        organiserSecondaryContactPhone: org.secondaryContact?.phone || '',
        address: {
          ...prev.address,
          ...selectedEvent.address,
        },
        images: [],
      }));
      setExistingImages(selectedEvent.images || []);
    }
  }, [selectedEvent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + preview.length + existingImages.length > 3) {
      toast.error('You can upload up to 3 images only.');
      return;
    }
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const handleRemoveNewImage = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredFields = [
      'title','dateTime','timeZone','venue','description','organiserName','organiserPrimaryContactName','organiserPrimaryContactPhone'
    ];
    const missing = requiredFields.filter((field) => !formData[field]);
    if (missing.length > 0) {
      toast.error(`Missing required fields: ${missing.join(', ')}`);
      return;
    }
    const formPayload = new FormData();
    existingImages.forEach((imgObj) => {
      formPayload.append('existingImages', JSON.stringify(imgObj));
    });
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'images') {
        value.forEach((file) => formPayload.append('images', file));
      } else if (key === 'address') {
        formPayload.append(key, JSON.stringify(value));
      } else if (key === 'dateTime') {
        const utcDate = zonedTimeToUtc(value, formData.timeZone);
        formPayload.append('dateTime', utcDate.toISOString());
      } else {
        formPayload.append(key, value ?? '');
      }
    });
    try {
      const result = await dispatch(updateEventById({ id, data: formPayload }));
      if (updateEventById.fulfilled.match(result)) {
        toast.success('Event updated successfully!');
        router.push('/events');
      } else {
        throw new Error(result.payload || 'Failed to update event');
      }
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  if (loading && !selectedEvent) {
    return <div className="flex justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Event</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
  
        {/* 1. Title */}
        <div>
          <label className="block font-semibold">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
  
        {/* 2. Date & Time */}
        <div>
          <label className="block font-semibold">Date & Time</label>
          <input
            type="datetime-local"
            name="dateTime"
            value={formData.dateTime}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
  
        {/* 3. Time Zone */}
        <div>
          <label className="block font-semibold">Time Zone</label>
          <select
            name="timeZone"
            value={formData.timeZone}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="" disabled>Select time zone</option>
            {AU_TIMEZONES.map((tz) => (
              <option key={tz.key} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
  
        {/* 4. Category */}
        <div>
          <label className="block font-semibold">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
  
        {/* 5. Venue */}
        <div>
          <label className="block font-semibold">Venue</label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
  
        {/* 6. Address */}
        <AddressInput
          formData={formData}
          setFormData={setFormData}
          handleFocus={handleFocus}
          handleBlur={handleBlur}
          focusedField={focusedField}
        />
  
        {/* 7–13. Organiser Fields */}
        {[
          'organiserName',
          'organiserEmail',
          'organiserWebsite',
          'organiserPrimaryContactName',
          'organiserPrimaryContactPhone',
          'organiserSecondaryContactName',
          'organiserSecondaryContactPhone'
        ].map((field) => (
          <div key={field}>
            <label className="block font-semibold">
              {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
            <input
              type={field.includes('Email') ? 'email' : 'text'}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        ))}
  
        {/* 14. Upload Images */}
        <div>
          <label className="block font-bold">Upload Images (Max 3)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
          <div className="mt-4 flex gap-4 flex-wrap">
            {existingImages.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img.url} alt={`Existing ${idx}`} className="w-24 h-24 object-cover border" />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(idx)}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                >
                  X
                </button>
              </div>
            ))}
            {preview.map((src, idx) => (
              <div key={`new-${idx}`} className="relative">
                <img src={src} alt={`Preview ${idx + 1}`} className="w-24 h-24 object-cover border" />
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(idx)}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
  
        {/* 15. Description */}
        <div>
          <label className="block font-semibold">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded min-h-[100px]"
          />
        </div>
  
        {/* Buttons */}
        <div className="flex gap-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Update Event
          </button>
          <button type="button" onClick={() => router.back()} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
  
};

export default EditEventPage;
