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
    organiser: {
      name: '',
      email: '',
      website: '',
      contacts: [{ name: '', designation: '', phone: '' }],
    },
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
        condition: !formData.organiser?.name,
        message: 'Organiser name is required.',
      },
      {
        condition: !formData.organiser?.contacts?.[0]?.name,
        message: 'At least one contact name is required.',
      },
      {
        condition: !formData.organiser?.contacts?.[0]?.phone,
        message: 'At least one contact phone is required.',
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
        formPayload.append('address', JSON.stringify(value));
      } else if (key === 'organiser') {
        formPayload.append('organiser', JSON.stringify(value));
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
        router.push('/users/profile/manageevents');
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
          <p className="text-gray-700 mb-4 text-xs sm:text-base">
            You must be logged in to add a new advert.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/login?preserveRedirect=true"
              onClick={() => {
                localStorage.setItem('redirectAfterLogin', '/events/add');
              }}
              className="px-4 py-2 text-xs sm:text-base bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100"
            >
              Login
            </Link>
            <Link
              href="/register?preserveRedirect=true"
              onClick={() => {
                localStorage.setItem('redirectAfterLogin', '/events/add');
              }}
              className="px-4 py-2 text-xs sm:text-base bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100"
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
{/* 7. Organiser Fields */}
<div>
  <label className="block font-semibold">Organiser/Orgnisation Name</label>
  <input
    type="text"
    name="organiser.name"
    value={formData.organiser.name}
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        organiser: { ...prev.organiser, name: e.target.value },
      }))
    }
    className="w-full p-2 border rounded"
  />
</div>

<div>
  <label className="block font-semibold">Organiser Email</label>
  <input
    type="email"
    name="organiser.email"
    value={formData.organiser.email}
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        organiser: { ...prev.organiser, email: e.target.value },
      }))
    }
    className="w-full p-2 border rounded"
  />
</div>

<div>
  <label className="block font-semibold">Organiser Website</label>
  <input
    type="text"
    name="organiser.website"
    value={formData.organiser.website}
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        organiser: { ...prev.organiser, website: e.target.value },
      }))
    }
    className="w-full p-2 border rounded"
  />
</div>

{/* 🔁 Organiser Contacts Dynamic List */}
<div className="border rounded p-3 bg-gray-50">
  <label className="block font-semibold mb-2">Coordinator Contacts</label>
  {formData.organiser.contacts.map((contact, idx) => (
    <div key={idx} className="mb-2 space-y-1 border-b pb-2">
      <input
        type="text"
        placeholder="Name"
        value={contact.name}
        onChange={(e) => {
          const updated = [...formData.organiser.contacts];
          updated[idx].name = e.target.value;
          setFormData((prev) => ({
            ...prev,
            organiser: { ...prev.organiser, contacts: updated },
          }));
        }}
        className="w-full p-1 border rounded"
      />
      <input
        type="text"
        placeholder="Coordinator Role"
        value={contact.designation} 
        onChange={(e) => {
          const updated = [...formData.organiser.contacts];
          updated[idx].designation = e.target.value;
          setFormData((prev) => ({
            ...prev,
            organiser: { ...prev.organiser, contacts: updated },
          }));
        }}
        className="w-full p-1 border rounded"
      />
      <input
        type="text"
        placeholder="Phone"
        value={contact.phone}
        onChange={(e) => {
          const updated = [...formData.organiser.contacts];
          updated[idx].phone = e.target.value;
          setFormData((prev) => ({
            ...prev,
            organiser: { ...prev.organiser, contacts: updated },
          }));
        }}
        className="w-full p-1 border rounded"
      />
      <button
        type="button"
        onClick={() => {
          const filtered = formData.organiser.contacts.filter(
            (_, i) => i !== idx
          );
          setFormData((prev) => ({
            ...prev,
            organiser: { ...prev.organiser, contacts: filtered },
          }));
        }}
        className="text-sm text-red-600 mt-1"
      >
        Remove
      </button>
    </div>
  ))}
  {formData.organiser.contacts.length < 10 && (
    <button
      type="button"
      onClick={() =>
        setFormData((prev) => ({
          ...prev,
          organiser: {
            ...prev.organiser,
            contacts: [...prev.organiser.contacts, { name: '', designation: '', phone: '' }],
          },
        }))
      }
      className="text-sm text-blue-600 underline"
    >
      + Add Contact
    </button>
  )}
</div>


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
              className="bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100 px-4 py-2 rounded"
            >
              Add Event
            </button>
            <button
              type="button"
              onClick={() => {
                const backTo = localStorage.getItem('cancelRedirectUrl');
                localStorage.removeItem('cancelRedirectUrl');
                router.push(backTo || '/events');
              }}
              className="bg-red-400 text-white hover:bg-red-600   px-4 py-2 rounded "
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
