'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserThreads, deleteThread, editThread } from '@/store/slices/threadSlice';
import { useRouter } from 'next/navigation';
import { FaEdit, FaTrash } from 'react-icons/fa';
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
];

const ManageThreads = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { threads, status, error } = useSelector((state) => state.threads);
  const { user } = useSelector((state) => state.user);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ threadId: '', title: '', question: '', category: '', images: [] });
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    if (user && user._id) {
      dispatch(fetchUserThreads());
    }
  }, [dispatch, user]);

  const handleDelete = async (threadId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this thread?');
    if (!confirmDelete) return;

    const result = await dispatch(deleteThread(threadId));

    if (deleteThread.fulfilled.match(result)) {
      toast.success('Thread deleted successfully!');
      dispatch(fetchUserThreads());
    } else {
      toast.error(result.payload || 'Failed to delete thread.');
    }
  };

  const handleEditClick = (thread) => {
    setEditData({
      threadId: thread._id,
      title: thread.title,
      question: thread.question,
      category: thread.category,
      images: [],
    });
    setPreview(thread.images?.map((img) => img.url) || []);
    setIsEditing(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + preview.length > 3) {
      alert('You can upload up to 3 images only.');
      return;
    }
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...newPreviews]);
    setEditData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const handleRemoveImage = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setEditData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const { threadId, title, question, category, images } = editData;

    if (!title.trim() || !question.trim() || !category.trim()) {
      toast.error('Title, question, and category are required!');
      return;
    }

    const formPayload = new FormData();
    formPayload.append('title', title);
    formPayload.append('question', question);
    formPayload.append('category', category);
    images.forEach((file) => formPayload.append('images', file));

    const result = await dispatch(editThread({ threadId, formData: formPayload }));

    if (editThread.fulfilled.match(result)) {
      toast.success('Thread updated successfully!');
      setIsEditing(false);
      dispatch(fetchUserThreads());
    } else {
      toast.error(result.payload || 'Failed to update thread.');
    }
  };

  return (
    <div>
      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">Manage Your Threads</h1>

      {status === 'loading' && <p className="text-blue-500">Loading threads...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {threads.length === 0 && !error && status !== 'loading' && <p>No threads found. Start a new discussion!</p>}

      {threads.length > 0 && (
        <ul className="space-y-4">
          {threads.map((thread) => (
            <li key={thread._id} className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-100 transition-all duration-200">
              <div onClick={() => router.push(`/threads/${thread._id}`)} className="cursor-pointer flex-1">
                <h2 className="text-lg font-semibold text-blue-600 hover:underline">{thread.title}</h2>
                <p className="text-sm text-gray-700 italic">{thread.question}</p>
                <p className="text-sm text-gray-500">Started by {thread.owner?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-400">Created on: {new Date(thread.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-3">
                <button className="text-blue-500 hover:text-blue-700" title="Edit Thread" onClick={() => handleEditClick(thread)}>
                  <FaEdit size={18} />
                </button>
                <button className="text-red-500 hover:text-red-700" title="Delete Thread" onClick={() => handleDelete(thread._id)}>
                  <FaTrash size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isEditing && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Thread</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="text" name="title" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} placeholder="Title" className="w-full p-2 border rounded-lg" required />
              <textarea name="question" value={editData.question} onChange={(e) => setEditData({ ...editData, question: e.target.value })} placeholder="Describe your question..." className="w-full p-2 border rounded-lg" required />
              <select name="category" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })} className="w-full p-2 border rounded-lg" required>
                <option value="">Select Category</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div>
                <label className="block font-semibold">Upload Images (Max 3)</label>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full p-2 border rounded" />
                <div className="mt-4 flex gap-4 flex-wrap">
                  {preview.map((src, idx) => (
                    <div key={idx} className="relative">
                      <img src={src} alt={`Preview ${idx}`} className="w-24 h-24 object-cover border" />
                      <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded">X</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setIsEditing(false)} className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Cancel</button>
                <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageThreads;