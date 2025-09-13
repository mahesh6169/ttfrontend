import Header from '@/components/Header';
import TermsModal from '@/components/support/TermsModal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Providers } from '@/store/providers';
import '@/assets/styles/globals.css';
import { SocketListener } from '@/components/chat/SocketListener';
import ThreadSocketListener from '@/components/ThreadSocketListener';
import StateSelectionWrapper from '@/components/ads/StateSelectionWrapper';


const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';

export const metadata = {
  title: `${siteName} - Classifieds, Events & Community Forum`,
  description: `Classifieds – promote your business, buy & sell, discover events, and join community discussions.`,
  keywords: `${siteName.toLowerCase()}, marketplace, buy, sell, items, events, community, australia`,
  openGraph: {
    title: `${siteName} - Classifieds, Events & Community Forum`,
    description: `Classifieds – promote your business, buy & sell, discover events, and join community discussions.`,
    url: siteUrl,
    siteName: siteName,
    images: [
      {
        url: `${siteUrl}/desify-og-default.jpg`,
        width: 1200,
        height: 630,
        alt: `${siteName} - Your local marketplace for classifieds, events and community`,
      }
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Classifieds, Events & Community Forum`,
    description: `Classifieds – promote your business, buy & sell, discover events, and join community discussions.`,
    images: [`${siteUrl}/desify-og-default.jpg`],
  },
};

const ParentLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <Providers>
         <SocketListener />
         <ThreadSocketListener />
         <StateSelectionWrapper />
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
