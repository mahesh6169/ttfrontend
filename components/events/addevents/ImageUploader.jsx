'use client';

import React, { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

// Debug utility function
const debugLog = (context, message, data = null) => {
  const timestamp = new Date().toISOString().substr(11, 12);
  console.log(`🔍 [${timestamp}] [${context}] ${message}`, data || '');
};

// Deep inspection utility
const inspectImageObject = (image, index, context) => {
  const inspection = {
    index,
    id: image?.id,
    name: image?.name,
    isNew: image?.isNew,
    isExisting: image?.isExisting,
    hasFile: image?.file instanceof File,
    fileSize: image?.file?.size,
    fileType: image?.file?.type,
    fileName: image?.file?.name,
    preview: image?.preview?.substring(0, 50) + '...',
    allProperties: Object.keys(image || {}),
  };
  debugLog(context, `Image ${index} inspection:`, inspection);
  return inspection;
};

const ImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 5, 
  className = "",
  disabled = false,
  mode = 'add'
}) => {

   // Debug: Log component render
  debugLog('ImageUploader', `Rendered with ${images.length} images`, {
    mode,
    disabled,
    maxImages,
    imagesWithFiles: images.filter(img => img?.file instanceof File).length
  });

  // Cleanup function for object URLs
  const cleanupPreviews = useCallback((imagesToCleanup) => {
    debugLog('ImageUploader', `Cleaning up ${imagesToCleanup.length} previews`);
    imagesToCleanup.forEach((image, index) => {
      if (image.preview && image.preview.startsWith('blob:')) {
        debugLog('ImageUploader', `Revoking URL for image ${index}: ${image.name}`);
        URL.revokeObjectURL(image.preview);
      }
    });
  }, []);

  // Cleanup on unmount
   useEffect(() => {
    return () => {
      debugLog('ImageUploader', 'Component unmounting, cleaning up previews');
      cleanupPreviews(images);
    };
  }, [images, cleanupPreviews]);

  const handleFileChange = useCallback((e) => {
     debugLog('ImageUploader', '📁 File input changed');
    if (disabled) {
      debugLog('ImageUploader', '❌ File change ignored - component disabled');
      return;
    }
    
    const files = Array.from(e.target.files);
    debugLog('ImageUploader', `📁 Selected ${files.length} files`, files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      isFile: f instanceof File
    })));
    
   if (files.length + images.length > maxImages) {
      debugLog('ImageUploader', `❌ Too many files: ${files.length + images.length} > ${maxImages}`);
      toast.error(`You can upload up to ${maxImages} images only.`);
      e.target.value = '';
      return;
    }
    // Validate file types and sizes
    const validFiles = [];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      debugLog('ImageUploader', `Validating file ${i}: ${file.name}`);
      
      if (!file.type.startsWith('image/')) {
        debugLog('ImageUploader', `❌ Invalid file type: ${file.type}`);
        toast.error(`${file.name} is not a valid image file.`);
        continue;
      }
      
      if (file.size > maxSize) {
        debugLog('ImageUploader', `❌ File too large: ${file.size} > ${maxSize}`);
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }
      
      debugLog('ImageUploader', `✅ File validated: ${file.name}`);
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      debugLog('ImageUploader', '❌ No valid files to process');
      e.target.value = '';
      return;
    }

    debugLog('ImageUploader', `Processing ${validFiles.length} valid files`);

    // Create image objects - CRITICAL: Preserve File objects
    const newImages = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 9);

       debugLog('ImageUploader', `Creating image object for: ${file.name}`);
      
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
       // Debug: Verify File object integrity
      debugLog('ImageUploader', `Image object created:`, {
        id: imageObj.id,
        name: imageObj.name,
        hasFile: imageObj.file instanceof File,
        fileSize: imageObj.file?.size,
        previewLength: imageObj.preview?.length
      });
      
       // Verify File object is valid before adding
      if (imageObj.file instanceof File) {
        newImages.push(imageObj);
        debugLog('ImageUploader', `✅ Added valid image object: ${imageObj.name}`);
      } else {
        debugLog('ImageUploader', `❌ Failed to create valid File object for: ${file.name}`, {
          fileType: typeof imageObj.file,
          fileConstructor: imageObj.file?.constructor?.name
        });
      }
    }

 debugLog('ImageUploader', `Created ${newImages.length} new image objects`);

    // CRITICAL FIX: Combine with existing images properly
    const updatedImages = [...images, ...newImages];
    
      debugLog('ImageUploader', `Combined images: ${images.length} existing + ${newImages.length} new = ${updatedImages.length} total`);

        // Deep inspection of all images before calling parent
    updatedImages.forEach((img, index) => {
      inspectImageObject(img, index, 'ImageUploader-BeforeParentCall');
    });
    
    debugLog('ImageUploader', '📞 Calling onImagesChange with updated images');
    
    // Call the parent handler
    onImagesChange(updatedImages);
    
    // Reset input
    e.target.value = '';
    debugLog('ImageUploader', '✅ File input reset');
  }, [images, maxImages, onImagesChange, disabled]);

  const handleRemoveImage = useCallback((index) => {
    if (disabled) return;
    
    const imageToRemove = images[index];
    
     debugLog('ImageUploader', `🗑️ Removing image at index ${index}:`, {
      name: imageToRemove?.name,
      id: imageToRemove?.id,
      hasFile: imageToRemove?.file instanceof File
    });
    
    // Cleanup object URL if it's a new image
    if (imageToRemove?.preview?.startsWith('blob:')) {
       debugLog('ImageUploader', `Revoking URL for: ${imageToRemove.name}`);
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const updatedImages = images.filter((_, i) => i !== index);

     debugLog('ImageUploader', `After removal: ${updatedImages.length} images remaining`);

      // Deep inspection after removal
    updatedImages.forEach((img, idx) => {
      inspectImageObject(img, idx, 'ImageUploader-AfterRemoval');
    });
    
    console.log('📸 After removal, remaining images:', updatedImages.length);
    console.log('📸 Remaining files:', updatedImages.filter(img => img.file instanceof File).length);
    
    onImagesChange(updatedImages);
  }, [images, onImagesChange, disabled]);

  const getImageSrc = (image) => {
    if (image.preview) return image.preview;
    if (image.url) return image.url;
    if (typeof image === 'string') return image;
    return null;
  };

 // Debug: Log current state in render
  debugLog('ImageUploader', `Current render state:`, {
    totalImages: images.length,
    imagesWithFiles: images.filter(img => img?.file instanceof File).length,
    newImages: images.filter(img => img?.isNew).length,
    existingImages: images.filter(img => img?.isExisting).length
  });

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
                
                {/* Debug info in development */}
                {process.env.NODE_ENV === 'development' && image.isNew && (
                  <div className="absolute top-1 left-1">
                    <div className={`text-xs px-1 rounded ${
                      image.file instanceof File ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {image.file instanceof File ? 'FILE' : 'NO FILE'}
                    </div>
                  </div>
                )}
                
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
            {process.env.NODE_ENV === 'development' && (
              <span className="ml-2">
                | Files: {images.filter(img => img.file instanceof File).length}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;