// Marketed platform fee shown to organisers across the app
// (refund step, tickets page, sell page, event cards, etc.).
//
// SINGLE SOURCE OF TRUTH for the *displayed* fee. Change the numbers here and every
// page that imports them updates. This is the marketed figure ("2% + $0.80"), a simplified
// version of the backend's real model (Stripe + platform top-up in platformPriceConfig.js) —
// keep it in step with marketing copy.

export const MARKETED_PLATFORM_FEE = {
  percent: 2.0, // % of the ticket price
  flat: 0.80,   // $ per ticket
};

// "2% + $0.80" label for display.
export const platformFeeLabel = () =>
  `${MARKETED_PLATFORM_FEE.percent}% + $${MARKETED_PLATFORM_FEE.flat.toFixed(2)}`;

// Total platform fee for a single ticket at the given price.
export const platformFeeFor = (price) => {
  const p = Number(price) || 0;
  return (p * MARKETED_PLATFORM_FEE.percent) / 100 + MARKETED_PLATFORM_FEE.flat;
};
