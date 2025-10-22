import Footer from '@/components/Footer';
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
    <main className="min-h-screen bg-gray-50">
      {children}
      <Footer />
    </main>
  );
};

export default ValidateLayout;
