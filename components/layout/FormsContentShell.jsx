// components/layout/FormsContentShell.jsx
//
// Forms Content Shell - the centered content band for form (no-ads) pages.
// Layout contract: see designGuides/02-Frontend-GUI/layout.md
// - max-width 768px (max-w-3xl), centered, side gutter 8px phone / 16px tablet+, 16px top/bottom.
// - Applied at the (no-ads) form layout level.
const FormsContentShell = ({ children, className = '' }) => (
  <div className={`mx-auto w-full max-w-3xl px-2 md:px-4 py-4 ${className}`}>
    {children}
  </div>
);

export default FormsContentShell;
