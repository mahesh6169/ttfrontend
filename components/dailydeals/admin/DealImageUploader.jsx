'use client';

import { useRef } from 'react';
import { MdDelete, MdCloudUpload } from 'react-icons/md';

export default function DealImageUploader({
  mode = 'create',
  existingImages = [],
  setExistingImages,
  images = [],
  setImages
}) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    const newImages = validFiles.map(file => ({
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

  const totalImages = existingImages.length + images.length;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Deal Images
      </label>

      {/* Upload Button */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors"
      >
        <MdCloudUpload className="mx-auto text-4xl text-gray-400 mb-2" />
        <p className="text-gray-600">Click to upload images</p>
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
        {totalImages} image{totalImages !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
