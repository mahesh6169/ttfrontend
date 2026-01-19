'use client';

import { useRef } from 'react';
import { MdDelete, MdCloudUpload } from 'react-icons/md';
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Deal Images
      </label>

      {/* Upload Button */}
      <div
        onClick={() => canAddMore && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          canAddMore
            ? 'border-gray-300 cursor-pointer hover:border-teal-500 hover:bg-teal-50'
            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
        }`}
      >
        <MdCloudUpload className={`mx-auto text-4xl mb-2 ${canAddMore ? 'text-gray-400' : 'text-gray-300'}`} />
        <p className={canAddMore ? 'text-gray-600' : 'text-gray-400'}>
          {canAddMore ? 'Click to upload images' : 'Maximum images reached'}
        </p>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (max 5MB each)</p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
      />

      {/* Image Previews */}
      {totalImages > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Existing Images */}
          {existingImages.map((img, index) => (
            <div key={img.publicId || index} className="relative group">
              <img
                src={img.url}
                alt={`Existing ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeExistingImage(img.publicId)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MdDelete size={16} />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                Current
              </span>
            </div>
          ))}

          {/* New Images */}
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              <img
                src={img.preview}
                alt={`New ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeNewImage(img.id)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MdDelete size={16} />
              </button>
              <span className="absolute bottom-1 left-1 bg-teal-500 text-white text-xs px-1 rounded">
                New
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        {totalImages}/{MAX_DEAL_IMAGES} images
      </p>
    </div>
  );
}
