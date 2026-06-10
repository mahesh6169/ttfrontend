import ThreadsClient from './ThreadsClient';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const threadsOgImage = process.env.NEXT_PUBLIC_THREADS_OG_IMAGE_URL;

export const metadata = {
  // Google site title — covers both "discussions" and "forums" keywords
  title: 'Community Discussions & Forums',

  // Site description — covers both browse and participate intent
  description: 'Join conversations, ask questions, share knowledge and connect with people in your community.',

  // Canonical URL for this page
  alternates: {
    canonical: `${siteUrl}/threads`,
  },

  // OpenGraph block — must be full (Next.js shallow-merges; page replaces layout's OG block)
  openGraph: {
    title: 'Community Discussions',
    description: 'Join conversations, ask questions and share knowledge.',
    url: `${siteUrl}/threads`,
    siteName,
    images: [{
      url: threadsOgImage,
      width: 1200,
      height: 630,
      alt: 'Desify Forum Image',
    }],
    locale: 'en_AU',
    type: 'website',
  },

  // Twitter — mirrors og
  twitter: {
    card: 'summary_large_image',
    title: 'Community Discussions',
    description: 'Join conversations, ask questions and share knowledge.',
    images: [threadsOgImage],
  },

  // Explicit robots (also the inherited default)
  robots: { index: true, follow: true },
};

export default function ThreadsPage() {
  return <ThreadsClient />;
}
