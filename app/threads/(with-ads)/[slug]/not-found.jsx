import BackButton from '@/components/BackButton';
import EmptyState from '@/components/layout/EmptyState';

// Shown with a real 404 status when the topic does not exist (deleted, or a bad link) - feature 1013.
// Same look as the coupon not-found page (owner choice in UAT).
export default function TopicNotFound() {
  return (
    <div className="flex flex-col gap-2">
      <BackButton className="self-start" />
      <EmptyState
        title="Topic not found"
        description="This topic may have been removed or the link is incorrect."
        actionLabel="Browse topics"
        actionHref="/threads"
      />
    </div>
  );
}
