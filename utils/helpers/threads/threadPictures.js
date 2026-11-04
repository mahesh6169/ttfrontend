// Picking and uploading pictures for a thread post (feature 1012).
// Pictures are shrunk on the person's device first (max 2000px on the longest side), so a 5MB
// phone photo goes up as roughly 0.3-0.6MB. The server checks type/size again and stores it.
import axios from '@/utils/axiosConfig';
import { parsePictures } from '@/utils/helpers/threads/richText';

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
 * Shrink and upload one picture. Resolves to { src, width, height, alt } for the editor; alt is the
 * original file name without its extension (shown under the thumbnail, and read out by screen readers).
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
    alt: String(original?.name || '').replace(/\.[a-z0-9]+$/i, '').slice(0, 200),
  };
};

/**
 * Feature 1012: the writer cancelled (or left) an unsaved post - ask the server to delete the
 * pictures uploaded in this session and the ones in the post. The server only deletes pictures this
 * user uploaded that no saved thread uses, so this is safe for an edited thread too. Best effort:
 * anything missed is caught by the server's 24-hour tidy-up. keepalive lets the request finish while
 * the page navigates away.
 * @param {string[]} sessionUrls pictures uploaded while writing
 * @param {string} html the post HTML
 */
export const discardPostPictures = (sessionUrls = [], html = '') => {
  const urls = [...new Set([...(sessionUrls || []), ...parsePictures(html).map((p) => p.src)])];
  if (!urls.length) return;
  try {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/threads/pictures/discard`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_FRONTEND_API_KEY ? { 'x-api-key': process.env.NEXT_PUBLIC_FRONTEND_API_KEY } : {}),
      },
      body: JSON.stringify({ urls }),
    }).catch(() => {});
  } catch { /* best effort */ }
};
