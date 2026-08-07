import FormsContentShell from '@/components/layout/FormsContentShell';

const EventsNoAdsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container bg-white my-2 mx-auto">
      <div id="Main" className="flex-1 overflow-x-clip">
        <FormsContentShell>{children}</FormsContentShell>
      </div>
    </main>
  );
};

export default EventsNoAdsLayout;
