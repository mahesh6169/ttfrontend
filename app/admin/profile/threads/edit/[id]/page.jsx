'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateThread,
  fetchThreadById,
} from '@/store/slices/threads/threadSlice';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';

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
  'Travel Partner',
  'financial aid',
];

const EditThreadPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const threadId = params?.id;

  const thread = useSelector((state) => state.threads.selectedThread);

  const [formData, setFormData] = useState({
    title: '',
    question: '',
    category: '',
    images: [],
  });
  const [existingImages, setExistingImages] = useState([]);
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    if (threadId) {
      dispatch(fetchThreadById(threadId));
    }
  }, [dispatch, threadId]);

  useEffect(() => {
    console.log('[EditPage] thread from Redux:', thread);
    if (thread) {
      console.log('[EditPage] Populating form with fetched thread data');
      setFormData({
        title: thread.title || '',
        question: thread.question || '',
        category: thread.category || '',
        images: [],
      });
      setExistingImages(thread.images || []);
      setPreview((thread.images || []).map((img) => img.url));
    }
  }, [thread]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + preview.length > 10) {
      alert('You can upload up to 10 images only.');
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`Unsupported file type: ${file.name}. Only JPEG, PNG, WebP, and GIF formats are allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Each image must be under 5MB.`);
        return false;
      }
      return true;
    });
    
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...validFiles] }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, question, category, images } = formData;

    if (!title || !question || !category) {
      toast.error('All fields are required.');
      return;
    }

    const formPayload = new FormData();
    formPayload.append('title', title);
    formPayload.append('question', question);
    formPayload.append('category', category);
    existingImages.forEach((img) =>
      formPayload.append('existingImages', JSON.stringify(img))
    );
    images.forEach((file) => formPayload.append('images', file));

    const result = await dispatch(
      updateThread({ threadId, formData: formPayload })
    );

    if (updateThread.fulfilled.match(result)) {
      toast.success('Thread updated successfully.');
      router.push('/users/profile/managethreads');
    } else {
      toast.error(result.payload || 'Failed to update thread.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 mt-10 bg-white border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Edit Thread</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          value={formData.title || ''}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          placeholder="Thread Title"
          required
        />
        <textarea
          name="question"
          value={formData.question || ''}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          placeholder="Describe your question..."
          required
        />
        <select
          name="category"
          value={formData.category}
          onChange={handleChange || ''}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Category</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <div>
          <label className="font-semibold block mb-1">Images (Max 10, 5MB each)</label>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-4 mt-4 flex-wrap">
            {preview.map((src, idx) => (
              <div key={idx} className="relative">
                <img
                  src={src}
                  alt={`img-${idx}`}
                  className="w-24 h-24 object-cover border"
                />
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

        <div className="flex justify-between mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Update Thread
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditThreadPage;
