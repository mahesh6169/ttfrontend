import TopAd from '@/components/ads/TopAd';
import BottomAd from '@/components/ads/BottomAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';

const FunctionsLayout = ({ children }) => {
  return (
    <main className="container bg-white my-4 mx-auto">
      {/* Top Ad */}
      <TopAd />

      <div className="flex gap-2">
        {/* Left Ad */}
        <div className="hidden lg:flex w-[160px]">
          <LeftAd />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full max-w-full overflow-hidden">
          {children}
        </div>

        {/* Right Ad */}
        <div className="hidden lg:flex w-[160px]">
          <RightAd />
        </div>
      </div>

      {/* Bottom Ad */}
      <BottomAd />
            {/* Footer */}
            <Footer />
    </main>
  );
};

export default FunctionsLayout;
