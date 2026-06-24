import { Suspense } from 'react';
import Footer from '@/components/Footer';
import FormsContentShell from '@/components/layout/FormsContentShell';

const ThreadsNoAdsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container bg-white my-2 mx-auto">
      <div id="Main" className="flex-1 overflow-hidden">
        <Suspense>
          <FormsContentShell>{children}</FormsContentShell>
        </Suspense>
      </div>
      <Footer />
    </main>
  );
};

export default ThreadsNoAdsLayout;
