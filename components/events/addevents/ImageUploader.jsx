'use client';

import React, { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const ImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 3, 
  className = "",
  disabled = false,
  mode = 'add'
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

  // REPLACE the handleFileChange function in ImageUploader.jsx with this enhanced version

const handleFileChange = useCallback((e) => {
  if (disabled) return;
  
  const files = Array.from(e.target.files);
  console.log(`📸 ImageUploader: Selected ${files.length} files:`, files.map(f => f.name));
  
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
    console.log(`📸 Processing file ${i + 1}: ${file.name} (${file.size} bytes)`);
    
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
    console.log('📸 No valid files to upload');
    e.target.value = '';
    return;
  }

  console.log(`📸 Creating ${validFiles.length} new image objects`);

  // 🔧 ENHANCED: Create image objects with detailed verification
  const newImages = [];
  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    
    // 🔧 CRITICAL: Ensure each image object is created independently
    const imageObj = {
      file: file, // Direct file reference
      preview: URL.createObjectURL(file),
      isNew: true,
      isExisting: false, // Explicitly set
      id: `new_${timestamp}_${i}_${randomSuffix}`,
      name: file.name,
      size: file.size,
      type: file.type
    };
    
    // 🔧 VERIFICATION: Ensure file is properly attached
    if (!(imageObj.file instanceof File)) {
      console.error(`📸 ERROR: Image object ${i + 1} does not have a proper File object!`);
      continue;
    }
    
    console.log(`📸 Created image object ${i + 1}:`, {
      id: imageObj.id,
      name: imageObj.name,
      size: imageObj.size,
      isNew: imageObj.isNew,
      isExisting: imageObj.isExisting,
      hasFile: !!imageObj.file,
      fileInstanceCheck: imageObj.file instanceof File,
      hasPreview: !!imageObj.preview
    });
    
    newImages.push(imageObj);
  }

  console.log(`📸 Successfully created ${newImages.length} image objects`);

  // 🔧 VERIFICATION: Double-check all images have files
  const imagesWithFiles = newImages.filter(img => img.file instanceof File);
  if (imagesWithFiles.length !== newImages.length) {
    console.error(`📸 ERROR: ${newImages.length - imagesWithFiles.length} images are missing File objects!`);
  }

  // Combine with existing images
  const updatedImages = [...images, ...newImages];
  console.log(`📸 Total images after addition: ${updatedImages.length} (existing: ${images.length}, new: ${newImages.length})`);

  // 🔧 FINAL VERIFICATION: Log all images being sent to parent
  console.log(`📸 Sending to parent:`, updatedImages.map((img, i) => ({
    index: i,
    id: img.id,
    name: img.name,
    isNew: img.isNew,
    isExisting: img.isExisting,
    hasFile: !!img.file,
    fileInstance: img.file instanceof File
  })));

  // Call the parent handler
  onImagesChange(updatedImages);
  
  // Reset input
  e.target.value = '';
}, [images, maxImages, onImagesChange, disabled]);

  const handleRemoveImage = useCallback((index) => {
    if (disabled) return;
    
    const imageToRemove = images[index];
    console.log(`📸 Removing image at index ${index}:`, imageToRemove?.name || imageToRemove?.id);
    
    // Cleanup object URL if it's a new image
    if (imageToRemove?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
      console.log(`📸 Cleaned up blob URL for: ${imageToRemove.name}`);
    }
    
    const updatedImages = images.filter((_, i) => i !== index);
    console.log(`📸 Images after removal: ${updatedImages.length}`);
    onImagesChange(updatedImages);
  }, [images, onImagesChange, disabled]);

  const getImageSrc = (image) => {
    if (image.preview) return image.preview;
    if (image.url) return image.url;
    if (typeof image === 'string') return image;
    return null;
  };

  // Debug logging for state changes
  useEffect(() => {
    console.log(`📸 ImageUploader state update: ${images.length} total images`);
    images.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.name || 'unnamed'} (${img.isNew ? 'new' : 'existing'}) - File: ${!!img.file} - ID: ${img.id}`);
    });
  }, [images]);

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
                    console.error('Image failed to load:', src);
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

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
            {JSON.stringify(images.map(img => ({
              id: img.id,
              name: img.name,
              isNew: img.isNew,
              isExisting: img.isExisting,
              hasFile: !!img.file,
              hasPreview: !!img.preview,
              hasUrl: !!img.url
            })), null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default ImageUploader;