'use client';

import React, { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const ImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 2, // Desktop and Mobile
  className = "",
  disabled = false,
  mode = 'add',
  variant = 'full' // 'full' or 'half'
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

  const handleFileChange = useCallback((e, imageType) => {
    if (disabled) {
      return;
    }
    
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

    // Create image object
    const imageObj = {
      file: file,
      preview: URL.createObjectURL(file),
      isNew: true,
      id: `${imageType}_${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      imageType: imageType // 'desktop' or 'mobile'
    };
    
    // Update images array - replace if exists, add if new
    const updatedImages = images.filter(img => img.imageType !== imageType);
    updatedImages.push(imageObj);
    
    onImagesChange(updatedImages);
    
    // Reset input
    e.target.value = '';
  }, [images, onImagesChange, disabled]);

  const handleRemoveImage = useCallback((imageType) => {
    if (disabled) return;
    
    const imageToRemove = images.find(img => img.imageType === imageType);
    
    // Cleanup object URL if it's a new image
    if (imageToRemove?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const updatedImages = images.filter(img => img.imageType !== imageType);
    onImagesChange(updatedImages);
  }, [images, onImagesChange, disabled]);

  const getImageSrc = (image) => {
    if (image.preview) return image.preview;
    if (image.url) return image.url;
    return null;
  };

  const dimensions = {
    full: { desktop: '1472x100', mobile: '374x100' },
    half: { desktop: '736x100', mobile: '187x100' }
  };

  const hasDesktopImage = images.some(img => img.imageType === 'desktop');
  const hasMobileImage = images.some(img => img.imageType === 'mobile');
  const desktopImage = images.find(img => img.imageType === 'desktop');
  const mobileImage = images.find(img => img.imageType === 'mobile');

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Desktop Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desktop Image <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">
              (Dimensions: {dimensions[variant].desktop})
            </span>
          </label>
          
          {!hasDesktopImage ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'desktop')}
                disabled={disabled}
                className="w-full"
              />
            </div>
          ) : (
            <div className="relative">
              <img
                src={getImageSrc(desktopImage)}
                alt="Desktop banner"
                className="w-full h-32 object-cover border border-gray-200 rounded-lg"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage('desktop')}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Image <span className="text-gray-400">(Optional)</span>
            <span className="text-xs text-gray-500 ml-2">
              (Dimensions: {dimensions[variant].mobile})
            </span>
          </label>
          
          {!hasMobileImage ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'mobile')}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                Leave empty to use desktop image for mobile
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={getImageSrc(mobileImage)}
                alt="Mobile banner"
                className="w-full h-24 object-cover border border-gray-200 rounded-lg"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage('mobile')}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Information */}
      {mode === 'edit' && (
        <div className="mt-4 text-sm text-gray-500">
          <p>• New images will replace existing ones</p>
          <p>• Leave unchanged to keep current images</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;