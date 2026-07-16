import BaseContentShell from '@/components/layout/BaseContentShell';
import { META_DEFAULTS } from '@/utils/slugUtils';

export const metadata = {
  title: 'Code Validation - Desify',
  description: 'Validate discount codes for store workers',
  alternates: {
    canonical: `${META_DEFAULTS.siteUrl}/validate`
  }
};

const ValidateLayout = ({ children }) => {
  return (
    <main id="Parent" className="container bg-white my-2 mx-auto md:flex md:flex-col md:min-h-[calc(100vh-5rem)]">
      <div id="Main" className="flex-1 overflow-hidden">
        <BaseContentShell>{children}</BaseContentShell>
      </div>
    </main>
  );
};

export default ValidateLayout;
