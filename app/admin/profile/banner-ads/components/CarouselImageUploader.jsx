'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const CarouselImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxCarouselImages = 5, // Maximum carousel images per ad
  className = "",
  disabled = false,
  mode = 'add',
  variant = 'full',
  existingImages = [],
  onExistingImagesChange = null
}) => {
  // Track carousel images separately
  const [carouselImages, setCarouselImages] = useState([]);

  // Initialize carousel images from existing data
  useEffect(() => {
    if (existingImages.length > 0 && carouselImages.length === 0) {
      setCarouselImages(existingImages);
    }
  }, [existingImages]);

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

  const handleFileChange = useCallback((e, carouselIndex = null) => {
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
      id: `new_carousel_${timestamp}`,
      name: file.name,
      size: file.size,
      type: file.type,
      imageType: 'carousel',
      carouselIndex: carouselIndex !== null ? carouselIndex : carouselImages.length
    };
    
    // Add desktop and mobile versions for each carousel image
    const desktopObj = {
      ...imageObj,
      id: `new_desktop_${timestamp}`,
      imageType: 'desktop'
    };
    
    const mobileObj = {
      ...imageObj,
      id: `new_mobile_${timestamp}`,
      imageType: 'mobile',
      file: null // Mobile will be uploaded separately if needed
    };

    let updatedImages;
    if (carouselIndex !== null) {
      // Replace existing carousel image
      updatedImages = [...carouselImages];
      updatedImages[carouselIndex] = { desktop: desktopObj, mobile: mobileObj };
    } else {
      // Add new carousel image
      updatedImages = [...carouselImages, { desktop: desktopObj, mobile: mobileObj }];
    }
    
    setCarouselImages(updatedImages);
    onImagesChange(formatImagesForBackend(updatedImages));
    
    // Reset input
    e.target.value = '';
  }, [carouselImages, onImagesChange, disabled]);

  const handleMobileFileChange = useCallback((e, carouselIndex) => {
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
    const mobileObj = {
      file: file,
      preview: URL.createObjectURL(file),
      isNew: true,
      isExisting: false,
      id: `new_mobile_${timestamp}`,
      name: file.name,
      size: file.size,
      type: file.type,
      imageType: 'mobile'
    };
    
    const updatedImages = [...carouselImages];
    updatedImages[carouselIndex].mobile = mobileObj;
    
    setCarouselImages(updatedImages);
    onImagesChange(formatImagesForBackend(updatedImages));
    
    // Reset input
    e.target.value = '';
  }, [carouselImages, onImagesChange, disabled]);

  const handleRemoveImage = useCallback((carouselIndex) => {
    if (disabled) return;
    
    const imageToRemove = carouselImages[carouselIndex];
    
    // Cleanup URLs
    if (imageToRemove.desktop?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.desktop.preview);
    }
    if (imageToRemove.mobile?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.mobile.preview);
    }
    
    const updatedImages = carouselImages.filter((_, idx) => idx !== carouselIndex);
    setCarouselImages(updatedImages);
    onImagesChange(formatImagesForBackend(updatedImages));
  }, [carouselImages, onImagesChange, disabled]);

  const moveImage = useCallback((fromIndex, toIndex) => {
    if (disabled) return;
    
    const updatedImages = [...carouselImages];
    const [movedItem] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedItem);
    
    setCarouselImages(updatedImages);
    onImagesChange(formatImagesForBackend(updatedImages));
  }, [carouselImages, onImagesChange, disabled]);

  const formatImagesForBackend = (carouselImgs) => {
    // Format images array for backend schema - maintain order!
    return carouselImgs.map((carouselImg, index) => ({
      desktop: carouselImg.desktop,
      mobile: carouselImg.mobile,
      order: index // Explicit order tracking
    }));
  };

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

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block font-bold text-sm mb-2">
            Carousel Images
            <span className="text-sm font-normal text-slate-500 ml-2">
              (Upload 1-{maxCarouselImages} images for carousel)
            </span>
          </label>
          <p className="text-xs text-slate-500">
            Recommended: 2 images. Images will rotate every 5 seconds.
          </p>
        </div>

        {/* Carousel Images */}
        <div className="space-y-4">
          {carouselImages.map((carouselImg, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Image {idx + 1}</h4>
                <div className="flex items-center gap-2">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, idx - 1)}
                      className="p-1 text-slate-600 hover:text-slate-800"
                      title="Move up"
                    >
                      <FaArrowUp />
                    </button>
                  )}
                  {idx < carouselImages.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, idx + 1)}
                      className="p-1 text-slate-600 hover:text-slate-800"
                      title="Move down"
                    >
                      <FaArrowDown />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Remove"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Desktop Image */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Desktop <span className="text-red-500">*</span>
                    <span className="text-xs text-slate-500 ml-2">({dimensions[variant].desktop})</span>
                  </label>
                  
                  {carouselImg.desktop ? (
                    <div className="relative">
                      <img
                        src={getImageSrc(carouselImg.desktop)}
                        alt={`Desktop carousel ${idx + 1}`}
                        className="w-full h-24 object-cover border-2 border-slate-200 rounded"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, idx)}
                        disabled={disabled}
                        className="hidden"
                        id={`desktop-replace-${idx}`}
                      />
                      <label
                        htmlFor={`desktop-replace-${idx}`}
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded"
                      >
                        Replace
                      </label>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, idx)}
                        disabled={disabled}
                        className="hidden"
                        id={`desktop-upload-${idx}`}
                      />
                      <label
                        htmlFor={`desktop-upload-${idx}`}
                        className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm"
                      >
                        Choose Desktop Image
                      </label>
                    </div>
                  )}
                </div>

                {/* Mobile Image */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Mobile <span className="text-slate-400">(Optional)</span>
                    <span className="text-xs text-slate-500 ml-2">({dimensions[variant].mobile})</span>
                  </label>
                  
                  {carouselImg.mobile?.file || carouselImg.mobile?.url ? (
                    <div className="relative">
                      <img
                        src={getImageSrc(carouselImg.mobile)}
                        alt={`Mobile carousel ${idx + 1}`}
                        className="w-full h-24 object-cover border-2 border-slate-200 rounded"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleMobileFileChange(e, idx)}
                        disabled={disabled}
                        className="hidden"
                        id={`mobile-replace-${idx}`}
                      />
                      <label
                        htmlFor={`mobile-replace-${idx}`}
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded"
                      >
                        Replace
                      </label>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleMobileFileChange(e, idx)}
                        disabled={disabled}
                        className="hidden"
                        id={`mobile-upload-${idx}`}
                      />
                      <label
                        htmlFor={`mobile-upload-${idx}`}
                        className="text-slate-600 hover:text-slate-700 cursor-pointer text-sm"
                      >
                        Choose Mobile Image
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add New Image Button */}
          {carouselImages.length < maxCarouselImages && (
            <button
              type="button"
              onClick={() => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = (e) => handleFileChange(e);
                fileInput.click();
              }}
              disabled={disabled}
              className={`w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 ${
                disabled 
                  ? 'border-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'border-blue-300 text-blue-600 hover:border-blue-400 hover:text-blue-700 cursor-pointer'
              }`}
            >
              <FaPlus />
              Add Carousel Image
            </button>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          <p>• Desktop images are required for each carousel slide</p>
          <p>• Mobile images are optional (desktop will be used if not provided)</p>
          <p>• Images will rotate automatically every 5 seconds</p>
          <p>• Drag arrows to reorder images</p>
        </div>
      </div>
    </div>
  );
};

export default CarouselImageUploader;