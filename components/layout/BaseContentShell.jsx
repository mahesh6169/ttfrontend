// components/layout/BaseContentShell.jsx
//
// Base Content Shell - the centered content band for non-ad, non-form pages
// (flow / profile / auth / misc app pages).
// Layout contract: see designguide/00-shared/layout-foundation.md
// - default preset: max-width 1024px (max-w-5xl), centered, side gutter 8px phone / 16px
//   tablet+, 16px top/bottom.
// - A plain container: narrow pages may center their own card inside it.
const BaseContentShell = ({ children, className = '' }) => (
  <div data-testid="content-band" className={`mx-auto w-full max-w-5xl px-2 md:px-4 py-4 ${className}`}>
    {children}
  </div>
);

export default BaseContentShell;
