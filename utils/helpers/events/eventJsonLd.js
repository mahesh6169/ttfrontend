// Build schema.org `Event` JSON-LD for an event detail page.
// Returns a plain object (or null) to JSON.stringify into a <script> tag.
// Google has rich event results, so this is a high-value block.

function pickImage(event) {
  return (
    event.ogImageUrl ||
    event.images?.[0]?.ogImageUrl ||
    event.images?.[0]?.url ||
    undefined
  );
}

function buildPlace(event) {
  const addr = event.address || {};
  const address = { '@type': 'PostalAddress', addressCountry: 'AU' };
  const street = [addr.streetNumber, addr.street].filter(Boolean).join(' ');
  if (street) address.streetAddress = street;
  if (addr.suburb) address.addressLocality = addr.suburb;
  if (addr.state) address.addressRegion = addr.state;
  if (addr.postalCode) address.postalCode = addr.postalCode;

  const place = { '@type': 'Place', address };
  if (event.venue) place.name = event.venue;

  const coords = addr.location?.coordinates || []; // [longitude, latitude]
  if (coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0)) {
    place.geo = { '@type': 'GeoCoordinates', latitude: coords[1], longitude: coords[0] };
  }
  return place;
}

function buildOffers(event, url) {
  const isPromo = event.eventIntent === 'promote' || event.isAdvertiseOnly;
  const offerUrl = isPromo && event.externalTicketUrl ? event.externalTicketUrl : url;
  const availability = 'https://schema.org/InStock';

  const priced = (event.ticketTypes || []).filter((t) => t && typeof t.price === 'number');
  if (event.isPaid && priced.length) {
    return priced.map((t) => ({
      '@type': 'Offer',
      name: t.name,
      price: t.price,
      priceCurrency: 'AUD',
      availability,
      url: offerUrl,
    }));
  }
  // Free RSVP event → a $0 offer (Google shows "Free")
  if (!event.isPaid && !isPromo) {
    return [{ '@type': 'Offer', price: 0, priceCurrency: 'AUD', availability, url: offerUrl }];
  }
  // Promotional / external ticketing → url-only offer
  return [{ '@type': 'Offer', availability, url: offerUrl }];
}

function toIso(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function buildEventJsonLd(event, url) {
  if (!event) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    url,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: buildPlace(event),
    offers: buildOffers(event, url),
  };

  const startDate = toIso(event.dateTime);
  if (startDate) jsonLd.startDate = startDate;
  const endDate = toIso(event.recurrence?.endDate);
  if (endDate) jsonLd.endDate = endDate;

  if (event.description) jsonLd.description = event.description;
  const image = pickImage(event);
  if (image) jsonLd.image = image;

  const organizerName = event.organizer?.name || event.postedBy?.name;
  if (organizerName) {
    jsonLd.organizer = { '@type': 'Organization', name: organizerName };
    if (event.organizer?.website) jsonLd.organizer.url = event.organizer.website;
  }

  return jsonLd;
}
