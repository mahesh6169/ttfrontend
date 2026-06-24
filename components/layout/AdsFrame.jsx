// Shared app-shell frame for (with-ads) pages.
// Layout contract: see designGuides/02-Frontend-GUI/layout.md section 1.
//
// Assembles, outer to inner:
//   .container frame -> top banner slot -> row of [ LeftAd | content column | RightAd ] -> Footer
//
// The content column (#Main) is locked to `flex-1 min-w-0`: flex-1 fills the
// space the banners don't use, min-w-0 lets it shrink so a wide child (e.g. a
// horizontal-scroll chip row) scrolls inside its own track instead of stretching
// the page sideways on mobile. This rule lives here, once, so it can't drift.
//
// The top ad varies per section (EventTopAd, TopAd, ThreadTopAd, ...), so it is
// passed in as the `topAd` slot; the side ads and footer are shared.
import { Suspense } from 'react';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';
import StateSelector from '@/components/ads/StateSelector';
import AdsContentShell from '@/components/layout/AdsContentShell';

const AdsFrame = ({ topAd = null, children }) => {
  return (
    <main id="Parent" className="container mb-2 mx-auto md:flex md:flex-col md:min-h-[calc(100vh-5rem)]">
      <StateSelector />
      {topAd}
      <div className="flex gap-2 md:flex-1">
        <LeftAd />
        <div id="Main" className="flex-1 min-w-0">
          <Suspense>
            <AdsContentShell>{children}</AdsContentShell>
          </Suspense>
        </div>
        <RightAd />
      </div>
      <Footer />
    </main>
  );
};

export default AdsFrame;
