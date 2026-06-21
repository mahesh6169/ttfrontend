// components/layout/BaseContentShell.jsx
//
// Base Content Shell - the centered content band for non-ad, non-form pages
// (flow / profile / auth / misc app pages).
// Layout contract: see designGuides/02-Frontend-GUI/layout.md
// - max-width 1152px (max-w-6xl), centered, side gutter 8px phone / 16px tablet+, 16px top/bottom.
// - A plain container: narrow pages may center their own card inside it.
const BaseContentShell = ({ children, className = '' }) => (
  <div className={`mx-auto w-full max-w-6xl px-2 md:px-4 py-4 ${className}`}>
    {children}
  </div>
);

export default BaseContentShell;
