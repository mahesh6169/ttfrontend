import HeroSection from '@/components/home/HeroSection';
import ListingsSection from '@/components/home/ListingsSection';
import EventsSection from '@/components/home/EventsSection';
import ThreadsSection from '@/components/home/ThreadsSection';
import Footer from '@/components/Footer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

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
    <main className="bg-slate-50">
      <HeroSection />

      <div id="content" className="w-full md:container md:mx-auto space-y-6 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl">
          <ListingsSection listings={listings} />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl">
          <EventsSection events={events} />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl">
          <ThreadsSection threads={threads} />
        </div>
      </div>

      <Footer />
    </main>
  );
}
