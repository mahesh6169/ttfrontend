import { Suspense } from 'react';
import Footer from '@/components/Footer';

const ListingsNoAdsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container my-2 mx-auto">
      <div id="Main" className="flex-1 overflow-hidden">
        <Suspense>
          {children}
        </Suspense>
      </div>
      <Footer />
    </main>
  );
};

export default ListingsNoAdsLayout;
