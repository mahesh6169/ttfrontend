'use client';
import { useState, useRef, useCallback } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

export default function BlogLightbox({ html, className }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [slides, setSlides] = useState([]);

  const handleClick = useCallback((e) => {
    if (e.target.tagName !== 'IMG') return;
    const imgs = Array.from(ref.current.querySelectorAll('img'));
    const clicked = imgs.indexOf(e.target);
    if (clicked === -1) return;
    setSlides(imgs.map((img) => ({ src: img.src, alt: img.alt })));
    setIndex(clicked);
    setOpen(true);
  }, []);

  return (
    <>
      <div
        ref={ref}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleClick}
      />
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Zoom]}
      />
    </>
  );
}
