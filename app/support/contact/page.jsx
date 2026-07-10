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

  // Explicit robots (indexable utility page)
  robots: { index: true, follow: true },

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
