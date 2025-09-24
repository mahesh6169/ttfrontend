import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import TermsModal from '@/components/support/TermsModal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Providers } from '@/store/providers';
import '@/assets/styles/globals.css';
import { SocketListener } from '@/components/chat/SocketListener';
import ThreadSocketListener from '@/components/ThreadSocketListener';
import StateSelectionWrapper from '@/components/ads/StateSelectionWrapper';
import Script from 'next/script';


const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Indian Community Events, Classifieds & Forums in Australia | Telugu, Tamil, Hindi & More`,
    template: `%s | ${siteName} - Indian Community Australia`,
  },
  description: `Find Telugu events, Tamil events, Hindi events & more across Sydney, Melbourne, Perth, Brisbane. Connect with Indian diaspora in Australia. Buy, sell, discover cultural events, find Indian services & join community discussions.`,
  keywords: [
    // Language + Events combinations
    'telugu events australia',
    'telugu events sydney',
    'telugu events melbourne',
    'telugu events perth',
    'telugu events brisbane',
    'tamil events australia',
    'tamil events sydney',
    'tamil events melbourne',
    'hindi events australia',
    'punjabi events australia',
    'gujarati events australia',
    'malayalam events australia',
    'bengali events australia',
    'marathi events australia',
    'kannada events australia',
    // Community keywords
    'indian community australia',
    'indian diaspora australia',
    'indian events australia',
    'indian classifieds australia',
    'indian services australia',
    'desi events australia',
    'indian cultural events',
    // Location specific
    'indian community sydney',
    'indian community melbourne',
    'indian community perth',
    'indian community brisbane',
    'indian community adelaide',
    // Service keywords
    'indian marketplace australia',
    'desi classifieds',
    'indian forums australia',
    siteName.toLowerCase()
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: `${siteName} - Indian Community Hub | Telugu, Tamil, Hindi Events & Classifieds in Australia`,
    description: `Connect with Indian diaspora across Australia. Find Telugu events, Tamil events, Hindi cultural programs in Sydney, Melbourne, Perth & more. Buy, sell, discover services & join community discussions.`,
    url: siteUrl,
    siteName: siteName,
    images: [
      {
        url: `${siteUrl}/desify-og-default.jpg`,
        width: 1200,
        height: 630,
        alt: `${siteName} - Indian Community Events, Classifieds & Forums in Australia`,
      }
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Indian Events & Community in Australia`,
    description: `Telugu, Tamil, Hindi & more cultural events across Sydney, Melbourne, Perth. Connect with Indian diaspora. Free classifieds & community forums.`,
    creator: `@${siteName.toLowerCase()}`,
    images: [`${siteUrl}/desify-og-default.jpg`],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
  },
  category: 'community',
};

const ParentLayout = ({ children }) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description: 'Indian Community Hub for Telugu, Tamil, Hindi & more events, classifieds and forums in Australia',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
        width: 200,
        height: 60
      }
    },
    sameAs: [
      'https://www.facebook.com/desifyaustralia',
      'https://www.instagram.com/desifyaustralia',
      'https://twitter.com/desifyaustralia'
    ]
  };

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${siteName} - Indian Community Platform`,
    description: 'Connect with Indian diaspora across Australia. Find events, classifieds, and community forums.',
    url: siteUrl,
    image: `${siteUrl}/desify-og-default.jpg`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AU',
      addressRegion: 'Australia'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -25.274398,
      longitude: 133.775136
    },
    areaServed: [
      {
        '@type': 'State',
        name: 'New South Wales'
      },
      {
        '@type': 'State',
        name: 'Victoria'
      },
      {
        '@type': 'State',
        name: 'Queensland'
      },
      {
        '@type': 'State',
        name: 'Western Australia'
      },
      {
        '@type': 'State',
        name: 'South Australia'
      },
      {
        '@type': 'State',
        name: 'Tasmania'
      },
      {
        '@type': 'State',
        name: 'Australian Capital Territory'
      },
      {
        '@type': 'State',
        name: 'Northern Territory'
      }
    ],
    priceRange: 'Free',
    openingHours: 'Mo,Tu,We,Th,Fr,Sa,Su 00:00-23:59'
  };

  return (
    <html lang="en">
      <head>
        <Script
          id="json-ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          id="json-ld-local-business"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body>
        <Providers>
         <SocketListener />
         <ThreadSocketListener />
         <StateSelectionWrapper />
          <Header />
           {/* <TermsModal /> */} 
          <div className="flex flex-col min-h-screen">
            <div className="flex-1 pb-16 md:pb-0">
              {children}
            </div>
            <BottomNavigation />
          </div>
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
