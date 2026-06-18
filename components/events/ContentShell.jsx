// components/events/ContentShell.jsx
//
// Content Shell — the centered content band for events pages.
// Locked 2026-06-15: max-width 1024px (max-w-5xl), centered, with side gutters
// (16px on mobile / 24px on sm+) and 16px top/bottom. Everything on an events page
// (title, toolbar, step indicator, content, bottom bar) renders inside this.
const ContentShell = ({ children, className = '' }) => (
  <div className={`mx-auto w-full max-w-5xl px-4 sm:px-6 py-4 ${className}`}>
    {children}
  </div>
);

export default ContentShell;
