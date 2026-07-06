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
  maxImages = 10
}) => {
  const fileInputRef = useRef(null);
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const isEditMode = mode === 'edit';  // CHANGED: Now uses the mode prop

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const errors = [];
    const validFiles = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid image type. Only JPEG, PNG & WebP are allowed`);
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

  // Fixed handleRemoveExistingImage function
  const handleRemoveExistingImage = (index) => {
    // Find the original index in the full array
    const filteredImages = existingImages
      .map((imgObj, i) => ({ ...imgObj, _origIndex: i }))
      .filter(imgObj => imgObj && typeof imgObj === 'object' && imgObj.url && typeof imgObj.url === 'string');
    const origIndex = filteredImages[index]?._origIndex;
    if (setExistingImages && origIndex !== undefined) {
      setExistingImages((prev) => prev.filter((_, i) => i !== origIndex));
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

  const totalImages = existingImages.length + preview.length;
  const isMaxReached = totalImages >= maxImages;

  return (
    <div>
      {/* Header */}
      <span className="block font-medium text-slate-600 text-sm sm:text-base">
        Upload Images
      </span>
      <p className="text-xs text-slate-500 mt-1 mb-3">
        JPEG, PNG & WebP · Max {maxImages} · Up to 10MB each · {totalImages}/{maxImages} uploaded
      </p>

      {/* Choose Files Button */}
      <div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          disabled={isMaxReached}
          className="hidden"
          id="image-upload-input"
        />
        <label
          htmlFor="image-upload-input"
          className={`inline-block px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            isMaxReached
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
          }`}
        >
          Choose Files
        </label>
        {isMaxReached && (
          <p className="text-xs text-amber-600 mt-2">
            Maximum reached. Remove images to add new ones.
          </p>
        )}
      </div>

      {/* Uploaded Images */}
      {totalImages > 0 && (
        <div className="mt-3 flex gap-3 flex-wrap">
            {/* Existing Images (edit mode) */}
            {mode === 'edit' && existingImages
              .map((imgObj, i) => ({ ...imgObj, _origIndex: i }))
              .filter(imgObj => imgObj && typeof imgObj === 'object' && imgObj.url && typeof imgObj.url === 'string')
              .map((imgObj, idx) => (
                <div key={imgObj.url || idx} className="relative">
                  <img
                    src={imgObj.url}
                    alt={imgObj.originalFilename || `Image ${idx + 1}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://res.cloudinary.com/dtvrbdvkx/image/upload/v1744016068/No_Image_Available_mq5h6q.jpg';
                    }}
                  />
                  <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                    Saved
                  </span>
                  {imgObj.originalFilename && (
                    <p className="text-[10px] text-slate-500 mt-1 truncate w-20 sm:w-24" title={imgObj.originalFilename}>
                      {imgObj.originalFilename}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}

            {/* New Images (preview) */}
            {preview.map((src, index) => (
              <div key={index} className="relative">
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                />
                {mode === 'edit' && (
                  <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                    New
                  </span>
                )}
                {formData.images[index]?.name && (
                  <p className="text-[10px] text-slate-500 mt-1 truncate w-20 sm:w-24" title={formData.images[index].name}>
                    {formData.images[index].name}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;