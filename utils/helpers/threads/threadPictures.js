// Picking and uploading pictures for a thread post (feature 1012).
// Pictures are shrunk on the person's device first (max 2000px on the longest side), so a 5MB
// phone photo goes up as roughly 0.3-0.6MB. The server checks type/size again and stores it.
import axios from '@/utils/axiosConfig';

export const PICTURE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const PICTURE_MAX_BYTES = 10 * 1024 * 1024;
const MAX_SIDE = 2000;

/** Plain-English reason a picked file cannot be used, or null when it is fine. */
export const pictureProblem = (file) => {
  if (!PICTURE_TYPES.includes(file.type)) return `${file.name}: only JPEG, PNG and WebP pictures are allowed.`;
  if (file.size > PICTURE_MAX_BYTES) return `${file.name} is too large. Each picture must be under 10MB.`;
  return null;
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));

/**
 * Shrink a picture before upload. Returns { file, width, height }. Falls back to the original file
 * when the browser cannot decode it (the server still checks it).
 * @param {File} file
 */
export const shrinkPicture = async (file) => {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return { file, width: null, height: null };
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  // Already small: keep the original bytes.
  if (scale === 1 && file.size <= 600 * 1024) {
    bitmap.close?.();
    return { file, width, height };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  // WebP where supported (smaller); JPEG otherwise. Some browsers silently return PNG for webp.
  let blob = await canvasToBlob(canvas, 'image/webp', 0.82);
  if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
  if (!blob || blob.size >= file.size) return { file, width, height };

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const name = `${(file.name || 'picture').replace(/\.[^.]+$/, '')}.${ext}`;
  return { file: new File([blob], name, { type: blob.type }), width, height };
};

/**
 * Shrink and upload one picture. Resolves to { src, width, height, alt: '' } for the editor.
 * @param {File} original
 */
export const uploadThreadPicture = async (original) => {
  const { file, width, height } = await shrinkPicture(original);
  const form = new FormData();
  form.append('images', file);
  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/threads/pictures`, form, {
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return {
    src: res.data.url,
    width: res.data.width || width,
    height: res.data.height || height,
    alt: '',
  };
};
