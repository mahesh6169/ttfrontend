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
  
  // GOOGLE SEARCH RESULTS - Primary title shown in search results
  title: {
    default: `${siteName} - Indian Community Events, Classifieds & Forums in Australia | Telugu, Tamil, Hindi & More`,
    template: `%s | ${siteName} - Indian Community Australia`,
  },
  
  // GOOGLE SEARCH RESULTS - Description shown below title in search results
  description: `Find Telugu events, Tamil events, Hindi events & more across Sydney, Melbourne, Perth, Brisbane. Connect with Indian diaspora in Australia. Buy, sell, discover cultural events, find Indian services & join community discussions.`,
  
  // SEO KEYWORDS - Helps Google understand what searches should show your site
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
  
  // METADATA - Who created the website
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  
  // FORMATTING - Prevents auto-detection of phone numbers, emails
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  // GOOGLE CRAWLING - Instructions for Google's search bot
  robots: {
    index: true,      // Allow Google to index this page
    follow: true,     // Allow Google to follow links
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,     // No limit on video preview length
      'max-image-preview': 'large', // Show large image previews
      'max-snippet': -1,           // No limit on text snippet length
    },
  },
  
  // CANONICAL URL - Tells Google the main URL for this content
  alternates: {
    canonical: siteUrl,
  },
  
  // SOCIAL MEDIA SHARING - WhatsApp, Facebook, LinkedIn previews
  openGraph: {
    title: `${siteName} - Indian Community Hub | Events, Classifieds & Forums in Australia`, // Title in WhatsApp/FB preview
    description: `Connect with the Indian diaspora across Australia. Discover cultural events, buy & sell in the marketplace, find trusted services, and join community discussions in Sydney, Melbourne, Perth & more.`, // Description in preview
    url: siteUrl,
    siteName: siteName,
    images: [
      {
        url: `https://res.cloudinary.com/dtvrbdvkx/image/upload/v1758681063/desify-og-default_kfqun1.jpg`, // Image shown in WhatsApp/FB preview
        width: 1200,
        height: 630,
        alt: `${siteName} - Indian Community Events, Classifieds & Forums in Australia`,
      }
    ],
    locale: 'en_AU',
    type: 'website',
  },
  
  // TWITTER/X SHARING - How your site appears when shared on Twitter/X
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Indian Events & Community in Australia`,
    description: `Discover Indian cultural events across Sydney, Melbourne, Perth & more. Connect with the diaspora community. Free classifieds & forums.`,
    creator: `@${siteName.toLowerCase()}`,
    images: [`https://res.cloudinary.com/dtvrbdvkx/image/upload/v1758681063/desify-og-default_kfqun1.jpg`],
  },
  
  // SEARCH ENGINE VERIFICATION - Prove you own this site
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION, // Google Search Console verification
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,     // Bing Webmaster Tools verification
  },
  
  // WEBSITE CATEGORY - Helps search engines understand your site type
  category: 'community',
};

const ParentLayout = ({ children }) => {
  // STRUCTURED DATA - Helps Google understand your website structure (not visible to users)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description: 'Indian Community Hub for Telugu, Tamil, Hindi & more events, classifieds and forums in Australia',
    url: siteUrl,
    // Tells Google about your search functionality
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

  // STRUCTURED DATA - Helps Google show your site for location-based searches
  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${siteName} - Indian Community Platform`,
    description: 'Connect with Indian diaspora across Australia. Find events, classifieds, and community forums.',
    url: siteUrl,
    image: `https://res.cloudinary.com/dtvrbdvkx/image/upload/v1758681063/desify-og-default_kfqun1.jpg`,
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
