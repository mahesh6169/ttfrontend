'use client';
// Full-screen picture viewer for thread posts (feature 1012).
// Opens on any picture and moves through every picture in the post.
// Desktop: arrows / arrow keys, + / - buttons, mouse wheel and double-click to zoom, drag to pan,
//          X or Esc to close.
// Phone:   swipe left/right, pinch or double-tap to zoom, drag to pan, swipe down or the phone's
//          back button to close.
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import { sizedPictureUrl } from '@/utils/helpers/threads/richText';

const MIN = 1;
const MAX = 4;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function PictureViewer({ pictures, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef(0);
  const closedByBack = useRef(false);
  const count = pictures.length;

  const resetZoom = () => { setScale(1); setOffset({ x: 0, y: 0 }); };
  const go = useCallback((d) => {
    setIndex((i) => (i + d + count) % count);
    resetZoom();
  }, [count]);
  const zoomTo = (s) => {
    const next = clamp(s, MIN, MAX);
    setScale(next);
    if (next === 1) setOffset({ x: 0, y: 0 });
  };

  // The parent may pass a new onClose every render; keep the latest without re-running effects.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Phone back button closes the viewer: add a history entry while open (keeping Next's own state).
  const close = useCallback(() => {
    if (!closedByBack.current && window.history.state?.desifyViewer) window.history.back();
    onCloseRef.current();
  }, []);

  useEffect(() => {
    window.history.pushState({ ...(window.history.state || {}), desifyViewer: true }, '');
    const onPop = () => { closedByBack.current = true; onCloseRef.current(); };
    window.addEventListener('popstate', onPop);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('popstate', onPop);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === '+' || e.key === '=') zoomTo(scale + 0.5);
      else if (e.key === '-') zoomTo(scale - 0.5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, go, scale]);

  const onWheel = (e) => zoomTo(scale + (e.deltaY < 0 ? 0.25 : -0.25));

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      gesture.current = { type: 'pinch', dist, scale };
    } else if (pts.length === 1) {
      gesture.current = { type: 'drag', x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, moved: false };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === 'pinch' && pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      zoomTo((g.scale * dist) / g.dist);
    } else if (g.type === 'drag') {
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) g.moved = true;
      if (scale > 1) setOffset({ x: g.ox + dx, y: g.oy + dy });
    }
  };

  const onPointerUp = (e) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return; // still pinching
    gesture.current = null;
    if (!g || g.type !== 'drag') return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (scale === 1 && g.moved) {
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) close();
      return;
    }
    if (!g.moved && e.pointerType !== 'mouse') {
      // Double-tap to zoom on touch screens.
      const now = Date.now();
      if (now - lastTap.current < 300) { zoomTo(scale > 1 ? 1 : 2.5); lastTap.current = 0; }
      else lastTap.current = now;
    }
  };

  const pic = pictures[index];
  const btn = 'flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Picture viewer"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95"
      data-testid="picture-viewer"
    >
      <div className="absolute left-4 top-4 text-sm font-semibold text-slate-100" aria-live="polite">
        {index + 1} of {count}
      </div>
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button type="button" aria-label="Zoom out" onClick={() => zoomTo(scale - 0.5)} className={`${btn} hidden sm:flex`}><FaMinus aria-hidden="true" /></button>
        <button type="button" aria-label="Zoom in" onClick={() => zoomTo(scale + 0.5)} className={`${btn} hidden sm:flex`}><FaPlus aria-hidden="true" /></button>
        <button type="button" aria-label="Close" onClick={close} className={btn}><FaTimes aria-hidden="true" /></button>
      </div>

      <div
        className="flex h-full w-full touch-none select-none items-center justify-center overflow-hidden"
        onWheel={onWheel}
        onDoubleClick={() => zoomTo(scale > 1 ? 1 : 2.5)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          key={pic.src}
          src={sizedPictureUrl(pic.src, 2000)}
          alt={pic.alt || `Picture ${index + 1} of ${count}`}
          draggable={false}
          className="max-h-[90vh] max-w-[96vw] object-contain"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            cursor: scale > 1 ? 'grab' : 'zoom-in',
            transition: gesture.current ? 'none' : 'transform 120ms ease-out',
          }}
        />
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label="Previous picture" onClick={() => go(-1)} className={`${btn} absolute left-3 top-1/2 -translate-y-1/2 hidden sm:flex`}><FaChevronLeft aria-hidden="true" /></button>
          <button type="button" aria-label="Next picture" onClick={() => go(1)} className={`${btn} absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex`}><FaChevronRight aria-hidden="true" /></button>
        </>
      )}
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 px-4 text-center text-xs text-slate-300">
        <span className="hidden sm:inline">Arrow keys move between pictures. Scroll or + / - to zoom, drag to look around. Esc closes.</span>
        <span className="sm:hidden">Swipe for the next picture. Pinch or double-tap to zoom. Swipe down to close.</span>
      </p>
    </div>
  );
}
