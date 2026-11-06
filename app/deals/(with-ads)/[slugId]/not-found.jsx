import BackButton from '@/components/BackButton';
import EmptyState from '@/components/layout/EmptyState';

// Shown with a real 404 status when the deal does not exist (deleted, or a bad link) - feature 1013.
// Same look as the coupon not-found page (owner choice in UAT).
export default function DealNotFound() {
  return (
    <div className="flex flex-col gap-2">
      <BackButton className="self-start" />
      <EmptyState
        title="Deal not found"
        description="This deal may have been removed or the link is incorrect."
        actionLabel="Browse deals"
        actionHref="/deals"
      />
    </div>
  );
}
