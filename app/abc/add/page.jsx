'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addAdvert, clearAdverts } from '@/store/slices/advertSlice';
import { LoadScript, Autocomplete } from '@react-google-maps/api';

const NewAdvertPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const isLoggedIn = useSelector((state) => state.user.isAuthenticated);
  const { user } = useSelector((state) => state.user);
  const { status, error } = useSelector((state) => state.advert);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    sell: false,
    hire: false,
    price: '',
    hireDetails: {
      perHour: 0, // Default value for number
      perDay: 0, // Default value for number
      rateType: 'perDay', // Default rate type
    },
    address: {
      formattedAddress: '',
      street: '',
      suburb: '',
      state: '',
      postalCode: '',
      coordinates: { lat: 0, lng: 0 }, // Default to 0 for numbers
    },
    email: isLoggedIn && user ? user.email : '',
    name: isLoggedIn && user ? user.name : '',
    images: [],
  });

  const categoryOptions = [
    'Antiques, Art & Collectables',
    'Baby & Children',
    'Books, Music & Games',
    'Cars & Vehicles',
    'Clothing & Jewellery',
    'Community',
    'Electronics & Computer',
    'Home & Garden',
    'Jobs',
    'Miscellaneous',
    'Pets',
    'Real Estate',
    'Services For Hire',
    'Sport & Fitness',
    'Restaurants and Cloud Kitchens',
  ];

  const [autocomplete, setAutocomplete] = useState(null);
  const [preview, setPreview] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const addressComponents = place.address_components;

      const getComponent = (type) =>
        addressComponents.find((comp) => comp.types.includes(type))
          ?.long_name || '';

      const newAddress = {
        formattedAddress: place.formatted_address || '',
        street: getComponent('route'),
        suburb: getComponent('locality'),
        state: getComponent('administrative_area_level_1'),
        postalCode: getComponent('postal_code'),
        coordinates: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        },
      };

      setFormData((prev) => ({
        ...prev,
        address: newAddress,
      }));
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name.startsWith('hireDetails')) {
      const [, key] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        hireDetails: {
          ...prev.hireDetails,
          [key]: value,
        },
      }));
    } else if (name.startsWith('address')) {
      const [, key] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + preview.length > 3) {
      alert('You can upload up to 3 images only.');
      return;
    }
    setPreview((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const handleRemoveImage = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isLoggedIn && (!formData.email || !formData.name)) {
      setErrorMessage('Email and Name are required for non-logged-in users.');
      return;
    }

    const formPayload = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'images') {
        formData.images.forEach((file) => formPayload.append('images', file));
      } else if (key === 'hireDetails') {
        const hireDetails = {
          isForHire: formData.hire,
          rate: {
            perHour: parseFloat(formData.hireDetails.perHour) || 0,
            perDay: parseFloat(formData.hireDetails.perDay) || 0,
          },
        };
        console.log('hireDetails being sent:', hireDetails); // Log the data here
        formPayload.append(key, JSON.stringify(hireDetails));
      } else if (key === 'address') {
        formPayload.append(key, JSON.stringify(formData[key]));
      } else {
        formPayload.append(key, formData[key] || '');
      }
    });
    try {
      const resultAction = await dispatch(addAdvert(formPayload));
      if (addAdvert.fulfilled.match(resultAction)) {
        setSuccessMessage('Advert successfully added!');
        setFormData({
          title: '',
          description: '',
          category: '',
          sell: false,
          hire: false,
          price: '',
          hireDetails: { perHour: '', perDay: '' },
          address: {
            formattedAddress: '',
            street: '',
            suburb: '',
            state: '',
            postalCode: '',
            coordinates: { lat: '', lng: '' },
          },
          email: isLoggedIn && user ? user.email : '',
          name: isLoggedIn && user ? user.name : '',
          images: [],
        });
        setPreview([]);
        await router.push(isLoggedIn ? '/users/profile' : '/adverts');
        dispatch(clearAdverts());
      } else {
        throw new Error(resultAction.payload || 'Failed to add advert.');
      }
    } catch (error) {
      console.error('Error adding advert:', error);
      setErrorMessage('An unexpected error occurred.');
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Advert</h1>
      {status === 'loading' && (
        <p className="text-blue-500 mb-4">Adding advert...</p>
      )}
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      {successMessage && (
        <p className="text-green-500 mb-4">{successMessage}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Conditionally render Email and Name fields */}
        {!isLoggedIn && (
          <>
            <div>
              <label className="block font-bold">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block font-bold">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </>
        )}
        <div>
          <label className="block font-bold">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-bold">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-bold">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categoryOptions.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-4">
          {/* Sell Option */}
          <div>
            <label className="block font-bold">Sell</label>
            <input
              type="checkbox"
              name="sell"
              checked={formData.sell}
              onChange={(e) => {
                handleChange(e);
                if (e.target.checked) {
                  setFormData((prev) => ({ ...prev, hire: false })); // Disable hire if sell is checked
                }
              }}
              className="mr-2"
            />
          </div>

          {/* Hire Option */}
          <div>
            <label className="block font-bold">Hire</label>
            <input
              type="checkbox"
              name="hire"
              checked={formData.hire}
              onChange={(e) => {
                handleChange(e);
                if (e.target.checked) {
                  setFormData((prev) => ({ ...prev, sell: false })); // Disable sell if hire is checked
                }
              }}
              className="mr-2"
            />
          </div>
        </div>

        {/* Price Field for Sell */}
        {formData.sell && (
          <div className="mt-4">
            <label className="block font-bold">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        {/* Rate Fields for Hire */}
        {formData.hire && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold">Rate per Hour</label>
              <input
                type="number"
                name="hireDetails.perHour"
                value={formData.hireDetails.perHour || 0} // Ensure a valid number
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hireDetails: {
                      ...prev.hireDetails,
                      perHour: parseFloat(e.target.value) || 0,
                    },
                  }))
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-bold">Rate per Day</label>
              <input
                type="number"
                name="hireDetails.perDay"
                value={formData.hireDetails.perDay || 0} // Ensure a valid number
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hireDetails: {
                      ...prev.hireDetails,
                      perDay: parseFloat(e.target.value) || 0,
                    },
                  }))
                }
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block font-bold">Address</label>
          <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            libraries={['places']}
          >
            <Autocomplete
              onLoad={(auto) => setAutocomplete(auto)}
              onPlaceChanged={handlePlaceChanged}
              options={{
                componentRestrictions: { country: 'AU' }, // Restrict to Australia
              }}
            >
              <input
                type="text"
                placeholder="Enter an address"
                className="w-full p-2 border rounded"
              />
            </Autocomplete>
          </LoadScript>
        </div>

        <div>
          <label className="block font-bold">Upload Images (Max 3)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
          <div className="mt-4 flex gap-4">
            {preview.map((src, index) => (
              <div key={index} className="relative">
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-24 h-24 object-cover border"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default NewAdvertPage;
