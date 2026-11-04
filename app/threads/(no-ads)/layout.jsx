import { Suspense } from 'react';

const ThreadsNoAdsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container my-2 mx-auto">
      <div id="Main" className="flex-1 min-w-0">
        <Suspense>
          {/* Feature 1012: the pages set their own width - the writing step is wide (WordPress-like), the
              details step uses the usual 768px form width. */}
          <div data-testid="content-band" className="mx-auto w-full px-2 md:px-4 py-4">{children}</div>
        </Suspense>
      </div>
    </main>
  );
};

export default ThreadsNoAdsLayout;
