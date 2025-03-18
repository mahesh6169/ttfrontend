'use client';

import React from 'react';
import { toast } from 'react-toastify';

const ImageUploader = ({ preview, setPreview, formData, setFormData }) => {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + preview.length > 3) {
      toast.error('You can upload up to 3 images only.');
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setPreview((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const handleRemoveImage = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div>
      <label className="block font-bold">Upload Images (Max 3)</label>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="w-full p-2 border rounded"
      />

      <div className="mt-4 flex gap-4">
        {preview.map((src, index) => (
          <div key={index} className="relative">
            <img
              src={src}
              alt={`Preview ${index + 1}`}
              className="w-24 h-24 object-cover border"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUploader;
