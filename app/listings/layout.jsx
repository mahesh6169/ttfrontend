import TopAd from '@/components/ads/TopAd';
import BottomAd from '@/components/ads/BottomAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';

const AdvertsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container my-2 mx-auto">
      <TopAd />
      <div className="flex gap-2">
        <LeftAd />
        <div id="Main" className="flex-1 overflow-hidden">
          {children}
        </div>
        <RightAd />
      </div>
      <BottomAd />
      <Footer />
    </main>
  );
};

export default AdvertsLayout;
