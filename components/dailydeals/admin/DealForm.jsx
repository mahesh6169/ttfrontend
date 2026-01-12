'use client';

import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import DealImageUploader from './DealImageUploader';

const DAYS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' }
];

export default function DealForm({ initialData = null, onSubmit, onCancel }) {
  const [partners, setPartners] = useState([]);
  const [formData, setFormData] = useState({
    partnerstoreId: initialData?.partnerstoreId?._id || initialData?.partnerstoreId || '',
    dealTitle: initialData?.dealTitle || '',
    description: initialData?.description || '',
    terms: initialData?.terms || '',
    validDays: initialData?.validDays || [],
    startDate: initialData?.startDate ? initialData.startDate.split('T')[0] : '',
    endDate: initialData?.endDate ? initialData.endDate.split('T')[0] : '',
    featured: {
      isActive: initialData?.featured?.isActive || false,
      startDate: initialData?.featured?.startDate ? initialData.featured.startDate.split('T')[0] : '',
      endDate: initialData?.featured?.endDate ? initialData.featured.endDate.split('T')[0] : ''
    },
    isActive: initialData?.isActive !== false
  });

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState(initialData?.images || []);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await axios.get('/admin/dailydeals/partners-dropdown');
      if (response.data.success) {
        setPartners(response.data.partners);
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('featured.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        featured: {
          ...prev.featured,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      validDays: prev.validDays.includes(day)
        ? prev.validDays.filter(d => d !== day)
        : [...prev.validDays, day]
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.partnerstoreId) {
      newErrors.partnerstoreId = 'Partner store is required';
    }

    if (!formData.dealTitle.trim()) {
      newErrors.dealTitle = 'Deal title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.featured.isActive) {
      if (!formData.featured.startDate) {
        newErrors.featuredStartDate = 'Featured start date is required';
      }
      if (!formData.featured.endDate) {
        newErrors.featuredEndDate = 'Featured end date is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('partnerstoreId', formData.partnerstoreId);
      submitData.append('dealTitle', formData.dealTitle);
      submitData.append('description', formData.description);
      submitData.append('terms', formData.terms);
      submitData.append('validDays', JSON.stringify(formData.validDays));
      submitData.append('startDate', formData.startDate);
      submitData.append('endDate', formData.endDate);
      submitData.append('featured', JSON.stringify(formData.featured));
      submitData.append('isActive', formData.isActive);

      // Handle images
      if (initialData) {
        // Edit mode: send keepImages array
        const keepImageIds = existingImages.map(img => img.publicId);
        submitData.append('keepImages', JSON.stringify(keepImageIds));
      }

      // Append new images
      images.forEach(img => {
        submitData.append('images', img.file);
      });

      await onSubmit(submitData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Partner Store */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Partner Store *
        </label>
        <select
          name="partnerstoreId"
          value={formData.partnerstoreId}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Select partner store</option>
          {partners.map(partner => (
            <option key={partner._id} value={partner._id}>
              {partner.businessName} ({partner.category})
            </option>
          ))}
        </select>
        {errors.partnerstoreId && (
          <p className="text-red-500 text-sm mt-1">{errors.partnerstoreId}</p>
        )}
      </div>

      {/* Deal Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deal Title *
        </label>
        <input
          type="text"
          name="dealTitle"
          value={formData.dealTitle}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g., 20% Off All Pizzas"
        />
        {errors.dealTitle && (
          <p className="text-red-500 text-sm mt-1">{errors.dealTitle}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Describe the deal..."
        />
      </div>

      {/* Terms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Terms & Conditions
        </label>
        <textarea
          name="terms"
          value={formData.terms}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g., Not valid with other offers. Dine-in only."
        />
      </div>

      {/* Valid Days */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Valid Days (leave empty for every day)
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <button
              key={day.value}
              type="button"
              onClick={() => handleDayToggle(day.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                formData.validDays.includes(day.value)
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {errors.startDate && (
            <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {errors.endDate && (
            <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Featured Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            name="featured.isActive"
            checked={formData.featured.isActive}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm font-medium text-gray-700">
            Feature this deal (show at top of list)
          </label>
        </div>

        {formData.featured.isActive && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Start Date
              </label>
              <input
                type="date"
                name="featured.startDate"
                value={formData.featured.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {errors.featuredStartDate && (
                <p className="text-red-500 text-sm mt-1">{errors.featuredStartDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured End Date
              </label>
              <input
                type="date"
                name="featured.endDate"
                value={formData.featured.endDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {errors.featuredEndDate && (
                <p className="text-red-500 text-sm mt-1">{errors.featuredEndDate}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="mr-2"
        />
        <label className="text-sm text-gray-700">
          Deal is active
        </label>
      </div>

      {/* Image Upload */}
      <DealImageUploader
        mode={initialData ? 'edit' : 'create'}
        existingImages={existingImages}
        setExistingImages={setExistingImages}
        images={images}
        setImages={setImages}
      />

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Deal' : 'Create Deal')}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
