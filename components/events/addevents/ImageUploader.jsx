'use client';

import React, { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const ImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 3, 
  className = "" 
}) => {
  // Cleanup function for object URLs
  const cleanupPreviews = useCallback((imagesToCleanup) => {
    imagesToCleanup.forEach(image => {
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
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > maxImages) {
      toast.error(`You can upload up to ${maxImages} images only.`);
      return;
    }

    // Validate file types and sizes
    const validFiles = [];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
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

    if (validFiles.length === 0) return;

    // Create new image objects with previews
    // Create new image objects with previews
const newImages = validFiles.map(file => ({
  file,
  preview: URL.createObjectURL(file),
  isNew: true,
  id: `new_${Date.now()}_${Math.random()}`,
  name: file.name,
  size: file.size,
  type: file.type
}));

// Don't store files directly in Redux, handle them separately
onImagesChange([...images, ...newImages]);
    
    // Reset input
    e.target.value = '';
  }, [images, maxImages, onImagesChange]);

  const handleRemoveImage = useCallback((index) => {
    const imageToRemove = images[index];
    
    // Cleanup object URL if it's a new image
    if (imageToRemove?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

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
      </label>

      {images.length < maxImages && (
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      )}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => {
            const src = getImageSrc(image);
            
            return (
              <div key={image.id || index} className="relative group">
                <img
                  src={src}
                  alt={`Image ${index + 1}`}
                  className="w-full h-24 object-cover border border-gray-200 rounded-lg"
                  onError={(e) => {
                    console.error('Image failed to load:', src);
                    e.target.style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove image"
                >
                  ×
                </button>
                {image.isExisting && (
                  <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                    Existing
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-sm text-gray-500 mt-2">
        {images.length}/{maxImages} images uploaded
      </p>
    </div>
  );
};

export default ImageUploader;