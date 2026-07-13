'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import DealImageUploader from './DealImageUploader';
import SimpleDropdown from '@/components/shared/SimpleDropdown';

const DAYS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' }
];

export default function DealForm({ initialData = null, onSubmit, partnersEndpoint = '/admin/dailydeals/partners-dropdown', isAdmin = true, isLoading = false }) {
  const [partners, setPartners] = useState([]);
  const [formData, setFormData] = useState({
    partnerstoreId: initialData?.partnerstoreId?._id || initialData?.partnerstoreId || '',
    dealTitle: initialData?.dealTitle || '',
    description: initialData?.description || '',
    terms: initialData?.terms || '',
    dealLink: initialData?.dealLink || '',
    whatsappOrders: initialData?.whatsappOrders || false,
    whatsappNumber: initialData?.whatsappNumber || '',
    validDays: initialData?.validDays || [],
    startDate: initialData?.startDate ? initialData.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate ? initialData.endDate.split('T')[0] : '',
    featured: {
      isActive: initialData?.featured?.isActive || false,
      startDate: initialData?.featured?.startDate ? initialData.featured.startDate.split('T')[0] : '',
      endDate: initialData?.featured?.endDate ? initialData.featured.endDate.split('T')[0] : ''
    },
    isActive: initialData?.isActive !== false,
    isOnline: initialData?.isOnline !== false
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
      const response = await axios.get(partnersEndpoint);
      if (response.data.success) {
        // Support both 'partners' (admin) and 'stores' (user) response formats
        setPartners(response.data.partners || response.data.stores || []);
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
      newErrors.partnerstoreId = 'Business is required';
    }

    if (!formData.dealTitle.trim()) {
      newErrors.dealTitle = 'Deal title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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

    // Deal link validation (optional, but must be valid HTTPS if provided)
    if (formData.dealLink) {
      const urlPattern = /^https:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;
      if (!urlPattern.test(formData.dealLink.trim())) {
        newErrors.dealLink = 'Enter a valid URL (e.g., https://example.com/deal)';
      }
    }

    // WhatsApp number validation (required if whatsappOrders is enabled)
    if (formData.whatsappOrders && !formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'WhatsApp number is required';
    } else if (formData.whatsappOrders && formData.whatsappNumber) {
      // Validate Australian mobile format (04xx xxx xxx or variations)
      const phonePattern = /^04\d{8}$/;
      const cleanNumber = formData.whatsappNumber.replace(/\s/g, '');
      if (!phonePattern.test(cleanNumber)) {
        newErrors.whatsappNumber = 'Enter a valid Australian mobile number (e.g., 0412345678)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Form Errors — please fix the highlighted fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('partnerstoreId', formData.partnerstoreId);
      submitData.append('dealTitle', formData.dealTitle);
      submitData.append('description', formData.description);
      submitData.append('terms', formData.terms);
      submitData.append('dealLink', formData.dealLink);
      submitData.append('whatsappOrders', formData.whatsappOrders);
      submitData.append('whatsappNumber', formData.whatsappNumber.replace(/\s/g, ''));
      submitData.append('validDays', JSON.stringify(formData.validDays));
      submitData.append('startDate', formData.startDate);
      submitData.append('endDate', formData.endDate);
      submitData.append('featured', JSON.stringify(formData.featured));
      submitData.append('isActive', formData.isActive);
      submitData.append('isOnline', formData.isOnline);

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
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-3 sm:p-6 rounded-lg shadow-md border border-slate-200 space-y-4 sm:space-y-6">
      {/* Business Selection */}
      <div>
        <label className="block font-medium mb-1 text-slate-600 text-sm sm:text-base">
          Select Business <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">Select Business/Store you want to create the Deal for</p>
        <SimpleDropdown
          value={formData.partnerstoreId}
          onChange={(value) => setFormData(prev => ({ ...prev, partnerstoreId: value }))}
          options={partners.map(partner => ({
            value: partner._id,
            label: `${partner.businessName}${partner.location ? ` (${partner.location})` : ''}`,
          }))}
          placeholder="Select"
        />
        {errors.partnerstoreId && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.partnerstoreId}</p>
        )}
      </div>

      {/* Deal Title */}
      <div>
        <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
          Deal Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="dealTitle"
          value={formData.dealTitle}
          onChange={handleChange}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
          placeholder="e.g., 20% Off All Pizzas"
        />
        {errors.dealTitle && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.dealTitle}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          maxLength={15000}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
          placeholder="Describe the deal..."
        />
        <div className="flex justify-between mt-1">
          {errors.description && (
            <p className="text-red-500 text-xs sm:text-sm">{errors.description}</p>
          )}
          <p className="text-xs text-slate-500 ml-auto">{formData.description.length}/15000</p>
        </div>
      </div>

      {/* Deal Link */}
      <div>
        <label className="block font-medium mb-1 text-slate-600 text-sm sm:text-base">
          Offer URL <span className="text-xs font-normal text-slate-500">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">Link to social media, offer details, or redemption page</p>
        <input
          type="url"
          name="dealLink"
          value={formData.dealLink}
          onChange={handleChange}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
          placeholder="https://example.com/summer-sale"
        />
        {errors.dealLink && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.dealLink}</p>
        )}
      </div>

      {/* WhatsApp Orders */}
      <div className="border border-slate-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="whatsappOrders"
            checked={formData.whatsappOrders}
            onChange={handleChange}
            className="mr-2 w-5 h-5 sm:w-4 sm:h-4"
          />
          <label className="text-sm sm:text-base font-medium text-slate-600">
            I will take orders via WhatsApp
          </label>
        </div>

        {formData.whatsappOrders && (
          <div className="mt-3">
            <label className="block font-medium mb-1 text-slate-600 text-sm sm:text-base">
              WhatsApp Number <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">Enter your Australian mobile number</p>
            <input
              type="tel"
              name="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={handleChange}
              className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
              placeholder="0412 345 678"
            />
            {errors.whatsappNumber && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.whatsappNumber}</p>
            )}
          </div>
        )}
      </div>

      {/* Deal Valid On */}
      <div>
        <label className="block font-medium mb-1 text-slate-600 text-sm sm:text-base">
          Deal Valid On <span className="text-xs font-normal text-slate-500">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">Leave empty if valid every day</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <button
              key={day.value}
              type="button"
              onClick={() => handleDayToggle(day.value)}
              className={`px-4 py-2 sm:px-3 sm:py-1 rounded-full text-sm font-medium transition-colors ${
                formData.validDays.includes(day.value)
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
          {errors.startDate && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.startDate}</p>
          )}
        </div>
        <div>
          <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
          {errors.endDate && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Featured Section - Admin Only */}
      {isAdmin && (
        <div className="border border-slate-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="featured.isActive"
              checked={formData.featured.isActive}
              onChange={handleChange}
              className="mr-2 w-5 h-5 sm:w-4 sm:h-4"
            />
            <label className="text-sm sm:text-base font-medium text-slate-600">
              Feature this deal (show at top of list)
            </label>
          </div>

          {formData.featured.isActive && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
                  Featured Start Date
                </label>
                <input
                  type="date"
                  name="featured.startDate"
                  value={formData.featured.startDate}
                  onChange={handleChange}
                  className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                {errors.featuredStartDate && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.featuredStartDate}</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
                  Featured End Date
                </label>
                <input
                  type="date"
                  name="featured.endDate"
                  value={formData.featured.endDate}
                  onChange={handleChange}
                  className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                {errors.featuredEndDate && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.featuredEndDate}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Status - Admin Only */}
      {isAdmin && (
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="mr-2 w-5 h-5 sm:w-4 sm:h-4"
          />
          <label className="text-sm sm:text-base text-slate-600">
            Deal is active
          </label>
        </div>
      )}

      {/* Online/Offline - Admin Only. Offline hides the deal from browse/search but
          keeps its direct link working, so you can preview it with a customer before launch. */}
      {isAdmin && (
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isOnline"
              checked={formData.isOnline}
              onChange={handleChange}
              className="mr-2 w-5 h-5 sm:w-4 sm:h-4"
            />
            <label className="text-sm sm:text-base text-slate-600">
              Deal is online (visible on the site)
            </label>
          </div>
          {!formData.isOnline && (
            <p className="text-xs text-slate-500 mt-1 ml-7">
              Offline: hidden from browse &amp; search, but the direct link still works for previewing.
            </p>
          )}
        </div>
      )}

      {/* Terms */}
      <div>
        <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
          Terms & Conditions
        </label>
        <textarea
          name="terms"
          value={formData.terms}
          onChange={handleChange}
          rows={3}
          maxLength={1000}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
          placeholder="e.g., Not valid with other offers. Dine-in only."
        />
        <p className="text-xs text-slate-500 text-right mt-1">{formData.terms.length}/1000</p>
      </div>

      {/* Image Upload */}
      <DealImageUploader
        mode={initialData ? 'edit' : 'create'}
        existingImages={existingImages}
        setExistingImages={setExistingImages}
        images={images}
        setImages={setImages}
      />

      {/* Submit Button */}
      <div className="text-center pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 rounded-lg font-semibold text-sm sm:text-base bg-teal-700 hover:bg-teal-800 text-white transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
}
