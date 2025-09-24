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
import { COMMUNITIES } from '@/utils/constants/communities';
import { Analytics } from '@vercel/analytics/next';


const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';

// Generate keywords dynamically
const generateKeywords = () => {
  const keywords = [];
  const keyTerms = ['events', 'ads', 'adverts', 'classifieds', 'marketplace', 'forums', 'discussions', 'community'];
  const locations = [
    'australia',
    // Capital cities
    'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'hobart', 'darwin', 'canberra',
    // Major regional cities with large Indian populations
    'gold coast', 'newcastle', 'wollongong', 'geelong', 'townsville', 'cairns', 'sunshine coast',
    // Western Australia cities
    'fremantle', 'mandurah', 'bunbury', 'rockingham', 'joondalup',
    // State codes for broader searches
    'nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'
  ];
  const genericTerms = ['indian', 'desi'];
  
  // Add language-specific keywords
  COMMUNITIES.forEach(community => {
    const lang = community.label.toLowerCase();
    
    // Language + key terms
    keyTerms.forEach(term => {
      keywords.push(`${lang} ${term} australia`);
    });
    
    // Language + events + locations
    locations.forEach(location => {
      keywords.push(`${lang} events ${location}`);
    });
  });
  
  // Add generic Indian/Desi keywords
  genericTerms.forEach(term => {
    keyTerms.forEach(keyTerm => {
      keywords.push(`${term} ${keyTerm} australia`);
    });
    
    locations.forEach(location => {
      keywords.push(`${term} community ${location}`);
    });
  });
  
  // Add base keywords
  keywords.push(
    siteName.toLowerCase(),
    'indian diaspora australia',
    'desi community australia',
    'indian services australia'
  );
  
  return keywords;
};

export const metadata = {
  metadataBase: new URL(siteUrl),
  
  // GOOGLE SEARCH RESULTS - Primary title shown in search results
  title: {
    default: `Desify – Classifieds, Events & Forum`,
    template: `%s | Desify`,
  },
  
  // GOOGLE SEARCH RESULTS - Description shown below title in search results
  description: `List Ads , Promote Business & Services , Create & Share Events , Join Discussions`,
  
  // SEO KEYWORDS - Helps Google understand what searches should show your site
  keywords: generateKeywords(),
  
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
    title: `Desify – Classifieds, Events & Forum`, // Title in WhatsApp/FB preview
    description: `List Ads , Promote Business & Services , Create & Share Events , Join Discussions`, // Description in preview
    url: siteUrl,
    siteName: siteName,
    images: [
      {
        url: `https://res.cloudinary.com/dtvrbdvkx/image/upload/v1758681063/desify-og-default_kfqun1.jpg`, // Image shown in WhatsApp/FB preview
        width: 1200,
        height: 630,
        alt: `Desify – Classifieds, Events & Forum`,
      }
    ],
    locale: 'en_AU',
    type: 'website',
  },
  
  // TWITTER/X SHARING - How your site appears when shared on Twitter/X
  twitter: {
    card: 'summary_large_image',
    title: `Desify – Classifieds, Events & Forum`,
    description: `List Ads , Promote Business & Services , Create & Share Events , Join Discussions`,
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
    description: 'List Ads , Promote Business & Services , Create & Share Events , Join Discussions',
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
    description: 'List Ads , Promote Business & Services , Create & Share Events , Join Discussions',
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
          <Analytics />
        </Providers>
      </body>
    </html>
  );
};

export default ParentLayout;
