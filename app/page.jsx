import ListingsSection from '@/components/home/ListingsSection';
import EventsSection from '@/components/home/EventsSection';
import ThreadsSection from '@/components/home/ThreadsSection';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

async function fetchHomeData() {
  console.log('🏠 Fetching homepage data...');
  
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

    console.log('✅ Homepage data fetched successfully:', {
      listings: listingsData.data?.listings?.length || 0,
      events: eventsData.data?.events?.length || 0,
      threads: threadsData.data?.threads?.length || 0,
    });

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
    <main className="container mx-auto py-4 bg-white">
      <div className="text-center mb-6 px-4">
        <h1 className="text-base sm:text-xl font-bold text-teal-700">
          <span className="block sm:inline">Browse Community</span>
          <span className="hidden sm:inline"> - </span>
          <span className="block sm:inline">Listings, Events and Discussions</span>
        </h1>
      </div>

      <ListingsSection listings={listings} />
      <EventsSection events={events} />
      <ThreadsSection threads={threads} />
    </main>
  );
}
