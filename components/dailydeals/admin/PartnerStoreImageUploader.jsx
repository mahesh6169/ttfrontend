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
      {isEditMode && existingLogo && !preview && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Logo</label>
          <div className="relative inline-block">
            <img
              src={existingLogo.url}
              alt={existingLogo.originalFilename || 'Partner store logo'}
              className="w-32 h-32 object-contain border rounded bg-white p-2"
              onError={(e) => {
                e.target.src = 'https://res.cloudinary.com/dtvrbdvkx/image/upload/v1744016068/No_Image_Available_mq5h6q.jpg';
              }}
            />
            {existingLogo.originalFilename && (
              <p className="text-xs text-gray-600 mt-1 truncate w-32" title={existingLogo.originalFilename}>
                {existingLogo.originalFilename}
              </p>
            )}
            <button
              type="button"
              onClick={handleRemoveExistingLogo}
              className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600"
              title="Remove current logo"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">New Logo Preview</label>
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Logo preview"
              className="w-32 h-32 object-contain border rounded bg-white p-2"
            />
            {formData.logo?.name && (
              <p className="text-xs text-gray-600 mt-1 truncate w-32" title={formData.logo.name}>
                {formData.logo.name}
              </p>
            )}
            <button
              type="button"
              onClick={handleRemoveNewLogo}
              className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600"
              title="Remove new logo"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {hasLogo ? 'Replace Logo' : 'Upload Logo'}
          <span className="block text-xs font-normal text-gray-500 mt-1">
            PNG • Max 2MB • Recommended: 800×400px
          </span>
        </label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default PartnerStoreImageUploader;
