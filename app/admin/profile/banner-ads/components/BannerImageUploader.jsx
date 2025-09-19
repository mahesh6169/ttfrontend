'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash } from 'react-icons/fa';

const BannerImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 5, // Maximum images for carousel
  className = "",
  disabled = false,
  mode = 'add',
  variant = 'full',
  existingImages = [],
  onExistingImagesChange = null
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

  const handleFileChange = useCallback((e, imageType, index = null) => {
    if (disabled) return;
    
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not a valid image file.`);
      e.target.value = '';
      return;
    }
    
    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`${file.name} is too large. Maximum size is 5MB.`);
      e.target.value = '';
      return;
    }

    const timestamp = Date.now();
    const imageObj = {
      file: file,
      preview: URL.createObjectURL(file),
      isNew: true,
      isExisting: false,
      id: `new_${imageType}_${timestamp}`,
      name: file.name,
      size: file.size,
      type: file.type,
      imageType: imageType,
      index: index !== null ? index : images.filter(img => img.imageType === imageType).length
    };
    
    let updatedImages = [...images];
    
    if (index !== null) {
      // Replace existing image at index
      const existingIndex = images.findIndex(img => 
        img.imageType === imageType && img.index === index
      );
      if (existingIndex !== -1) {
        // Cleanup old preview
        if (images[existingIndex].preview?.startsWith('blob:')) {
          URL.revokeObjectURL(images[existingIndex].preview);
        }
        updatedImages[existingIndex] = imageObj;
      } else {
        updatedImages.push(imageObj);
      }
    } else {
      // Add new image
      updatedImages.push(imageObj);
    }
    
    onImagesChange(updatedImages);
    
    // Reset input
    e.target.value = '';
  }, [images, onImagesChange, disabled]);

  const handleRemoveImage = useCallback((imageType, index) => {
    if (disabled) return;
    
    // Check if it's a new image or existing image
    const newImageToRemove = images.find(img => 
      img.imageType === imageType && img.index === index
    );
    
    const existingImageToRemove = existingImages.find(img => 
      img.imageType === imageType && img.index === index
    );
    
    if (newImageToRemove) {
      // Cleanup URL for new images
      if (newImageToRemove.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(newImageToRemove.preview);
      }
      
      // Remove image and reindex remaining images
      const updatedImages = images
        .filter(img => !(img.imageType === imageType && img.index === index))
        .map(img => {
          if (img.imageType === imageType && img.index > index) {
            return { ...img, index: img.index - 1 };
          }
          return img;
        });
      
      onImagesChange(updatedImages);
    } else if (existingImageToRemove && onExistingImagesChange) {
      // Remove existing image
      const updatedExistingImages = existingImages
        .filter(img => !(img.imageType === imageType && img.index === index))
        .map(img => {
          if (img.imageType === imageType && img.index > index) {
            return { ...img, index: img.index - 1 };
          }
          return img;
        });
      
      onExistingImagesChange(updatedExistingImages);
    }
  }, [images, existingImages, onImagesChange, onExistingImagesChange, disabled]);

  const getImageSrc = (image) => {
    if (!image) return null;
    if (image.isNew && image.preview) return image.preview;
    if (image.isExisting && image.url) return image.url;
    return image.url || image.preview || null;
  };

  const dimensions = {
    full: { desktop: '728×90', mobile: '320×50' },
    half: { desktop: '364×90', mobile: '160×50' }
  };

  // Get images by type - combine new and existing images in edit mode
  const getImagesByType = (type) => {
    const newImgs = images.filter(img => img.imageType === type);
    const existingImgs = mode === 'edit' ? existingImages.filter(img => img.imageType === type) : [];
    
    // Combine and sort by index
    return [...existingImgs, ...newImgs].sort((a, b) => a.index - b.index);
  };
  
  const desktopImages = getImagesByType('desktop');
  const mobileImages = getImagesByType('mobile');

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Image Containers - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Desktop Images Container */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <label className="block font-bold text-sm">
                Desktop Images <span className="text-red-500">*</span>
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({dimensions[variant].desktop})
                </span>
              </label>
              <p className="text-xs text-gray-500">
                Upload 1-{maxImages} desktop images. They will rotate every 5 seconds.
              </p>
            </div>

            {/* Desktop Image Grid */}
            <div className="grid grid-cols-3 gap-3">
              {desktopImages.map((image, idx) => (
                <div key={image.id} className="relative group">
                  <img
                    src={getImageSrc(image)}
                    alt={`Desktop ${idx + 1}`}
                    className="w-full h-20 object-cover border-2 border-gray-200 rounded"
                  />
                  {/* Cross button to remove */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('desktop', idx)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                  >
                    ×
                  </button>
                  {/* Badge for current/new in edit mode */}
                  {mode === 'edit' && (
                    <div className="absolute bottom-1 left-1">
                      {image.isExisting ? (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded">Current</span>
                      ) : (
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">New</span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Desktop Image Button */}
              {desktopImages.length < maxImages && (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleFileChange(e, 'desktop');
                    input.click();
                  }}
                  disabled={disabled}
                  className="border-2 border-dashed border-gray-300 rounded h-20 flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <FaPlus className="text-xl" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Images Container */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <label className="block font-bold text-sm">
                Mobile Images <span className="text-red-500">*</span>
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({dimensions[variant].mobile})
                </span>
              </label>
              <p className="text-xs text-gray-500">
                Upload 1-{maxImages} mobile images. They will rotate every 5 seconds.
              </p>
            </div>

            {/* Mobile Image Grid */}
            <div className="grid grid-cols-3 gap-3">
              {mobileImages.map((image, idx) => (
                <div key={image.id} className="relative group">
                  <img
                    src={getImageSrc(image)}
                    alt={`Mobile ${idx + 1}`}
                    className="w-full h-20 object-cover border-2 border-gray-200 rounded"
                  />
                  {/* Cross button to remove */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('mobile', idx)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                  >
                    ×
                  </button>
                  {/* Badge for current/new in edit mode */}
                  {mode === 'edit' && (
                    <div className="absolute bottom-1 left-1">
                      {image.isExisting ? (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded">Current</span>
                      ) : (
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">New</span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Mobile Image Button */}
              {mobileImages.length < maxImages && (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleFileChange(e, 'mobile');
                    input.click();
                  }}
                  disabled={disabled}
                  className="border-2 border-dashed border-gray-300 rounded h-20 flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <FaPlus className="text-xl" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerImageUploader;