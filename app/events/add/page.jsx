'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { addEvent } from '@/store/slices/eventSlice';
import { CATEGORY_OPTIONS } from '@/components/events/EventCategories';
import AddressInput from '@/components/addadvert/AddressInput';
import ImageUploader from '@/components/addadvert/ImageUploader';

const AddEventPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

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
      location: {
        type: 'Point',
        coordinates: [0, 0],
      },
    },
    images: [],
  });

  const [preview, setPreview] = useState([]);
  const [focusedField, setFocusedField] = useState(null);

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validations = [
      { condition: !formData.title, message: 'Title is required.' },
      { condition: !formData.dateTime, message: 'Date & Time are required.' },
      { condition: !formData.venue, message: 'Venue is required.' },
      { condition: !formData.description, message: 'Description is required.' },
      { condition: !formData.organiserName, message: 'Organiser name is required.' },
      { condition: !formData.organiserPrimaryContactName, message: 'Primary contact name is required.' },
      { condition: !formData.organiserPrimaryContactPhone, message: 'Primary contact phone is required.' },
      { condition: !formData.address.formattedAddress, message: 'Address is required.' },
    ];

    const errors = validations.filter(v => v.condition).map(v => v.message);

    if (errors.length > 0) {
      toast.error(<div>{errors.map((msg, i) => <p key={i}>{msg}</p>)}</div>);
      return;
    }

    const formPayload = new FormData();
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
      const resultAction = await dispatch(addEvent(formPayload));
      if (addEvent.fulfilled.match(resultAction)) {
        toast.success('Event added successfully!');
        router.push('/events');
      } else {
        throw new Error(resultAction.payload || 'Failed to add event.');
      }
    } catch (error) {
      toast.error(error.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Event</h1>
      {!isLoggedIn ? (
        <div className="text-center bg-yellow-100 p-4 rounded">
          <p className="text-gray-700">Please login to add a new event.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {['title', 'venue', 'description', 'organiserName', 'organiserEmail', 'organiserWebsite', 'organiserPrimaryContactName', 'organiserPrimaryContactPhone', 'organiserSecondaryContactName', 'organiserSecondaryContactPhone'].map((field) => (
            <div key={field}>
              <label className="block font-semibold">{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
              <input
                type={field.includes('Email') ? 'email' : field.includes('Phone') ? 'text' : 'text'}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}

          <div>
            <label className="block font-semibold">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="" disabled>Select a category</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

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

          <AddressInput
            formData={formData}
            setFormData={setFormData}
            focusedField={focusedField}
            handleFocus={handleFocus}
            handleBlur={handleBlur}
          />

          <ImageUploader
            preview={preview}
            setPreview={setPreview}
            formData={formData}
            setFormData={setFormData}
          />

          <div className="flex gap-4 mt-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Event</button>
            <button type="button" onClick={() => router.back()} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddEventPage;
