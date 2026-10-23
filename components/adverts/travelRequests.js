// components/adverts/travelRequests.js
// Travel Requests (Parcel, Travel Companion): the budget is kept in
// fields (budgetType / budgetAmount), so cards and the detail page read it from there.

export const TRAVEL_REQUEST_SUBCATEGORIES = ['Parcel', 'Travel Companion'];

// Fixed places for From / To. India asks for a city (rendered "India / Hyderabad").
export const TRAVEL_OVERSEAS_PLACES = ['India'];
export const TRAVEL_PLACES = [
  'Sydney / NSW', 'Melbourne / VIC', 'Brisbane / QLD', 'Perth / WA',
  'Adelaide / SA', 'Hobart / TAS', 'Darwin / NT', 'Canberra / ACT',
  ...TRAVEL_OVERSEAS_PLACES,
];

// Generic safety warning for all travel requests. Shown under the title, and as a
// tick-to-continue popup when the poster presses Create / Update.
export const TRAVEL_SAFETY_NOTE =
  'Desify does not take any responsibility. Please exercise caution when dealing with new people.';

// Fields shown as the budget line, so the detail page skips them in "Additional Details"
// Route fields are shown as one "From" / "To" line, so they are skipped there too
export const TRAVEL_BUDGET_FIELD_IDS = ['budgetType', 'budgetAmount', 'fromPlace', 'fromCity', 'toPlace', 'toCity'];

// "Perth / WA" or "India / Hyderabad"
export const getTravelPlaceText = (fields, side) => {
  const place = fields?.[`${side}Place`];
  const city = (fields?.[`${side}City`] || '').trim();
  if (!place) return '';
  if (place === 'India') return city ? `India / ${city}` : 'India';
  return place;
};

export const isTravelRequest = (advert) =>
  TRAVEL_REQUEST_SUBCATEGORIES.includes(advert?.subcategory);

// "$50", "Favour" or "Negotiable" ('' when the ad has no budget yet)
export const getBudgetText = (advert) => {
  const type = advert?.fields?.budgetType;
  if (type === 'Fixed amount') {
    const amount = Number(advert.fields.budgetAmount);
    return Number.isFinite(amount) ? `$${amount}` : '';
  }
  if (type === 'Favour') return 'Favour';
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
  key === 'travelDate' && advert.adType === 'wanted' && advert.subcategory === 'Parcel'
    ? 'Delivered By'
    : fallback;

// "2026-12-20" -> "20 Dec 2026". Plain string maths on purpose: the date is exactly what the
// poster picked, so it must never be converted to the viewer's timezone.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const formatTravelDate = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
  if (!m) return value;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
};

// India to India is refused: one end of the trip must be in Australia
export const isIndiaToIndia = (fields) =>
  TRAVEL_OVERSEAS_PLACES.includes(fields?.fromPlace) && TRAVEL_OVERSEAS_PLACES.includes(fields?.toPlace);

// Description placeholder per category and ad type (the poster overwrites it)
export const getTravelDescriptionPlaceholder = (subcategory, adType) => {
  const wanted = adType === 'wanted';
  if (subcategory === 'Parcel') {
    return wanted
      ? 'Tell us what you need delivered and any handling details. E.g. "Small box of documents and sweets, about 2 kg. Pickup from Parramatta, can be dropped to a friend in Hyderabad. Flexible on dates."'
      : 'Tell people about your trip. E.g. "Flying Qantas QF401, departing 9:30am. Have 5 kg spare luggage space. Can meet at the airport or near Sydney CBD. No liquids, medicines or electronics."';
  }
  return wanted
    ? 'Tell us about your parents and the help they need. Flight details and baggage. Language they speak and kind of help needed (transit, entire trip companion) etc.'
    : 'Tell people about your trip and what you can help with. E.g. "Flying Singapore Airlines SQ232 at 8:40am. Happy to assist elderly parents with check-in, transit and immigration. I speak Telugu, Hindi and English."';
};
