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
  variant = 'full', // 'full' or 'half'
  existingImages = [], // For edit mode
  onExistingImagesChange = null // Callback to update existing images in edit mode
}) => {
  console.log('🖼️ BannerImageUploader rendered:', {
    mode,
    imagesCount: images.length,
    existingImagesCount: existingImages.length,
    variant
  });
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

  // Combine new and existing images for display - defined early so callbacks can use it
  const allImages = mode === 'edit' 
    ? [...(existingImages || []).filter(ex => !images.some(img => img.imageType === ex.imageType)), ...images]
    : images;

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

    // Create image object following the events pattern
    const timestamp = Date.now();
    const imageObj = {
      file: file, // CRITICAL: Keep the actual File object
      preview: URL.createObjectURL(file),
      isNew: true,
      isExisting: false,
      id: `new_${imageType}_${timestamp}`,
      name: file.name,
      size: file.size,
      type: file.type,
      imageType: imageType // 'desktop' or 'mobile'
    };
    
    // Verify File object is valid
    if (!(imageObj.file instanceof File)) {
      toast.error('Invalid file upload');
      e.target.value = '';
      return;
    }
    
    // Update images array - replace if exists, add if new
    const updatedImages = images.filter(img => img.imageType !== imageType);
    updatedImages.push(imageObj);
    
    console.log(`✅ Added ${imageType} image:`, imageObj.name);
    onImagesChange(updatedImages);
    
    // Reset input
    e.target.value = '';
  }, [images, onImagesChange, disabled]);

  const handleRemoveImage = useCallback((imageType) => {
    console.log(`🗑️ Attempting to remove ${imageType} image`);
    if (disabled) return;
    
    // Find which image we're removing
    const imageToRemove = allImages.find(img => img.imageType === imageType);
    if (!imageToRemove) return;
    
    if (imageToRemove.isNew) {
      // It's a new image - remove from images array
      console.log('Removing new image');
      
      // Cleanup object URL
      if (imageToRemove.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      
      const updatedImages = images.filter(img => img.imageType !== imageType);
      onImagesChange(updatedImages);
    } else if (imageToRemove.isExisting && mode === 'edit' && onExistingImagesChange) {
      // It's an existing image - notify parent to remove it
      console.log('Removing existing image');
      
      const updatedExistingImages = existingImages.filter(img => img.imageType !== imageType);
      onExistingImagesChange(updatedExistingImages);
    }
  }, [images, existingImages, allImages, onImagesChange, onExistingImagesChange, disabled, mode]);

  const getImageSrc = (image) => {
    // For new images, use blob preview
    if (image.isNew && image.preview) return image.preview;
    // For existing images, use Cloudinary URL
    if (image.isExisting && image.url) return image.url;
    // Fallback
    return image.url || image.preview || null;
  };

  const dimensions = {
    full: { desktop: '1472x100', mobile: '374x100' },
    half: { desktop: '736x100', mobile: '187x100' }
  };
    
  const desktopImage = allImages.find(img => img.imageType === 'desktop');
  const mobileImage = allImages.find(img => img.imageType === 'mobile');

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block font-bold text-sm mb-2">
            Banner Images
            {mode === 'edit' && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Upload new images to replace existing ones)
              </span>
            )}
          </label>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Desktop Image */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Desktop Image <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">
                ({dimensions[variant].desktop})
              </span>
            </label>
            
            {desktopImage ? (
              <div className="relative group">
                <img
                  src={getImageSrc(desktopImage)}
                  alt="Desktop banner"
                  className="w-full h-32 object-cover border-2 border-gray-200 rounded-lg"
                />
                
                {/* Remove Button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('desktop')}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove image"
                  >
                    ×
                  </button>
                )}
                
                {/* Status Badge */}
                {mode === 'edit' && (
                  <div className="absolute bottom-1 left-1">
                    {desktopImage.isExisting && (
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Current
                      </div>
                    )}
                    {desktopImage.isNew && (
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'desktop')}
                  disabled={disabled}
                  className="hidden"
                  id="desktop-upload"
                />
                <label
                  htmlFor="desktop-upload"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    disabled 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  }`}
                >
                  Choose Desktop Image
                </label>
              </div>
            )}
          </div>

          {/* Mobile Image */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Mobile Image <span className="text-gray-400">(Optional)</span>
              <span className="text-xs text-gray-500 ml-2">
                ({dimensions[variant].mobile})
              </span>
            </label>
            
            {mobileImage ? (
              <div className="relative group">
                <img
                  src={getImageSrc(mobileImage)}
                  alt="Mobile banner"
                  className="w-full h-32 object-cover border-2 border-gray-200 rounded-lg"
                />
                
                {/* Remove Button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('mobile')}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove image"
                  >
                    ×
                  </button>
                )}
                
                {/* Status Badge */}
                {mode === 'edit' && (
                  <div className="absolute bottom-1 left-1">
                    {mobileImage.isExisting && (
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Current
                      </div>
                    )}
                    {mobileImage.isNew && (
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'mobile')}
                  disabled={disabled}
                  className="hidden"
                  id="mobile-upload"
                />
                <label
                  htmlFor="mobile-upload"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                    disabled 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white cursor-pointer'
                  }`}
                >
                  Choose Mobile Image
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Leave empty to use desktop image
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Information */}
        {mode === 'edit' && (
          <div className="mt-4 text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              • New images will replace existing ones when you save
            </p>
            <p className="ml-6">• Leave unchanged to keep current images</p>
          </div>
        )}

        {/* Disabled state message */}
        {disabled && (
          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 text-sm">
            Image uploads are disabled in view mode
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;