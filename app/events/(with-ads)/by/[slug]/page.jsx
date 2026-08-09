// Public organiser page /events/by/{slug} - see featureplans/events-by-organiser.md.
// Thin server component: reads the slug and renders the client body. Public, no login.
import OrganiserEventsClient from './OrganiserEventsClient';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: 'Events by this organiser',
    description: "See this organiser's upcoming events.",
    alternates: { canonical: `${siteUrl}/events/by/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function OrganiserEventsPage({ params }) {
  const { slug } = await params;
  return <OrganiserEventsClient slug={slug} />;
}
