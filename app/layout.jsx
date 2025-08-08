import Header from '@/components/Header';
import TermsModal from '@/components/support/TermsModal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Providers } from '@/store/providers';
import '@/assets/styles/globals.css';
import { SocketListener } from '@/components/chat/SocketListener';


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
