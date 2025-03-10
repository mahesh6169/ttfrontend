
import Header from '@/components/Header';
import { ToastContainer } from 'react-toastify';
import { Providers } from '@/store/providers';
import '@/assets/styles/globals.css';
import TopAd from '@/components/ads/TopAd';
import BottomAd from '@/components/ads/BottomAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';

export const metadata = {
  title: 'Marketplace',
  description: 'Buy and sell items',
  keywords: 'marketplace, buy, sell, items',
};

const MainLayout = ({ children }) => {
  return (
    <html lang="en" >
      <body >
        <Providers>
          <Header />
         
          <main className="container  bg-white mt-2 mx-auto px-4">
            {/* Top Ad */}
            <TopAd />

            {/* Layout Container */}
            <div className="flex gap-4">
              {/* Left Sidebar Ad - Visible only on large screens */}
              <div className="hidden lg:block w-[150px]">
                <LeftAd />
              </div>

              {/* Main Content */}
              <div className="flex-1 w-full mx-auto">
                {children}
              </div>

              {/* Right Sidebar Ad - Visible only on large screens */}
              <div className="hidden lg:block w-[150px]">
                <RightAd />
              </div>
            </div>

            {/* Bottom Ad */}
            <BottomAd />
          </main>

          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
};

export default MainLayout;
