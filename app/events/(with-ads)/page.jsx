import Link from 'next/link';
import EventsClient from './EventsClient';
import SeoFooterBlock from './SeoFooterBlock';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const eventsOgImage = process.env.NEXT_PUBLIC_EVENTS_OG_IMAGE_URL;

export const metadata = {
  // Google site title — kept punchy, includes audience hook
  title: 'Discover Community Events | Host Free RSVP Events',

  // Site description — covers both browse and host intent
  description: 'Explore community events, concerts and cultural shows. Host free RSVP events.',

  // Canonical URL for this page
  alternates: {
    canonical: `${siteUrl}/events`,
  },

  // OpenGraph block — must be full (Next.js shallow-merges; page replaces layout's OG block)
  openGraph: {
    title: 'Discover Community Events',
    description: 'Explore community events, concerts and cultural shows. Host free RSVP events.',
    url: `${siteUrl}/events`,
    siteName,
    images: [{
      url: eventsOgImage,
      width: 1200,
      height: 630,
      alt: 'Desify Events Image',
    }],
    locale: 'en_AU',
    type: 'website',
  },

  // Twitter — mirrors og
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Community Events',
    description: 'Explore community events, concerts and cultural shows. Host free RSVP events.',
    images: [eventsOgImage],
  },

  // Explicit robots (also the inherited default)
  robots: { index: true, follow: true },
};

export default function EventsPage() {
  return (
    <>
      <EventsClient
        heading={
          <div className="flex items-center justify-center gap-x-3 sm:gap-x-4 border-y border-teal-100 py-3 sm:py-4 md:w-fit md:mx-auto md:px-8">
            <h1 className="text-center text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
              Discover Indian Events, Concerts &amp; Cultural Shows
            </h1>
            <Link
              href="/events/add"
              className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors whitespace-nowrap flex-shrink-0"
            >
              + Create Event
            </Link>
          </div>
        }
      />
      <SeoFooterBlock />
    </>
  );
}
