'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import { fetchEventById, updateEventById } from '@/store/slices/eventSlice';
import { CATEGORY_OPTIONS } from '@/components/events/EventCategories';
import AddressInput from '@/components/addadvert/AddressInput';
import ImageUploader from '@/components/addadvert/ImageUploader';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';

const EditEventPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();

  const { selectedEvent, loading, error } = useSelector((state) => state.events);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    dateTime: '',
    timeZone: 'Australia/Sydney',
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
      setFormData((prev) => ({
        ...prev,
        ...selectedEvent,
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      'title',
      'dateTime',
      'venue',
      'description',
      'organiserName',
      'organiserPrimaryContactName',
      'organiserPrimaryContactPhone',
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
        <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Title" />
        <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Select category</option>
          {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input type="datetime-local" name="dateTime" value={formData.dateTime} onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="text" name="venue" value={formData.venue} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Venue" />
        <textarea name="description" value={formData.description} onChange={handleChange} onFocus={() => handleFocus('description')} onBlur={handleBlur} className="w-full p-2 border rounded" />

        <AddressInput
          formData={formData}
          setFormData={setFormData}
          handleFocus={handleFocus}
          handleBlur={handleBlur}
          focusedField={focusedField}
        />

        <ImageUploader
          preview={preview}
          setPreview={setPreview}
          existingImages={existingImages}
          setExistingImages={setExistingImages}
          formData={formData}
          setFormData={setFormData}
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Update Event</button>
        <button type="button" onClick={() => router.back()} className="ml-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Cancel</button>
      </form>
    </div>
  );
};

export default EditEventPage;
