import EventTopAd from '@/components/ads/EventTopAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';
import StateSelector from '@/components/ads/StateSelector';

const EventsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container bg-white my-2 mx-auto">
      <StateSelector />
      <EventTopAd />
      <div className="flex gap-2">
        <LeftAd />
        <div id="Main" className="flex-1 overflow-hidden">
          {children}
        </div>
        <RightAd />
      </div>
      <Footer />
    </main>
  );
};

export default EventsLayout;
