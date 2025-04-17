'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createThread } from '@/store/slices/threadSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  'Travel Partner', 'financial aid'
];

const CreateThreadPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const isLoggedIn = useSelector((state) => state.user.tokenValidated);
  const { user } = useSelector((state) => state.user) || {};

  const [formData, setFormData] = useState({
    title: '',
    question: '',
    category: '',
    images: [],
  });

  const [preview, setPreview] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + preview.length > 3) {
      alert('You can upload up to 3 images only.');
      return;
    }
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
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
    if (!formData.title.trim() || !formData.question.trim() || !formData.category.trim()) {
      alert('⚠️ Title, question, and category are required!');
      return;
    }

    if (!isLoggedIn) {
      router.push('/users/login?preserveRedirect=true');
      return;
    }

    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'images') {
        value.forEach((file) => formPayload.append('images', file));
      } else {
        formPayload.append(key, value);
      }
    });

    await dispatch(createThread(formPayload));
    router.push('/threads');
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-lg bg-white">
      <h1 className="text-2xl font-bold mb-4">Create a New Thread</h1>
  
      {!isLoggedIn ? (
        <div className="text-center bg-yellow-50 p-6 rounded border border-yellow-200 mb-4">
          <p className="text-gray-700">
            Please{' '}
            <Link
              href="/users/login?preserveRedirect=true"
              className="text-blue-600 underline"
              onClick={() => localStorage.setItem('redirectAfterLogin', '/threads/new')}
            >
              Login
            </Link>{' '}
            or{' '}
            <Link
              href="/users/register?preserveRedirect=true"
              className="text-blue-600 underline"
              onClick={() => localStorage.setItem('redirectAfterLogin', '/threads/new')}
            >
              Register
            </Link>{' '}
            to create a thread.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Thread Title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            required
          />
          <textarea
            name="question"
            placeholder="Describe your question..."
            value={formData.question}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            required
          />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            required
          >
            <option value="">Select Category</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
  
          {/* Image Upload */}
          <div>
            <label className="block font-semibold">Upload Images (Max 3)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded"
            />
            <div className="mt-4 flex gap-4 flex-wrap">
              {preview.map((src, idx) => (
                <div key={idx} className="relative">
                  <img src={src} alt={`Preview ${idx}`} className="w-24 h-24 object-cover border" />
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
  
          <div className="flex gap-4 mt-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Create Thread
            </button>
            <button
              type="button"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-400"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
  
};

export default CreateThreadPage;
