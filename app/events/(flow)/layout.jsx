import BaseContentShell from '@/components/layout/BaseContentShell';

// Event flow (checkout / rsvp / seats / tickets) — transactional/auth pages, kept
// out of search.
export const metadata = {
  robots: { index: false, follow: true },
};

// Events flow group (checkout / rsvp / seats / tickets) - transactional pages.
// Own layout so they use BaseContentShell (1024), separate from the (no-ads)
// forms group which uses FormsContentShell (768). URLs are unchanged (route group).
const EventsFlowLayout = ({ children }) => {
  return (
    <main id="Parent" className="container bg-white my-2 mx-auto md:flex md:flex-col md:min-h-[calc(100vh-5rem)]">
      <div id="Main" className="flex-1 overflow-hidden">
        <BaseContentShell>{children}</BaseContentShell>
      </div>
    </main>
  );
};

export default EventsFlowLayout;
