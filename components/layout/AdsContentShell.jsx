// Shared content shell for the (with-ads) layout group.
// Layout contract: see designGuides/02-Frontend-GUI/layout.md
// - Content caps at 1152px, fluid below (always renders down to 1366px CSS).
// - py-4 = 16px top (the "space from header", lives here NOT in root) + 16px bottom (gap before footer).
const AdsContentShell = ({ children }) => {
  return (
    <div className="w-full max-w-[1152px] mx-auto px-2 md:px-4 py-4">
      {children}
    </div>
  );
};

export default AdsContentShell;
