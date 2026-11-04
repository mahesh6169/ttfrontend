'use client';
// A thread post as readers see it (feature 1012): text, headings, links and pictures in exactly the
// order they were written. Pictures come from server-sanitised HTML (only our own uploads survive).
// One picture shows full width; several show as a picture set (arrows on desktop, swipe on phones).
// Any picture opens the full-screen viewer, which moves through every picture in the post.
import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import {
  splitThreadContent, tidyLinksInHtml, sizedPictureUrl, pictureSrcSet,
} from '@/utils/helpers/threads/richText';

const PictureViewer = dynamic(() => import('@/components/threads/PictureViewer'), { ssr: false });

const SIZES = '(max-width: 768px) 100vw, 760px';

function Picture({ pic, label, onOpen, eager, fill }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${label} full screen`}
      className={`block w-full cursor-zoom-in ${fill ? 'h-full' : ''}`}
    >
      <img
        src={sizedPictureUrl(pic.src, 1200)}
        srcSet={pictureSrcSet(pic.src)}
        sizes={SIZES}
        alt={pic.alt || label}
        width={pic.width || undefined}
        height={pic.height || undefined}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={fill ? 'h-full w-full object-contain' : 'mx-auto block h-auto max-h-[min(60vh,600px)] w-auto max-w-full'}
      />
    </button>
  );
}

function PictureSet({ pictures, firstIndex, onOpen, eager }) {
  const trackRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const n = pictures.length;

  const scrollTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const next = (i + n) % n;
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    setCurrent(next);
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    setCurrent(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <figure className="my-4 -mx-2 sm:mx-0" data-testid="picture-set" aria-roledescription="picture set">
      <div className="relative bg-slate-100 sm:rounded-lg">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="scrollbar-hide flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto sm:rounded-lg"
        >
          {pictures.map((pic, i) => (
            <div key={`${pic.src}-${i}`} className="h-full w-full shrink-0 snap-center">
              <Picture
                pic={pic}
                fill
                eager={eager && i === 0}
                label={`picture ${i + 1} of ${n}`}
                onOpen={() => onOpen(firstIndex + i)}
              />
            </div>
          ))}
        </div>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-slate-900/75 px-2.5 py-1 text-xs font-semibold text-white" data-testid="picture-set-counter">
          {current + 1} / {n}
        </span>
        <button
          type="button"
          aria-label="Previous picture"
          onClick={() => scrollTo(current - 1)}
          className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow sm:flex"
        >
          <FaChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Next picture"
          onClick={() => scrollTo(current + 1)}
          className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow sm:flex"
        >
          <FaChevronRight aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {pictures.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show picture ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
            onClick={() => scrollTo(i)}
            className="flex h-6 items-center justify-center px-0.5"
          >
            <span className={`block h-2 rounded-full transition-all ${i === current ? 'w-5 bg-teal-700' : 'w-2 bg-slate-300'}`} />
          </button>
        ))}
      </div>
    </figure>
  );
}

export default function ThreadContent({ html, className = '' }) {
  const [viewerAt, setViewerAt] = useState(null);

  const { segments, allPictures } = useMemo(() => {
    const segs = splitThreadContent(html);
    const all = [];
    const withIndex = segs.map((s) => {
      if (s.type !== 'pictures') return s;
      const firstIndex = all.length;
      all.push(...s.pictures);
      return { ...s, firstIndex };
    });
    return { segments: withIndex, allPictures: all };
  }, [html]);

  let firstPictureSeen = false;

  return (
    <div className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'html') {
          return (
            <div
              key={i}
              className="thread-rich"
              dangerouslySetInnerHTML={{ __html: tidyLinksInHtml(seg.html) }}
            />
          );
        }
        const eager = !firstPictureSeen;
        firstPictureSeen = true;
        if (seg.pictures.length === 1) {
          return (
            <figure key={i} className="my-4 -mx-2 sm:mx-0" data-testid="picture-single">
              <Picture
                pic={seg.pictures[0]}
                eager={eager}
                label={`picture ${seg.firstIndex + 1}`}
                onOpen={() => setViewerAt(seg.firstIndex)}
              />
            </figure>
          );
        }
        return (
          <PictureSet
            key={i}
            pictures={seg.pictures}
            firstIndex={seg.firstIndex}
            eager={eager}
            onOpen={setViewerAt}
          />
        );
      })}
      {viewerAt !== null && allPictures.length > 0 && (
        <PictureViewer pictures={allPictures} startIndex={viewerAt} onClose={() => setViewerAt(null)} />
      )}
    </div>
  );
}
