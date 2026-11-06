import BackButton from '@/components/BackButton';
import EmptyState from '@/components/layout/EmptyState';

// Shown with a real 404 status when the coupon does not exist or has expired (feature 1013).
// Same message as CampaignDetailClient's own not-found state.
export default function CouponNotFound() {
  return (
    <div className="flex flex-col gap-2">
      <BackButton className="self-start" />
      <EmptyState
        title="Coupon not found"
        description="This offer may have expired or the link is incorrect."
        actionLabel="Browse coupons"
        actionHref="/coupons"
      />
    </div>
  );
}
