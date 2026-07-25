import ContactClient from './ContactClient';
import Footer from '@/components/Footer';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';

export const metadata = {
  // Google site title
  title: 'Contact Us | Support, Feedback & Partnerships',

  // Site description
  description: 'Get in touch for support, event enquiries, business partnerships, feedback or general questions. We\'re here to help.',

  // Canonical URL
  alternates: {
    canonical: `${siteUrl}/support/contact`,
  },

  // Utility page — kept out of search (inherits the support layout's noindex).
  robots: { index: false, follow: true },

  // OG / Twitter tags deliberately omitted — utility page not optimised for social sharing.
  // Falls back to layout defaults if shared.
};

export default function ContactPage() {
  return (
    <>
      <ContactClient />
      <Footer />
    </>
  );
}
