'use client';

import React, { useRef, useEffect } from 'react';
import { toast } from 'react-toastify';

const ImageUploader = ({
  mode = 'create',  // NEW PROP: 'create' or 'edit'
  existingImages = [],
  setExistingImages = null,
  preview = [],
  setPreview,
  formData,
  setFormData,
  resetTrigger = false,
  maxImages = 5
}) => {
  const fileInputRef = useRef(null);
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const isEditMode = mode === 'edit';  // CHANGED: Now uses the mode prop

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const errors = [];
    const validFiles = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid image type. Only JPEG and PNG are allowed`);
      } else if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds 10MB`);
      } else {
        validFiles.push(file);
      }
    }

    const totalImagesCount =
      existingImages.length + preview.length + validFiles.length;

    if (totalImagesCount > maxImages) {
      errors.push(`Maximum of ${maxImages} images allowed${mode === 'edit' ? ' (including existing images)' : ''}`);
    }

    if (errors.length > 0) {
      toast.error(
        <div className="space-y-1">
          {errors.map((msg, idx) => (
            <p key={idx} className="text-sm text-red-600">{msg}</p>
          ))}
        </div>,
        {
          position: 'top-right',
          autoClose: 6000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      return;
    }

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...validFiles],
    }));

    // Clear the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveExistingImage = (index) => {
    if (setExistingImages) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Reset after successful submit (for add form)
  useEffect(() => {
    if (resetTrigger) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setPreview([]);
      setFormData((prev) => ({ ...prev, images: [] }));
    }
  }, [resetTrigger]);

  return (
    <div>
      {/* Existing Images Section (only for edit mode) */}
      {mode === 'edit' && existingImages.length > 0 && (  // CHANGED: Uses mode prop directly
      <div className="mb-4">
        <label className="block font-bold mb-2">Existing Images</label>
        <div className="flex gap-4 flex-wrap">
          {existingImages.map((imgObj, idx) => (
            <div key={idx} className="relative inline-block">
              <img
                src={imgObj.url}
                alt={`Existing image ${idx + 1}`}
                className="w-24 h-24 object-cover border rounded"
              />
              <button
                type="button"
                onClick={() => handleRemoveExistingImage(idx)}
                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                title="Remove this existing image"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

      {/* Upload Section */}
      <div>
        <label className="block font-bold mb-2">
        Upload {mode === 'edit' && existingImages.length > 0 ? 'New ' : ''}Images
          <span className="block text-xs font-normal text-gray-600">
          (Max {maxImages} {mode === 'edit' && existingImages.length > 0 ? 'total' : ''} — JPEG & PNG format only)
          </span>
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="w-full p-2 border rounded"
        />
        
        {/* New Images Preview */}
        {preview.length > 0 && (
          <div className="mt-4 flex gap-4 flex-wrap">
            {preview.map((src, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-24 h-24 object-cover border rounded"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                  title="Remove this image"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;