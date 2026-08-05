import FormsContentShell from '@/components/layout/FormsContentShell';

const DailyDealsNoAdsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container my-2 mx-auto">
      <div id="Main" className="flex-1 min-w-0">
        <FormsContentShell>{children}</FormsContentShell>
      </div>
    </main>
  );
};

export default DailyDealsNoAdsLayout;
