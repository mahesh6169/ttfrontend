import Header from '@/components/Header';
import TermsModal from '@/components/support/TermsModal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Providers } from '@/store/providers';
import '@/assets/styles/globals.css';
import { SocketListener } from '@/components/chat/SocketListener';


const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';

export const metadata = {
  title: `${siteName} - Your Local Marketplace`,
  description: `Buy and sell items on ${siteName} - Your trusted local marketplace for listings, events, and community discussions`,
  keywords: `${siteName.toLowerCase()}, marketplace, buy, sell, items, events, community, australia`,
  openGraph: {
    title: `${siteName} - Your Local Marketplace`,
    description: `Buy and sell items on ${siteName} - Your trusted local marketplace`,
    url: siteUrl,
    siteName: siteName,
    images: [
      {
        url: `${siteUrl}/desify-og-default.jpg`,
        width: 1200,
        height: 630,
      }
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Your Local Marketplace`,
    description: `Buy and sell items on ${siteName}`,
    images: [`${siteUrl}/desify-og-default.jpg`],
  },
};

const ParentLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <Providers>
         <SocketListener />
          <Header />
           {/* <TermsModal /> */} 
          {children}
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            limit={3}
            style={{
              fontSize: '14px',
            }}
            toastStyle={{
              fontSize: '14px',
            }}
            className="toast-container-mobile"
          />
        </Providers>
      </body>
    </html>
  );
};

export default ParentLayout;
