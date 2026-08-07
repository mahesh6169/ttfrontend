import Link from 'next/link';
import PostPaidEventButton from '@/components/buttons/PostPaidEventButton';
import TicketPayoutCalculator from '@/components/events/TicketPayoutCalculator';
import { MARKETED_PLATFORM_FEE, platformFeeLabel } from '@/utils/platformFee';

// Fee figures come from the single source of truth (utils/platformFee.js) so the
// marketed number on this page never drifts from the rest of the app.
const FEE_LABEL = platformFeeLabel(); // "2% + $0.80"
const FEE_PCT = MARKETED_PLATFORM_FEE.percent;
const FEE_FLAT = MARKETED_PLATFORM_FEE.flat.toFixed(2);

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

// Shared CTA styles — one teal accent, used only on the action buttons.
const primaryCta =
  'inline-block w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 px-8 md:py-3.5 md:px-10 rounded-lg text-base md:text-lg transition-colors shadow-sm';
const secondaryCta =
  'inline-block w-full sm:w-auto bg-white hover:bg-teal-50 text-teal-700 font-semibold py-3 px-8 md:py-3.5 md:px-10 rounded-lg text-base md:text-lg transition-colors border-2 border-teal-600';

// Small helper for a teal icon chip.
function IconChip({ children, size = 'md' }) {
  const box =
    size === 'lg'
      ? 'w-12 h-12 md:w-14 md:h-14'
      : 'w-10 h-10 md:w-12 md:h-12';
  return (
    <div className={`${box} bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0`}>
      {children}
    </div>
  );
}

const iconClass = 'w-5 h-5 md:w-6 md:h-6 text-teal-700';
const tileIconClass = 'w-5 h-5 md:w-6 md:h-6 text-teal-700';

const benefits = [
  {
    title: 'Configurable ticket types',
    body: 'Create as many ticket types as you need — early bird, general, VIP — each with its own price and limits.',
    path: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
  },
  {
    title: 'Discount codes',
    body: 'Create promo codes buyers apply at checkout for a percentage or fixed amount off selected ticket types.',
    path: 'M7 7h.01M3 5a2 2 0 012-2h4.586a1 1 0 01.707.293l7 7a1 1 0 010 1.414l-4.586 4.586a1 1 0 01-1.414 0l-7-7A1 1 0 013 9.586V5z',
  },
  {
    title: 'Reserved seating',
    body: 'Let buyers pick their own seat with live availability and automatic holds to prevent double-booking.',
    path: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z',
  },
  {
    title: 'QR code check-in',
    body: 'Scan tickets at the door for fast, secure entry and live attendance tracking on the day.',
    path: 'M4 5a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 5a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V5zM14 14h2m2 0h.01M20 14v2m0 2v2m-6-2h2m2 0v2m0-4h.01M16 18h.01',
  },
];

// Supporting features — shown as a compact icon strip under the headline cards.
const included = [
  { label: 'Attendee registration', path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Email notifications', path: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { label: 'Real-time chat', path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { label: 'Refund portal', path: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
  { label: 'Secure payments', path: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
];

const steps = [
  { n: 1, title: 'Onboard', body: 'Set up your organiser account and connect a secure payment account to receive your funds.' },
  { n: 2, title: 'Create your event', body: 'Add your event details, ticket types, seating and refund policy.' },
  { n: 3, title: 'Share & sell', body: 'Publish your event and share the link — buyers pay securely online.' },
  { n: 4, title: 'Check in', body: 'Scan tickets at the door and track attendance in real time.' },
  { n: 5, title: 'Get paid', body: 'Funds from ticket sales transfer straight to your connected bank account.' },
];

const eventTypes = [
  { label: 'Music', path: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
  { label: 'Entertainment', path: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Cultural', path: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' },
  { label: 'Festivals', path: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { label: 'Sports', path: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { label: 'Exhibitions', path: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

const faqs = [
  { q: 'What are the fees?', a: `${FEE_PCT}% of the order total plus $${FEE_FLAT} per ticket sold — and it's all-inclusive. That single fee already covers payment processing and GST, with no setup fees, monthly charges or lock-in contracts.` },
  { q: 'Are there card processing fees or GST on top?', a: `No. Payment processing and GST are already built into the ${FEE_LABEL}. There are no separate or hidden fees — the fee you see is the only deduction.` },
  { q: 'Who pays the fee?', a: 'You do — the fee is deducted from the ticket price you set, so factor it into your pricing. Buyers pay just the ticket price, with nothing extra added at checkout.' },
  { q: 'How much do I keep per ticket?', a: `You keep the ticket price minus the processing fee (${FEE_LABEL}, all-inclusive). To see it for your own ticket price,`, link: { href: '#payout-calculator', text: 'click here' } },
  { q: 'How do payouts work?', a: "During onboarding you set up your own secure connected payment account. As tickets sell, the money — minus the all-inclusive fee — lands in that account automatically, and you pay it out to your preferred bank account whenever you're ready." },
  { q: 'Can I offer refunds?', a: 'Yes — refunds are built in, and the terms are your call. You set a refund policy (shown to buyers at checkout) that spells out whether they get a full refund or the ticket price minus the processing fee, then manage refunds from your organiser dashboard.' },
  { q: 'Can I set up seating?', a: 'Yes. Offer reserved seating so buyers pick their own seat, with live availability and automatic holds to prevent double-booking.' },
  { q: 'How do I check attendees in?', a: 'Scan tickets at the door with the QR check-in portal and track attendance live on the day.' },
  { q: 'Need help getting started?', a: "Reach our team any time via the contact form — we're here to help you run a great event." },
];

export default function TicketsPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      {/* Hero */}
      <section className="relative min-h-[52vh] md:min-h-[60vh] flex items-center justify-center text-white overflow-hidden">
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

        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-slate-900/50 z-10" />

        <div className="relative z-20 container mx-auto px-3 md:px-4 py-12 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-5">
              Sell your event tickets with Desify
            </h1>
            <p className="text-sm md:text-xl mb-7 md:mb-9 text-white/90">
              Just {FEE_LABEL} per ticket — no setup fees, no monthly charges.
            </p>
            <PostPaidEventButton className={primaryCta} />
          </div>
        </div>
      </section>

      {/* Why Desify */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-3 md:px-4">
          <h2 className="text-xl md:text-3xl font-bold text-center text-slate-900 mb-8 md:mb-12">
            Everything you need to sell tickets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="flex items-start gap-4 border border-slate-200 rounded-xl p-5 md:p-6"
              >
                <IconChip size="lg">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={b.path} />
                  </svg>
                </IconChip>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1.5">{b.title}</h3>
                  <p className="text-sm md:text-base text-slate-600">{b.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Plus everything to run the event — compact glance strip */}
          <h3 className="text-base md:text-lg font-semibold text-slate-900 text-center mt-12 md:mt-16 mb-6 md:mb-8">
            Plus everything to run your event
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
            {included.map((f) => (
              <div key={f.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <IconChip>
                  <svg className={tileIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.path} />
                  </svg>
                </IconChip>
                <h4 className="mt-3 text-xs md:text-sm font-semibold text-slate-900">{f.label}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 md:py-20 bg-slate-50">
        <div className="container mx-auto px-3 md:px-4">
          <h2 className="text-xl md:text-3xl font-bold text-center text-slate-900 mb-8 md:mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 max-w-5xl mx-auto">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                  {s.n}
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-sm md:text-base text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-3 md:px-4">
          <h2 className="text-xl md:text-3xl font-bold text-center text-slate-900 mb-3">
            Simple, flat-fee pricing
          </h2>
          <p className="text-sm md:text-base text-slate-600 text-center mb-8 md:mb-10">
            One clear fee. No setup costs, no monthly charges, no lock-in.
          </p>

          <div className="max-w-2xl mx-auto border border-slate-200 rounded-2xl p-6 md:p-10 text-center">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl md:text-6xl font-bold text-teal-700">{FEE_LABEL}</span>
            </div>
            <p className="text-sm md:text-base text-slate-600 mt-2">per ticket sold</p>
            <p className="text-xs md:text-sm text-slate-500 mt-1">Includes payment processing &amp; GST — no extra fees.</p>

            <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto">
              {['No setup fees', 'No monthly charges', 'No lock-in contract'].map((item) => (
                <div key={item} className="flex items-center gap-2 justify-center sm:justify-start">
                  <svg className="w-5 h-5 text-teal-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 md:mt-8 text-sm md:text-base text-slate-600">
              <span className="font-semibold text-slate-900">You only pay when you sell</span> — the fee
              comes out of each ticket, so there's nothing to pay up front.
            </p>

            <div id="payout-calculator" className="scroll-mt-24">
              <TicketPayoutCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* Types of events */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-3 md:px-4">
          <h2 className="text-xl md:text-3xl font-bold text-center text-slate-900 mb-8 md:mb-12">
            Events you can host
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto">
            {eventTypes.map((t) => (
              <div key={t.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <IconChip>
                  <svg className={tileIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {t.path.split(' M').map((seg, i) => (
                      <path
                        key={i}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={i === 0 ? seg : `M${seg}`}
                      />
                    ))}
                  </svg>
                </IconChip>
                <h3 className="mt-3 text-xs md:text-sm font-semibold text-slate-900">{t.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-20 bg-slate-50">
        <div className="container mx-auto px-3 md:px-4">
          <h2 className="text-xl md:text-3xl font-bold text-center text-slate-900 mb-8 md:mb-12">
            Frequently asked questions
          </h2>
          <div className="max-w-3xl mx-auto">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-slate-200 py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none text-base md:text-lg font-semibold text-slate-900">
                  <span>{f.q}</span>
                  <svg
                    className="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm md:text-base text-slate-600">
                  {f.a}
                  {f.link && (
                    <>
                      {' '}
                      <a href={f.link.href} className="text-teal-700 font-medium underline hover:text-teal-800">
                        {f.link.text}
                      </a>
                      .
                    </>
                  )}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <h2 className="text-xl md:text-4xl font-bold text-slate-900 mb-3 md:mb-4">
            Ready to start selling tickets?
          </h2>
          <p className="text-sm md:text-lg text-slate-600 mb-7 md:mb-9">
            Create your event in minutes — you only pay when you sell.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-2xl mx-auto">
            <PostPaidEventButton className={primaryCta} />
            <Link href="/support/contact?enquiry=event" className={secondaryCta}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
