'use client';

import { useState } from 'react';

export default function CampaignForm({ initialData = null, onSubmit, onCancel, isEditing = false }) {
  const [formData, setFormData] = useState({
    campaignName: initialData?.campaignName || '',
    discount: initialData?.discount || '',
    discountProduct: initialData?.discountProduct || '',
    termsConditions: initialData?.termsConditions || '',
    expiryDate: initialData?.expiryDate 
      ? new Date(initialData.expiryDate).toISOString().split('T')[0] 
      : '',
    maxRedemptions: initialData?.maxRedemptions || 0,
    isHidden: initialData?.isHidden || false,
    isActive: initialData?.isActive ?? true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.campaignName.trim()) {
      newErrors.campaignName = 'Campaign name is required';
    }

    if (!formData.discount.trim()) {
      newErrors.discount = 'Discount is required';
    }

    if (!formData.discountProduct.trim()) {
      newErrors.discountProduct = 'Discount product is required';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const expiryDate = new Date(formData.expiryDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (expiryDate < now) {
        newErrors.expiryDate = 'Expiry date must be in the future';
      }

      // If editing, validate expiry can only be extended
      if (isEditing && initialData?.expiryDate) {
        const currentExpiry = new Date(initialData.expiryDate);
        if (expiryDate < currentExpiry) {
          newErrors.expiryDate = 'Cannot shorten expiry date. You can only extend it.';
        }
      }
    }

    // Validate maxRedemptions if editing
    if (isEditing && initialData?.totalGenerated) {
      const newMax = parseInt(formData.maxRedemptions) || 0;
      if (newMax > 0 && newMax < initialData.totalGenerated) {
        newErrors.maxRedemptions = `Cannot set below current generated codes (${initialData.totalGenerated})`;
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
      await onSubmit(formData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">

      {/* Campaign Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          name="campaignName"
          value={formData.campaignName}
          onChange={handleChange}
          maxLength={100}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g., Summer Special, Grand Opening"
        />
        {errors.campaignName && (
          <p className="text-red-500 text-sm mt-1">{errors.campaignName}</p>
        )}
      </div>

      {/* Discount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discount *
        </label>
        <input
          type="text"
          name="discount"
          value={formData.discount}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g., 20% off, $10 off"
        />
        {errors.discount && (
          <p className="text-red-500 text-sm mt-1">{errors.discount}</p>
        )}
      </div>

      {/* Discount Product */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discount Product *
        </label>
        <input
          type="text"
          name="discountProduct"
          value={formData.discountProduct}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g., all items, dinner menu"
        />
        {errors.discountProduct && (
          <p className="text-red-500 text-sm mt-1">{errors.discountProduct}</p>
        )}
      </div>

      {/* Terms & Conditions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Terms & Conditions
        </label>
        <textarea
          name="termsConditions"
          value={formData.termsConditions}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter any terms and conditions (optional)"
        />
      </div>

      {/* Expiry Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expiry Date *
          {isEditing && <span className="text-sm text-gray-500 ml-2">(can only extend)</span>}
        </label>
        <input
          type="date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {errors.expiryDate && (
          <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
        )}
      </div>

      {/* Max Codes Generated */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Codes Generated
          {isEditing && initialData?.totalGenerated > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              (current: {initialData.totalGenerated})
            </span>
          )}
        </label>
        <input
          type="number"
          name="maxRedemptions"
          value={formData.maxRedemptions}
          onChange={handleChange}
          min={isEditing ? initialData?.totalGenerated || 0 : 0}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="0 = unlimited"
        />
        <p className="text-xs text-gray-500 mt-1">
          Set to 0 for unlimited codes
        </p>
        {errors.maxRedemptions && (
          <p className="text-red-500 text-sm mt-1">{errors.maxRedemptions}</p>
        )}
      </div>

      {/* Visibility Toggles */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isHidden"
            checked={formData.isHidden}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">
            Hidden (not visible to users)
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">
            Active
          </label>
        </div>
      </div>

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
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Campaign' : 'Create Campaign')}
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
