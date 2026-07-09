import Link from 'next/link';
import PostPaidEventButton from '@/components/buttons/PostPaidEventButton';
import Footer from '@/components/Footer';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const ticketsOgImage = process.env.NEXT_PUBLIC_TICKETS_OG_IMAGE_URL;

export const metadata = {
  title: 'Sell Event Tickets Online | Simple Flat Fee Pricing',
  description: 'Sell event tickets online with simple pricing. Multiple ticket types, seating layouts, refunds, check-in and email confirmations.',
  alternates: {
    canonical: `${siteUrl}/tickets`,
  },
  openGraph: {
    title: 'Sell Event Tickets Online',
    description: 'Sell tickets online with simple pricing, seating layouts and event management tools.',
    url: `${siteUrl}/tickets`,
    siteName,
    images: [{ url: ticketsOgImage, width: 1200, height: 630, alt: 'Desify Tickets Image' }],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sell Event Tickets Online',
    description: 'Sell tickets online with simple pricing, seating layouts and event management tools.',
    images: [ticketsOgImage],
  },
  robots: { index: true, follow: true },
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Desify Event Ticketing',
  serviceType: 'Event Ticketing Platform',
  provider: {
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
  },
  areaServed: { '@type': 'Country', name: 'Australia' },
  description: 'Online event ticketing platform for organizers in Australia. Includes attendee registration, custom seating layouts, refund management, check-in portal, and real-time chat.',
  url: `${siteUrl}/tickets`,
  offers: {
    '@type': 'Offer',
    priceCurrency: 'AUD',
    description: 'Simple flat-fee pricing. No setup fees, no monthly charges.',
  },
};

export default function TicketsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      {/* Hero Banner */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center text-white overflow-hidden mt-2 md:mt-1">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="https://res.cloudinary.com/dtvrbdvkx/video/upload/so_5,f_jpg,q_auto/v1764576671/event_hd_1280_720_30fps_vqb9am.jpg"
          className="absolute inset-0 w-full h-full object-cover z-0 blur-[2px] md:blur-sm"
        >
          <source src="https://res.cloudinary.com/dtvrbdvkx/video/upload/f_auto,q_auto:good/v1764576671/event_hd_1280_720_30fps_vqb9am.mp4" type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/30 md:from-black/50 md:to-black/40 z-10" />
        
        <div className="relative z-20 container mx-auto px-3 py-10 md:px-4 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-6">
              Sell Event Tickets with Desify
            </h1>
            <p className="text-sm md:text-xl mb-6 md:mb-8 text-white/90">
              The all-in-one ticketing platform for event organizers
            </p>
            <PostPaidEventButton
              className="inline-block w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 md:py-4 md:px-10 rounded-lg text-base md:text-lg transition-colors shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Why Choose Desify - 3 Key Reasons */}
      <section className="py-10 md:py-16 bg-white">
        <div className="container mx-auto px-3 md:px-4">
          <h2 className="text-xl md:text-3xl font-bold text-center mb-6 md:mb-12">Why Choose Desify?</h2>
          <div className="grid gap-4 md:gap-8 max-w-5xl mx-auto">
            
            {/* Simple Pricing */}
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl p-4 md:p-8 shadow-sm">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-teal-600 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 text-gray-900">Simple, Flat Fee Pricing</h3>
                  <p className="text-sm md:text-lg text-gray-700 mb-2 md:mb-3">
                    <span className="font-bold text-teal-700">2% + $0.80 per ticket</span> — that's it!
                  </p>
                  <p className="text-xs md:text-base text-gray-600">
                    No setup fees, no monthly charges, no surprises. All-inclusive pricing covering everything.
                  </p>
                </div>
              </div>
            </div>

            {/* Complete Management Tools */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 md:p-8 shadow-sm">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-amber-600 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 text-gray-900">Complete Event Management</h3>
                  <p className="text-xs md:text-base text-gray-600">
                    Everything you need: attendee registration, check-in portal, refund management, email confirmations, and real-time chat for inquiries.
                  </p>
                </div>
              </div>
            </div>

            {/* Flexibility */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 md:p-8 shadow-sm">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-purple-600 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 text-gray-900">Flexible Ticketing Options</h3>
                  <p className="text-xs md:text-base text-gray-600">
                    Multiple ticket types, custom seating layouts, early bird pricing — configure your event exactly how you want it.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Seating Layouts */}
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-4 md:p-8 shadow-sm">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-indigo-600 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 text-gray-900">Custom Seating Layouts</h3>
                  <p className="text-xs md:text-base text-gray-600">
                    Create seating maps for Halls, Community Centres and Venues. Interactive seat selection with real-time availability, flexible configuration, and automatic reservations to prevent double-booking.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Types of Events */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-3 md:px-4">
          <h2 className="text-lg md:text-2xl font-bold text-center mb-4 md:mb-8">Types of Events You Can Host</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 max-w-4xl mx-auto">
            
            {/* Entertainment */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-purple-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Entertainment</h3>
            </div>

            {/* Exhibitions */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-blue-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Exhibitions</h3>
            </div>

            {/* Cultural */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-pink-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Cultural</h3>
            </div>

            {/* Community Meets */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-green-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Community Meets</h3>
            </div>

            {/* Music */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-orange-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Music</h3>
            </div>

            {/* Workshops */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-indigo-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Workshops</h3>
            </div>

            {/* Sports */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-red-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Sports</h3>
            </div>

            {/* Conferences */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-teal-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Conferences</h3>
            </div>

            {/* Festivals */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-yellow-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Festivals</h3>
            </div>

            {/* Fundraisers */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-emerald-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Fundraisers</h3>
            </div>

          </div>
        </div>
      </section>

      {/* Features at Glance */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-3 md:px-4">
          <h2 className="text-lg md:text-2xl font-bold text-center mb-4 md:mb-8">Features at Glance</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            
            {/* Multiple Ticket Types */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-purple-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Multiple Ticket Types</h3>
            </div>

            {/* Seating Layout */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-indigo-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Seating Layout</h3>
            </div>

            {/* Email Confirmations */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-blue-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Email Confirmations</h3>
            </div>

            {/* Chat Feature */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-pink-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Chat Feature</h3>
            </div>

            {/* Secure Payment */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-green-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Secure Payment</h3>
            </div>

            {/* Refund Portal */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-orange-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Refund Portal</h3>
            </div>

            {/* Check-in Portal */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
              <div className="bg-teal-100 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900">Check-in Portal</h3>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-16 bg-gray-50">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <h2 className="text-xl md:text-4xl font-bold mb-6 md:mb-8 text-gray-900">Ready to Start Selling Tickets?</h2>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center max-w-2xl mx-auto">
            <PostPaidEventButton
              className="inline-block w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 md:py-4 md:px-10 rounded-lg text-base md:text-lg transition-colors shadow-lg"
            />
            <Link
              href="/support/contact?enquiry=event"
              className="inline-block w-full md:w-auto bg-white hover:bg-gray-100 text-teal-700 font-bold py-3 px-6 md:py-4 md:px-10 rounded-lg text-base md:text-lg transition-colors border-2 border-teal-600 shadow-md"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
