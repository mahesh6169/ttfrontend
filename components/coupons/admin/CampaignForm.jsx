'use client';

import { useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const DAYS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' }
];

const MAX_HOURS = 2;

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
    validDays: initialData?.validDays || [],
    validHours: initialData?.validHours?.map(w => ({ start: w.start || '', end: w.end || '' })) || [],
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

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      validDays: prev.validDays.includes(day)
        ? prev.validDays.filter(d => d !== day)
        : [...prev.validDays, day]
    }));
  };

  const handleHourChange = (index, key, value) => {
    setFormData(prev => {
      const validHours = [...prev.validHours];
      validHours[index] = { ...validHours[index], [key]: value };
      return { ...prev, validHours };
    });
  };

  const addHourWindow = () => {
    setFormData(prev => prev.validHours.length >= MAX_HOURS
      ? prev
      : { ...prev, validHours: [...prev.validHours, { start: '', end: '' }] });
  };

  const removeHourWindow = (index) => {
    setFormData(prev => ({
      ...prev,
      validHours: prev.validHours.filter((_, i) => i !== index)
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

    // Valid hours: each window needs both a start and end (or remove it)
    const incompleteHours = formData.validHours.some(
      w => (w.start && !w.end) || (!w.start && w.end)
    );
    if (incompleteHours) {
      newErrors.validHours = 'Complete or remove the time window (both start and end)';
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
      // Drop any fully-empty window rows before saving.
      const cleanHours = formData.validHours.filter(w => w.start && w.end);
      await onSubmit({ ...formData, validHours: cleanHours });
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
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          name="campaignName"
          value={formData.campaignName}
          onChange={handleChange}
          maxLength={100}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g., Summer Special, Grand Opening"
        />
        {errors.campaignName && (
          <p className="text-red-500 text-sm mt-1">{errors.campaignName}</p>
        )}
      </div>

      {/* Discount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Discount *
        </label>
        <input
          type="text"
          name="discount"
          value={formData.discount}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g., 20% off, $10 off"
        />
        {errors.discount && (
          <p className="text-red-500 text-sm mt-1">{errors.discount}</p>
        )}
      </div>

      {/* Discount Product */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Discount Product *
        </label>
        <input
          type="text"
          name="discountProduct"
          value={formData.discountProduct}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g., all items, dinner menu"
        />
        {errors.discountProduct && (
          <p className="text-red-500 text-sm mt-1">{errors.discountProduct}</p>
        )}
      </div>

      {/* Terms & Conditions */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Terms & Conditions
        </label>
        <textarea
          name="termsConditions"
          value={formData.termsConditions}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter any terms and conditions (optional)"
        />
      </div>

      {/* Expiry Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Expiry Date *
          {isEditing && <span className="text-sm text-slate-500 ml-2">(can only extend)</span>}
        </label>
        <input
          type="date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {errors.expiryDate && (
          <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
        )}
      </div>

      {/* Valid Days */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Valid Days <span className="text-xs font-normal text-slate-500">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">Leave all off to allow every day. A code won't redeem on a day that's off.</p>
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

      {/* Valid Hours */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Valid Hours <span className="text-xs font-normal text-slate-500">(optional, max {MAX_HOURS})</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Shown to customers only (e.g. happy hour) — not enforced. Same hours apply to every valid day.
        </p>

        {formData.validHours.map((window, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="time"
              value={window.start}
              onChange={(e) => handleHourChange(index, 'start', e.target.value)}
              className="p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="time"
              value={window.end}
              onChange={(e) => handleHourChange(index, 'end', e.target.value)}
              className="p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={() => removeHourWindow(index)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
              aria-label="Remove time window"
            >
              <FaTimes />
            </button>
          </div>
        ))}

        {formData.validHours.length < MAX_HOURS && (
          <button
            type="button"
            onClick={addHourWindow}
            className="flex items-center gap-2 text-sm text-teal-700 hover:text-teal-800 font-medium mt-1"
          >
            <FaPlus className="text-xs" />
            Add time window
          </button>
        )}

        {errors.validHours && (
          <p className="text-red-500 text-sm mt-1">{errors.validHours}</p>
        )}
      </div>

      {/* Max Codes Generated */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Max Codes Generated
          {isEditing && initialData?.totalGenerated > 0 && (
            <span className="text-sm text-slate-500 ml-2">
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
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="0 = unlimited"
        />
        <p className="text-xs text-slate-500 mt-1">
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
          <label className="text-sm text-slate-700">
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
          <label className="text-sm text-slate-700">
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
          className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Campaign' : 'Create Campaign')}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
