'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import {
  fetchEventById,
  updateEventById,
} from '@/store/slices/events/eventSlice';
import { CATEGORY_OPTIONS } from '@/components/events/addevents/EventCategories';
import AddressInput from '@/components/events/addevents/AddressInput';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';
import { utcToZonedTime, formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';
import { format } from 'date-fns';

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

  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatSchedule, setRepeatSchedule] = useState([
    { day: 'Mon', time: '' },
  ]);
  const [endDate, setEndDate] = useState('');

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
      setIsRecurring(selectedEvent?.recurrence?.isRecurring || false);

      setRepeatSchedule(
        selectedEvent?.recurrence?.repeatSchedule?.length > 0
          ? selectedEvent.recurrence.repeatSchedule.map(({ day, time }) => {
              // Validate and pass HH:mm directly
              return {
                day,
                time: /^\d{2}:\d{2}$/.test(time) ? time : '', // fallback if malformed
              };
            })
          : [{ day: 'Mon', time: '' }]
      );

      setEndDate(
        selectedEvent?.recurrence?.endDate
          ? format(new Date(selectedEvent.recurrence.endDate), 'yyyy-MM-dd')
          : ''
      );
      setEndDate(
        selectedEvent?.recurrence?.endDate
          ? format(new Date(selectedEvent.recurrence.endDate), 'yyyy-MM-dd')
          : ''
      );
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
      'title',
      'dateTime',
      'timeZone',
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

    // ✅ Recurrence Logic
    if (isRecurring) {
      formPayload.append('isRecurring', 'true');

      const convertedSchedule = repeatSchedule.map(({ day, time }) => {
        if (!/^[0-9]{2}:[0-9]{2}$/.test(time)) {
          toast.error(`Invalid time format for ${day}: ${time}`);
          throw new Error(`Invalid time format for ${day}: ${time}`);
        }
        return { day, time }; // Send clean HH:mm format
      });

      formPayload.append('repeatSchedule', JSON.stringify(convertedSchedule));
      if (endDate) {
        formPayload.append('endDate', endDate);
      }
    }

    // ✅ Retained Images
    existingImages.forEach((imgObj) => {
      formPayload.append('existingImages', JSON.stringify(imgObj));
    });

    // ✅ Form Fields
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

    // ✅ Dispatch update
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
    return (
      <div className="flex justify-center h-64">
        <LoadingSpinner />
      </div>
    );
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
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
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
                <img
                  src={img.url}
                  alt={`Existing ${idx}`}
                  className="w-24 h-24 object-cover border"
                />
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
                <img
                  src={src}
                  alt={`Preview ${idx + 1}`}
                  className="w-24 h-24 object-cover border"
                />
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
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Update Event
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEventPage;
