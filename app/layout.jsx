import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import Footer from '@/components/Footer';
import TermsModal from '@/components/support/TermsModal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Providers } from '@/store/providers';
import '@/assets/styles/globals.css';
import { SocketListener } from '@/components/chat/SocketListener';
import StateSelectionWrapper from '@/components/ads/StateSelectionWrapper';
import Script from 'next/script';
import { COMMUNITIES } from '@/utils/constants/communities';
import { Analytics } from '@vercel/analytics/next';


const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const defaultOgImage = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE_URL || 'https://res.cloudinary.com/dtvrbdvkx/image/upload/v1764066113/ogshare_v4_psldb7.jpg';


// viewport-fit=cover lets the page extend under the notch and home indicator so the
// env(safe-area-inset-*) values become non-zero and the shell's inset handling (header top
// inset, bottom-nav bottom inset) actually takes effect on iOS and Android. See
// featureplans/shared-appshell-nav.md.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata = {
  metadataBase: new URL(siteUrl),
  
  // CANONICAL URL - Tells Google this is the official homepage URL
  alternates: {
    canonical: siteUrl
  },
  
  // GOOGLE SEARCH RESULTS - Primary title shown in search results
  title: {
    default: `Australia's Indian Community Platform`,
  },
  
  // GOOGLE SEARCH RESULTS - Description shown below title in search results
  description: `Buy and sell for free, list services and businesses, get discovered locally, explore events, sell tickets, find deals, and join community discussions.`,
  
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
  
  // SOCIAL MEDIA SHARING - WhatsApp, Facebook, LinkedIn previews
  openGraph: {
    title: `Australia's Indian Community Platform.`, // Title in WhatsApp/FB preview
    description: `Browse listings, services and businesses, explore events, find deals and join community discussions.`, // Description in preview
    url: siteUrl,
    siteName: siteName,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: `Australia's Indian Community Platform.`,
      }
    ],
    locale: 'en_AU',
    type: 'website',
  },
  
  // TWITTER/X SHARING - How your site appears when shared on Twitter/X
  twitter: {
    card: 'summary_large_image',
    title: `Australia's Indian Community Platform.`,
    description: `Browse listings, services and businesses, explore events, find deals and join community discussions.`,
    images: [defaultOgImage],
  },
  
  // SEARCH ENGINE VERIFICATION - Prove you own this site
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION, // Google Search Console verification
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,     // Bing Webmaster Tools verification
  },
  
  // WEBSITE CATEGORY - Helps search engines understand your site type
  category: 'community',

  // PWA MANIFEST - Explicitly link the manifest so Chrome detects the app as installable.
  manifest: '/manifest.webmanifest',
  
  // FAVICON - Icon shown in browser tabs and Google search results
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/fav192.png', type: 'image/png', sizes: '192x192' },
      { url: '/fav512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png', // iPhone home-screen icon (180x180)
  },

  // iPhone HOME-SCREEN LABEL - iOS ignores the manifest short_name and uses this;
  // without it, the icon label falls back to the long page title.
  appleWebApp: {
    title: siteName,       // shows "Desify" under the icon on iPhone
    capable: true,         // opens fullscreen (no Safari bar) when launched from home screen
    statusBarStyle: 'default',
  },
};

const ParentLayout = ({ children }) => {
  // STRUCTURED DATA - Helps Google understand your website structure (not visible to users)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description: 'Buy and sell for free, list services and businesses, get discovered locally, explore events, sell tickets, find deals, and join community discussions.',
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
      '@id': `${siteUrl}/#organization`
    }
  };

  // STRUCTURED DATA - Helps Google understand your organization
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: siteName,
    legalName: 'NEXO GROUP PTY LTD',
    description: 'Buy and sell for free, list services and businesses, get discovered locally, explore events, sell tickets, find deals, and join community discussions.',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/icon-512.png`,
      width: 512,
      height: 512
    },
    image: defaultOgImage,
    areaServed: {
      '@type': 'Country',
      name: 'Australia'
    },
    sameAs: [
      'https://www.facebook.com/desifyau/',
    ],
  };

  return (
    <html lang="en-AU">
      <head>
        <Script
          id="json-ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          id="json-ld-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        <Providers>
         <SocketListener />
         <StateSelectionWrapper />
          <Header />
           {/* <TermsModal /> */} 
          {/* App-shell column: min-height so short pages still fill the screen. The
              bottom padding (mobile only) reserves room for the fixed BottomNavigation,
              so whatever is last - the Footer on footer pages, the page content on
              exempt pages - clears the nav instead of hiding behind it. */}
          <div className="flex flex-col min-h-screen pt-[calc(68px+env(safe-area-inset-top))] pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
            {/* overflow-x-clip is the frame-level guard for the "nothing wider than the phone"
                rule: a too-wide child scrolls inside its own track (with min-w-0 on the content
                columns) instead of dragging the whole page sideways at the 360px floor. clip (not
                hidden) does not create a scroll container, so sticky elements are unaffected. */}
            <main className="flex-1 overflow-x-clip">
              {children}
            </main>
            <Footer />
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
          <Analytics />
        </Providers>
      </body>
    </html>
  );
};

export default ParentLayout;
