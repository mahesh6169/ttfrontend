// Shared discount-code helper for the CUSTOMER-FACING hint display (the event detail card and the
// buy-tickets page). It decides whether a code should be dangled to a customer as a usable discount.
//
// Why it exists: the API strips dead/secret codes for the public, but sends the event OWNER the full
// unfiltered array (for the edit wizard). So on a surface the owner can preview - the detail card,
// the tickets page - an expired / not-yet-live / used-up code would otherwise show as if live. This
// filter makes the owner's own preview correct too.
//
// Display-only: the backend re-validates a code at checkout, so a stale hint can never actually
// discount a purchase. Do NOT use this on the create/edit wizard - there the owner must see ALL
// codes (including dead ones) to manage them.
export const isDiscountRedeemable = (dc, now = new Date()) => {
  if (!dc) return false;
  if (dc.active === false) return false;                                    // kill switch
  if (dc.validFrom && new Date(dc.validFrom) > now) return false;          // not started yet
  if (dc.validUntil && new Date(dc.validUntil) < now) return false;        // expired
  if (dc.remainingUses != null && dc.remainingUses <= 0) return false;     // used up / over-subscribed
  return true;
};
