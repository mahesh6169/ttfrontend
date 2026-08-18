import { HiBuildingStorefront, HiCalendarDays } from 'react-icons/hi2';
import HomeBannerSlider from '@/components/home/HomeBannerSlider';
import VerticalRail from '@/components/home/VerticalRail';
import ForumList from '@/components/home/ForumList';
import ShareStrip from '@/components/home/ShareStrip';
import TopAd from '@/components/ads/TopAd';
import AdsFrame from '@/components/layout/AdsFrame';
import HomeSeoFooterBlock from '@/components/home/HomeSeoFooterBlock';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

// Homepage-only meta description (designguide/06-seo/sharedseo.md "The homepage signboard").
// Set HERE, not on the root layout, so other pages keep inheriting the root default. The
// title stays the root layout default ("Australia's Indian Community Platform") and the OG /
// social blocks are left untouched.
export const metadata = {
  description:
    "Desify is Australia's Indian community platform - discover local classifieds, events and tickets, deals, coupons and community discussions, all in one place.",
};

async function fetchHomeData() {
  try {
    const [listingsRes, eventsRes, threadsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/home/listings`, {
        headers: { 'x-api-key': API_KEY },
        next: { revalidate: 300 },
      }),
      fetch(`${API_BASE_URL}/home/events`, {
        headers: { 'x-api-key': API_KEY },
        next: { revalidate: 300 },
      }),
      fetch(`${API_BASE_URL}/home/threads`, {
        headers: { 'x-api-key': API_KEY },
        next: { revalidate: 300 },
      }),
    ]);

    if (!listingsRes.ok || !eventsRes.ok || !threadsRes.ok) {
      console.error('❌ API call failed:', {
        listings: listingsRes.status,
        events: eventsRes.status,
        threads: threadsRes.status,
      });
      throw new Error('Failed to fetch homepage data');
    }

    const [listingsData, eventsData, threadsData] = await Promise.all([
      listingsRes.json(),
      eventsRes.json(),
      threadsRes.json(),
    ]);

    return {
      listings: listingsData.data?.listings || [],
      events: eventsData.data?.events || [],
      threads: threadsData.data?.threads || [],
    };
  } catch (error) {
    console.error('❌ Error fetching homepage data:', error);
    return {
      listings: [],
      events: [],
      threads: [],
    };
  }
}

export default async function HomePage() {
  const { listings, events, threads } = await fetchHomeData();

  return (
    <AdsFrame topAd={<TopAd />}>
      <div id="content" className="space-y-6">
        {/* SEO H1 - matches the title exactly; quiet heading band in the spirit of the
            vertical landings (designguide/06-seo/sharedseo.md "The homepage signboard"). */}
        <div className="border-y border-teal-100 py-3 sm:py-4 md:w-fit md:mx-auto md:px-8">
          <h1 className="text-center text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
            Australia&apos;s Indian Community Platform
          </h1>
        </div>

        <HomeBannerSlider placement="home" />

        <div className="bg-white border border-slate-200 rounded-2xl w-fit mx-auto">
          <ShareStrip />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl">
          <VerticalRail
            title="Current Listings"
            viewAllHref="/listings"
            items={listings}
            type="listing"
            cta={{
              label: 'Post a Listing',
              href: '/listings/add',
              icon: HiBuildingStorefront,
              image:
                'https://res.cloudinary.com/dtvrbdvkx/image/upload/f_auto,q_auto,w_800/v1782263880/homepage01_syrp0u.png',
            }}
          />
        </div>
        <HomeBannerSlider placement="events" />

        <div className="bg-white border border-slate-200 rounded-2xl">
          <VerticalRail
            title="Upcoming Events"
            viewAllHref="/events"
            items={events}
            type="event"
            cta={{
              label: 'Create Event',
              href: '/events/add',
              icon: HiCalendarDays,
              image:
                'https://res.cloudinary.com/dtvrbdvkx/image/upload/f_auto,q_auto,w_800/v1782265264/events-home_senrmr.jpg',
            }}
          />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl">
          <ForumList
            threads={threads}
            viewAllHref="/threads"
            cta={{ label: 'Ask a question', href: '/threads/new' }}
          />
        </div>

        <HomeSeoFooterBlock />
      </div>
    </AdsFrame>
  );
}
