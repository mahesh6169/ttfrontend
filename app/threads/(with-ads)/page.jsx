import Link from 'next/link';
import ThreadsClient from './ThreadsClient';
import SeoFooterBlock from './SeoFooterBlock';

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
  return (
    <>
      <ThreadsClient
        heading={
          <div className="flex items-center justify-center gap-x-3 sm:gap-x-4 border-y border-teal-100 py-3 sm:py-4 md:w-fit md:mx-auto md:px-8">
            <h1 className="text-center text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
              Indian Community Forum: Ask, Share &amp; Discuss
            </h1>
            <Link
              href="/threads/new"
              className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors whitespace-nowrap flex-shrink-0"
            >
              + Create a Topic
            </Link>
          </div>
        }
      />
      <SeoFooterBlock />
    </>
  );
}
