import Header from '@/components/Header';
import TermsModal from '@/components/support/TermsModal';
import { ToastContainer } from 'react-toastify';
import { Providers } from '@/store/providers';
import '@/assets/styles/globals.css';

export const metadata = {
  title: 'Marketplace',
  description: 'Buy and sell items',
  keywords: 'marketplace, buy, sell, items',
};

const ParentLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
           {/* <TermsModal /> */} 
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
};

export default ParentLayout;
