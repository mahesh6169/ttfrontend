'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { addEvent } from '@/store/slices/events/eventSlice';
import { CATEGORY_OPTIONS } from '@/components/events/addevents/EventCategories';
import AddressInput from '@/components/events/addevents/AddressInput';
import ImageUploader from '@/components/events/addevents/ImageUploader';
import { zonedTimeToUtc } from 'date-fns-tz';
import Link from 'next/link';

const AU_TIMEZONES = [
  {
    label: 'Sydney (NSW)',
    value: 'Australia/Sydney',
    key: 'Australia/Sydney-NSW',
  },
  {
    label: 'Melbourne (VIC)',
    value: 'Australia/Melbourne',
    key: 'Australia/Melbourne-VIC',
  },
  {
    label: 'Brisbane (QLD)',
    value: 'Australia/Brisbane',
    key: 'Australia/Brisbane-QLD',
  },
  { label: 'Perth (WA)', value: 'Australia/Perth', key: 'Australia/Perth-WA' },
  {
    label: 'Adelaide (SA)',
    value: 'Australia/Adelaide',
    key: 'Australia/Adelaide-SA',
  },
  {
    label: 'Hobart (TAS)',
    value: 'Australia/Hobart',
    key: 'Australia/Hobart-TAS',
  },
  {
    label: 'Darwin (NT)',
    value: 'Australia/Darwin',
    key: 'Australia/Darwin-NT',
  },
  {
    label: 'Canberra (ACT)',
    value: 'Australia/Sydney',
    key: 'Australia/Sydney-ACT',
  },
];

const AddEventPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

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
      location: {
        type: 'Point',
        coordinates: [0, 0],
      },
    },
    images: [],
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatSchedule, setRepeatSchedule] = useState([
    { day: 'Mon', time: '' },
  ]);
  const [endDate, setEndDate] = useState('');

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

    console.log('🧭 Submitting Event:', formData);

    const validations = [
      { condition: !formData.title, message: 'Title is required.' },
      { condition: !formData.dateTime, message: 'Date & Time are required.' },
      { condition: !formData.timeZone, message: 'Time zone is required.' },
      { condition: !formData.venue, message: 'Venue is required.' },
      { condition: !formData.description, message: 'Description is required.' },
      {
        condition: !formData.organiserName,
        message: 'Organiser name is required.',
      },
      {
        condition: !formData.organiserPrimaryContactName,
        message: 'Primary contact name is required.',
      },
      {
        condition: !formData.organiserPrimaryContactPhone,
        message: 'Primary contact phone is required.',
      },
      {
        condition: !formData.address.formattedAddress,
        message: 'Address is required.',
      },
    ];

    const errors = validations.filter((v) => v.condition).map((v) => v.message);

    if (errors.length > 0) {
      toast.error(
        <div>
          {errors.map((msg, i) => (
            <p key={i}>{msg}</p>
          ))}
        </div>
      );
      return;
    }

    const formPayload = new FormData();
    if (isRecurring) {
      formPayload.append('isRecurring', 'true');

      const convertedSchedule = repeatSchedule.map(({ day, time }) => ({
        day,
        time, // "HH:mm" format only
      }));

      formPayload.append('repeatSchedule', JSON.stringify(convertedSchedule));

      if (endDate) {
        formPayload.append('endDate', endDate);
      }
    }

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
        <div className="border rounded-lg p-4 shadow-md bg-white text-center">
          <p className="text-gray-700 mb-4">
            You must be logged in to add a new advert.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/users/login?preserveRedirect=true"
              onClick={() => {
                localStorage.setItem('redirectAfterLogin', '/events/add');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              href="/users/register?preserveRedirect=true"
              onClick={() => {
                localStorage.setItem('redirectAfterLogin', '/events/add');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Register
            </Link>
          </div>
        </div>
      ) : (
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
              <option value="" disabled>
                Select time zone
              </option>
              {AU_TIMEZONES.map((tz) => (
                <option key={tz.key} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* 🔁 Recurrence Section */}
          <div className="border rounded p-4 bg-gray-50">
            <label className="block font-semibold mb-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="mr-2"
              />
              Is this a recurring event?
            </label>

            {isRecurring && (
              <>
                {/* Repeat Days with Times */}
                <div className="space-y-2 mb-4">
                  {repeatSchedule.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={entry.day}
                        onChange={(e) => {
                          const updated = [...repeatSchedule];
                          updated[idx].day = e.target.value;
                          setRepeatSchedule(updated);
                        }}
                        className="p-2 border rounded"
                      >
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                          (d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          )
                        )}
                      </select>
                      <input
                        type="time"
                        value={entry.time}
                        onChange={(e) => {
                          const updated = [...repeatSchedule];
                          updated[idx].time = e.target.value;
                          setRepeatSchedule(updated);
                        }}
                        className="p-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRepeatSchedule((prev) =>
                            prev.filter((_, i) => i !== idx)
                          );
                        }}
                        className="text-red-600 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setRepeatSchedule((prev) => [
                        ...prev,
                        { day: 'Mon', time: '' },
                      ])
                    }
                    className="text-blue-600 text-sm underline"
                  >
                    + Add another
                  </button>
                </div>

                {/* End Date */}
                <div>
                  <label className="block font-semibold">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </>
            )}
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
              <option value="" disabled>
                Select a category
              </option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
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
            focusedField={focusedField}
            handleFocus={handleFocus}
            handleBlur={handleBlur}
          />

          {/* 7–13. Organiser Fields */}
          {[
            'organiserName',
            'organiserEmail',
            'organiserWebsite',
            'organiserPrimaryContactName',
            'organiserPrimaryContactPhone',
            'organiserSecondaryContactName',
            'organiserSecondaryContactPhone',
          ].map((field) => (
            <div key={field}>
              <label className="block font-semibold">
                {field
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase())}
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
          <ImageUploader
            preview={preview}
            setPreview={setPreview}
            formData={formData}
            setFormData={setFormData}
          />

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
          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Event
            </button>
            <button
              type="button"
              onClick={() => {
                const backTo = localStorage.getItem('cancelRedirectUrl');
                localStorage.removeItem('cancelRedirectUrl');
                router.push(backTo || '/');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddEventPage;
