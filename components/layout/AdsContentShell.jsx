// Shared content shell for the (with-ads) layout group.
// Layout contract: see designguide/00-shared/layout-foundation.md
// - default preset: content caps at 1024px (max-w-5xl), fluid below.
// - py-4 = 16px top (the "space from header", lives here NOT in root) + 16px bottom (gap before footer).
const AdsContentShell = ({ children }) => {
  return (
    <div data-testid="content-band" className="w-full max-w-5xl mx-auto px-2 md:px-4 py-4">
      {children}
    </div>
  );
};

export default AdsContentShell;
