'use client';

import React from 'react';
import { toast } from 'react-toastify';

const ImageUploader = ({
  existingImages = [],
  setExistingImages,
  preview = [],
  setPreview,
  formData,
  setFormData,
}) => {
  // Handle new image file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Max 3 images total
    const totalImagesCount =
      existingImages.length + preview.length + files.length;

    if (totalImagesCount > 3) {
      toast.error('You can have up to 3 images total.');
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...newPreviews]);

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  // Remove newly selected image
  const handleRemoveNewImage = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Remove existing image from DB
  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* Existing Images */}
      {existingImages.length > 0 && (
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

      {/* New Image Upload */}
      <div className="mb-4">
        <label className="block font-bold">
          Upload New Images (Max Total 3)
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
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
                  onClick={() => handleRemoveNewImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                  title="Remove this new image"
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
