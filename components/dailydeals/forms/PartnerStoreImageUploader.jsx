'use client';

import React, { useRef } from 'react';
import { toast } from 'react-toastify';

const PartnerStoreImageUploader = ({
  mode = 'create',
  existingLogo = null,
  setExistingLogo = null,
  preview = null,
  setPreview,
  formData,
  setFormData
}) => {
  const fileInputRef = useRef(null);
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 2 * 1024 * 1024; // 2MB
  const isEditMode = mode === 'edit';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid image type. Only JPEG, PNG, and WebP are allowed', {
        position: 'top-right',
        autoClose: 4000
      });
      return;
    }

    if (file.size > maxSize) {
      toast.error('File size exceeds 2MB', {
        position: 'top-right',
        autoClose: 4000
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    setFormData((prev) => ({
      ...prev,
      logo: file,
      keepExistingLogo: false
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveNewLogo = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFormData((prev) => ({
      ...prev,
      logo: null,
      keepExistingLogo: false
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingLogo = () => {
    if (setExistingLogo) {
      setExistingLogo(null);
    }
    setFormData((prev) => ({
      ...prev,
      keepExistingLogo: false
    }));
  };

  const hasLogo = (isEditMode && existingLogo) || preview;

  return (
    <div>
      {/* Label */}
      <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
        {hasLogo ? 'Replace Logo' : 'Upload Logo'}
        <span className="text-xs font-normal text-slate-500 ml-1">(optional)</span>
      </label>
      <p className="text-xs sm:text-sm text-slate-500 mb-3">
        PNG, JPEG, WebP · Max 2MB · Recommended: 800×400px
      </p>

      {/* Existing Logo (Edit Mode) */}
      {isEditMode && existingLogo && !preview && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2">Current Logo</p>
          <div className="relative inline-block">
            <img
              src={existingLogo.url}
              alt={existingLogo.originalFilename || 'Partner store logo'}
              className="w-32 h-32 object-contain border border-slate-200 rounded-lg bg-white p-2"
              onError={(e) => {
                e.target.src = 'https://res.cloudinary.com/dtvrbdvkx/image/upload/v1744016068/No_Image_Available_mq5h6q.jpg';
              }}
            />
            <span className="absolute top-1 left-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">
              Saved
            </span>
            <button
              type="button"
              onClick={handleRemoveExistingLogo}
              className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
              title="Remove current logo"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* New Logo Preview */}
      {preview && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2">New Logo</p>
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Logo preview"
              className="w-32 h-32 object-contain border border-slate-200 rounded-lg bg-white p-2"
            />
            <span className="absolute top-1 left-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded">
              New
            </span>
            <button
              type="button"
              onClick={handleRemoveNewLogo}
              className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
              title="Remove new logo"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Choose Files Button */}
      <div>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          id="logo-upload"
        />
        <label
          htmlFor="logo-upload"
          className="inline-block px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
        >
          Choose File
        </label>
      </div>
    </div>
  );
};

export default PartnerStoreImageUploader;
