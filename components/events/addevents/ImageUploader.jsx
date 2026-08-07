'use client';

import React, { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiX } from 'react-icons/fi';

const ImageUploader = ({
  images = [],
  onImagesChange,
  maxImages = 10,
  className = "",
  disabled = false,
  mode = 'add',
  label = 'Upload Images',
  showLabel = true
}) => {
  console.log('🖼️ ImageUploader rendered with:', {
    imagesCount: images.length,
    maxImages,
    disabled,
    mode,
    images: images
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: only JPEG, PNG & WebP are allowed.`);
        continue;
      }
      
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
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
    console.log('🖼️ Calling onImagesChange with', updatedImages.length, 'images');
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
    // For new images, prioritize preview (blob URL) if valid
    if (image.preview && image.preview.startsWith('blob:')) {
      return image.preview;
    }
    // Fallback to server URL for existing images
    if (image.url) return image.url;
    // Handle string type images
    if (typeof image === 'string') return image;
    // If we have a preview but it's not a blob URL, try to use it
    if (image.preview) return image.preview;
    return null;
  };
  
  // Check if blob URL needs regeneration
  const needsBlobRegeneration = useCallback((image) => {
    return image.isNew && (!image.preview || !image.preview.startsWith('blob:'));
  }, []);

  // Remove the automatic blob regeneration on mount as it causes issues
  // The parent component (StepManager) handles blob URL regeneration

  const isMaxReached = images.length >= maxImages;

  return (
    <div className={className}>
      {/* Header */}
      {showLabel && (
        <>
          <span className="block font-medium text-slate-600 text-sm">
            {label}
          </span>
          <p className="text-xs text-slate-500 mt-1 mb-3">
            JPEG, PNG & WebP · Max {maxImages} · Up to 10MB each · {images.length}/{maxImages} uploaded
          </p>
        </>
      )}
      {!showLabel && (
        <p className="text-xs text-slate-500 mb-2">
          JPEG, PNG & WebP · Max {maxImages} · Up to 10MB each · {images.length}/{maxImages} uploaded
        </p>
      )}

      {/* Choose Files Button */}
      {!disabled && (
        <div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            disabled={isMaxReached}
            className="hidden"
            id={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <label
            htmlFor={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
            className={`inline-block px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              isMaxReached
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
            }`}
          >
            Choose Files
          </label>
          {isMaxReached && (
            <p className="text-xs text-slate-500 mt-2">
              Maximum reached. Remove images to add new ones.
            </p>
          )}
        </div>
      )}

      {/* Disabled state message */}
      {disabled && (
        <div className="p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 text-sm">
          Image uploads are disabled in view mode
        </div>
      )}

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="mt-3 flex gap-3 flex-wrap">
          {images.map((image, index) => {
            const src = getImageSrc(image);

            return (
              <div key={image.id || index} className="relative">
                {src ? (
                  <img
                    src={src}
                    alt={image.name || `Image ${index + 1}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                    onError={(e) => {
                      console.log('🖼️ Image load error for:', image.name || image.id, 'src:', e.target.src);

                      if (image.isNew && e.target.src.startsWith('blob:')) {
                        console.log('🖼️ Blob URL invalid for new image:', image.id);
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentNode.querySelector('.image-placeholder');
                        if (placeholder) placeholder.style.display = 'flex';
                      } else if (image.preview && e.target.src === image.preview && image.url) {
                        e.target.src = image.url;
                      } else {
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentNode.querySelector('.image-placeholder');
                        if (placeholder) placeholder.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}

                {/* Placeholder for failed images */}
                <div
                  className="image-placeholder w-20 h-20 sm:w-24 sm:h-24 border border-slate-200 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs"
                  style={{ display: src ? 'none' : 'flex' }}
                >
                  <div className="text-center p-1">
                    <svg className="w-5 h-5 mx-auto mb-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                
                {/* Status Badge */}
                {image.isExisting && (
                  <span className="absolute top-1 left-1 bg-slate-600 text-white text-xs px-1.5 py-0.5 rounded">
                    Saved
                  </span>
                )}
                {image.isNew && mode === 'edit' && (
                  <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                    New
                  </span>
                )}

                {/* Filename */}
                {image.name && (
                  <p className="text-xs text-slate-500 mt-1 truncate w-20 sm:w-24" title={image.name}>
                    {image.name}
                  </p>
                )}

                {/* Remove Button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 text-slate-500 rounded-full hover:text-slate-700 flex items-center justify-center"
                    title="Remove"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default ImageUploader;