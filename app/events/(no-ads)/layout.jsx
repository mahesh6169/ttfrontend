import Footer from '@/components/Footer';
import FormsContentShell from '@/components/layout/FormsContentShell';

const EventsNoAdsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container bg-white my-2 mx-auto">
      <div id="Main" className="flex-1 overflow-hidden">
        <FormsContentShell>{children}</FormsContentShell>
      </div>
      <Footer />
    </main>
  );
};

export default EventsNoAdsLayout;
