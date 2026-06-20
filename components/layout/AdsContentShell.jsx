// Shared content shell for the (with-ads) layout group.
// Layout contract: see designGuides/02-Frontend-GUI/layout.md
// - Content caps at 1152px, fluid below (always renders down to 1366px CSS).
// - pt-4 = the 16px "space from header" (lives here, NOT in root).
const AdsContentShell = ({ children }) => {
  return (
    <div className="w-full max-w-[1152px] mx-auto px-4 pt-4">
      {children}
    </div>
  );
};

export default AdsContentShell;
