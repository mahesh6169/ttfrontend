import BackButton from '@/components/BackButton';
import EmptyState from '@/components/layout/EmptyState';

// Shown with a real 404 status when the event does not exist (deleted, or a bad link) - feature 1013.
// Same look as the coupon not-found page (owner choice in UAT).
export default function EventNotFound() {
  return (
    <div className="flex flex-col gap-2">
      <BackButton className="self-start" />
      <EmptyState
        title="Event not found"
        description="This event may have been removed or the link is incorrect."
        actionLabel="Browse events"
        actionHref="/events"
      />
    </div>
  );
}
