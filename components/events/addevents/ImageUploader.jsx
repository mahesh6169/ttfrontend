'use client';

import React, { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const ImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 5, 
  className = "",
  disabled = false,
  mode = 'add'
}) => {

  // Cleanup function for object URLs
  const cleanupPreviews = useCallback((imagesToCleanup) => {
    imagesToCleanup.forEach((image) => {
      if (image.preview && image.preview.startsWith('blob:')) {
        URL.revokeObjectURL(image.preview);
      }
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPreviews(images);
    };
  }, [images, cleanupPreviews]);

  const handleFileChange = useCallback((e) => {
    if (disabled) {
      return;
    }
    
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > maxImages) {
      toast.error(`You can upload up to ${maxImages} images only.`);
      e.target.value = '';
      return;
    }

    // Validate file types and sizes
    const validFiles = [];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file.`);
        continue;
      }
      
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    // Create image objects - CRITICAL: Preserve File objects
    const newImages = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 9);
      
      const imageObj = {
        file: file, // ✅ CRITICAL: Keep the actual File object
        preview: URL.createObjectURL(file),
        isNew: true,
        isExisting: false,
        id: `new_${timestamp}_${i}_${randomSuffix}`,
        name: file.name,
        size: file.size,
        type: file.type
      };
      
      // Verify File object is valid before adding
      if (imageObj.file instanceof File) {
        newImages.push(imageObj);
      }
    }

    // Combine with existing images properly
    const updatedImages = [...images, ...newImages];
    
    // Call the parent handler
    onImagesChange(updatedImages);
    
    // Reset input
    e.target.value = '';
  }, [images, maxImages, onImagesChange, disabled]);

  const handleRemoveImage = useCallback((index) => {
    if (disabled) return;
    
    const imageToRemove = images[index];
    
    // Cleanup object URL if it's a new image
    if (imageToRemove?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const updatedImages = images.filter((_, i) => i !== index);
    
    onImagesChange(updatedImages);
  }, [images, onImagesChange, disabled]);

  const getImageSrc = (image) => {
    if (image.preview) return image.preview;
    if (image.url) return image.url;
    if (typeof image === 'string') return image;
    return null;
  };

  return (
    <div className={className}>
      <label className="block font-bold mb-2">
        Upload Images (Max {maxImages})
        {mode === 'edit' && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Changes will update how your event appears)
          </span>
        )}
        {mode === 'view' && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            (View only)
          </span>
        )}
      </label>

      {/* File Input */}
      {images.length < maxImages && !disabled && (
        <div className="mb-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can select multiple images at once (max {maxImages - images.length} more)
          </p>
        </div>
      )}

      {/* Disabled state message */}
      {disabled && images.length < maxImages && (
        <div className="mb-4 p-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
          Image uploads are disabled in view mode
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => {
            const src = getImageSrc(image);
            
            return (
              <div key={image.id || index} className="relative group">
                <img
                  src={src}
                  alt={image.name || `Image ${index + 1}`}
                  className="w-full h-24 object-cover border border-gray-200 rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                
                {/* Remove Button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove image"
                  >
                    ×
                  </button>
                )}
                
                {/* Status Badges */}
                <div className="absolute bottom-1 left-1 flex gap-1">
                  {image.isExisting && (
                    <div className="bg-blue-500 text-white text-xs px-1 rounded">
                      Existing
                    </div>
                  )}
                  {image.isNew && (
                    <div className="bg-green-500 text-white text-xs px-1 rounded">
                      New
                    </div>
                  )}
                </div>
                
                {/* Image info on hover */}
                {!disabled && (
                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black bg-opacity-75 text-white text-xs px-1 rounded max-w-20 truncate">
                      {image.name || 'Image'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Status Information */}
      <div className="flex justify-between items-center mt-2">
        <p className="text-sm text-gray-500">
          {images.length}/{maxImages} images uploaded
        </p>
        
        {images.length > 0 && (
          <p className="text-xs text-gray-400">
            New: {images.filter(img => img.isNew).length} | 
            Existing: {images.filter(img => img.isExisting).length}
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;