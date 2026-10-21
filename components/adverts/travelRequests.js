// components/adverts/travelRequests.js
// Travel Requests (Parcel Carrying, Travel Companion for Parents): the budget is kept in
// fields (budgetType / budgetAmount), so cards and the detail page read it from there.

export const TRAVEL_REQUEST_SUBCATEGORIES = ['Parcel Carrying', 'Travel Companion for Parents'];

export const TRAVEL_SAFETY_NOTE =
  "Never carry sealed items you haven't checked. Desify does not verify users and takes no payment - agree the details directly in chat.";

// Fields shown as the budget line, so the detail page skips them in "Additional Details"
export const TRAVEL_BUDGET_FIELD_IDS = ['budgetType', 'budgetAmount'];

export const isTravelRequest = (advert) =>
  TRAVEL_REQUEST_SUBCATEGORIES.includes(advert?.subcategory);

// "$50", "Free" or "Negotiable" ('' when the ad has no budget yet)
export const getBudgetText = (advert) => {
  const type = advert?.fields?.budgetType;
  if (type === 'Fixed amount') {
    const amount = Number(advert.fields.budgetAmount);
    return Number.isFinite(amount) ? `$${amount}` : '';
  }
  if (type === 'Free (favour)') return 'Free';
  if (type === 'Negotiable') return 'Negotiable';
  return '';
};

// Card line: "Wanted - $50", "Offered - Negotiable"
export const getTravelCardLabel = (advert) => {
  const who = advert.adType === 'wanted' ? 'Wanted' : 'Offered';
  const budget = getBudgetText(advert);
  return budget ? `${who} - ${budget}` : who;
};

// Detail page label for a stored field; a wanted parcel's travelDate reads "Delivered By"
export const getTravelFieldLabel = (advert, key, fallback) =>
  key === 'travelDate' && advert.adType === 'wanted' && advert.subcategory === 'Parcel Carrying'
    ? 'Delivered By'
    : fallback;

// "2026-12-20T17:00" -> "20 Dec 2026, 5:00 PM". Plain string maths on purpose: the time is the
// wall-clock time the poster picked, so it must never be converted to the viewer's timezone.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const formatTravelDateTime = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
  if (!m) return value;
  const hour = Number(m[4]);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}, ${hour12}:${m[5]} ${hour < 12 ? 'AM' : 'PM'}`;
};
