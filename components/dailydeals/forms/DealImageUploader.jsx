'use client';

import { useRef } from 'react';
import { toast } from 'react-toastify';

const MAX_DEAL_IMAGES = 5;

export default function DealImageUploader({
  mode = 'create',
  existingImages = [],
  setExistingImages,
  images = [],
  setImages
}) {
  const fileInputRef = useRef(null);
  const totalImages = existingImages.length + images.length;
  const canAddMore = totalImages < MAX_DEAL_IMAGES;
  const isMaxReached = totalImages >= MAX_DEAL_IMAGES;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const remainingSlots = MAX_DEAL_IMAGES - totalImages;

    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_DEAL_IMAGES} images allowed`, {
        position: 'top-right',
        autoClose: 4000
      });
      e.target.value = '';
      return;
    }

    const validFiles = [];
    let hasInvalidType = false;
    let hasInvalidSize = false;

    files.forEach(file => {
      if (!validTypes.includes(file.type)) {
        hasInvalidType = true;
      } else if (file.size > maxSize) {
        hasInvalidSize = true;
      } else {
        validFiles.push(file);
      }
    });

    if (hasInvalidType) {
      toast.error('Some files skipped: Only JPEG, PNG, and WebP are allowed', {
        position: 'top-right',
        autoClose: 4000
      });
    }

    if (hasInvalidSize) {
      toast.error('Some files skipped: Maximum file size is 5MB', {
        position: 'top-right',
        autoClose: 4000
      });
    }

    // Limit to remaining slots
    const filesToAdd = validFiles.slice(0, remainingSlots);
    if (validFiles.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more image(s) allowed. Some files were not added.`, {
        position: 'top-right',
        autoClose: 4000
      });
    }

    const newImages = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: `new-${Date.now()}-${Math.random()}`
    }));

    setImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  const removeExistingImage = (publicId) => {
    setExistingImages(prev => prev.filter(img => img.publicId !== publicId));
  };

  const removeNewImage = (id) => {
    setImages(prev => {
      const toRemove = prev.find(img => img.id === id);
      if (toRemove?.preview) {
        URL.revokeObjectURL(toRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  return (
    <div>
      {/* Label */}
      <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
        Deal Images
      </label>
      <p className="text-xs sm:text-sm text-slate-500 mb-3">
        JPEG, PNG, WebP · Max 5MB each · {totalImages}/{MAX_DEAL_IMAGES} uploaded
      </p>

      {/* Choose Files Button */}
      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          id="deal-images-upload"
        />
        <label
          htmlFor="deal-images-upload"
          className={`inline-block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isMaxReached
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
          }`}
        >
          Choose Files
        </label>
        {isMaxReached && (
          <p className="text-xs text-amber-600 mt-2">
            Maximum {MAX_DEAL_IMAGES} images reached
          </p>
        )}
      </div>

      {/* Image Previews */}
      {totalImages > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Existing Images */}
          {existingImages.map((img, index) => (
            <div key={img.publicId || index} className="relative group">
              <img
                src={img.url}
                alt={`Existing ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-slate-200"
              />
              <button
                type="button"
                onClick={() => removeExistingImage(img.publicId)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <span className="absolute top-1 left-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">
                Saved
              </span>
            </div>
          ))}

          {/* New Images */}
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              <img
                src={img.preview}
                alt={`New ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-slate-200"
              />
              <button
                type="button"
                onClick={() => removeNewImage(img.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <span className="absolute top-1 left-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded">
                New
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
