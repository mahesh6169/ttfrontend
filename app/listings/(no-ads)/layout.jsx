import { Suspense } from 'react';
import Footer from '@/components/Footer';
import FormsContentShell from '@/components/layout/FormsContentShell';

const ListingsNoAdsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container my-2 mx-auto">
      <div id="Main" className="flex-1 min-w-0">
        <Suspense>
          <FormsContentShell>{children}</FormsContentShell>
        </Suspense>
      </div>
      <Footer />
    </main>
  );
};

export default ListingsNoAdsLayout;
