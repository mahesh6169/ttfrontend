import Footer from '@/components/Footer';

const EventsNoAdsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container bg-white my-2 mx-auto">
      <div id="Main" className="flex-1 overflow-hidden">
        {children}
      </div>
      <Footer />
    </main>
  );
};

export default EventsNoAdsLayout;
