'use client';

import React, { useRef, useEffect } from 'react';
import { toast } from 'react-toastify';

const ImageUploader = ({ preview, setPreview, formData, setFormData, resetTrigger }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles = [];
    const errors = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`Invalid Image type`);
      } else if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds 10MB`);
      } else {
        validFiles.push(file);
      }
    }

    const totalFiles = preview.length + validFiles.length;
    if (totalFiles > 5) {
      errors.push(`maximum of 5 files allowed`);
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

    // ✅ Clear the file input value to reset file name display
    fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // ✅ Reset after successful submit
  useEffect(() => {
    if (resetTrigger) {
      fileInputRef.current.value = '';
      setPreview([]);
      setFormData((prev) => ({ ...prev, images: [] }));
    }
  }, [resetTrigger]);

  return (
    <div>
      <label className="block font-bold">
        Upload Images
        <span className="block text-xs font-normal text-gray-600">
          (Max 5) — JPEG & PNG format only
        </span>
      </label>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef} // ✅ attach ref
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
