'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createThread } from '@/store/slices/threadSlice';
import { useRouter } from 'next/navigation';

const categoryOptions = [
  'Studying in Australia',
  'Living in Australia',
  'Working in Australia',
  'Migration',
  'Travel',
  'Jobs',
  'Baby & Children',
  'Antiques, Art & Collectables',
  'Books, Music & Games',
  'Cars & Vehicles',
  'Clothing & Jewellery',
  'Community',
  'Electronics & Computer',
  'Home & Garden',
  'Miscellaneous',
  'Pets',
  'Real Estate',
  'Services For Hire',
  'Sport & Fitness',
  'Restaurants and Cloud Kitchens',
  'Health & Beauty',
  'Education & Learning', 
];

const CreateThreadPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const isLoggedIn = useSelector((state) => state.user.tokenValidated);
  const { user } = useSelector((state) => state.user) || {};

  // Initial form state
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    category: '',
    email: '',
    name: '',
  });

  // Ensure email & name are set correctly when the user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || '',
        name: user.name || '',
      }));
    }
  }, [isLoggedIn, user]);

  // Handle Form Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate Required Fields
    if (!formData.title.trim() || !formData.question.trim() || !formData.category.trim()) {
      alert('⚠️ Title, question, and category are required!');
      return;
    }

    console.log('Submitting form data:', formData); // ✅ Debugging line

    await dispatch(createThread(formData));
    router.push('/threads'); // Redirect to Threads List
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-lg bg-white">
      <h1 className="text-2xl font-bold mb-4">Create a New Thread</h1>

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
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* Show Email & Name Fields Only for Guest Users */}
        {!isLoggedIn && (
          <>
            <input
              type="email"
              name="email"
              placeholder="Email (Guest Users)"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            />

            <input
              type="text"
              name="name"
              placeholder="Name (Guest Users)"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            />
          </>
        )}

        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Thread
        </button>
      </form>
    </div>
  );
};

export default CreateThreadPage;
