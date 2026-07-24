// Build schema.org `Offer` JSON-LD for a daily deal page. The deal is a
// promotional offer at a partner store, so the store is the `seller` LocalBusiness.
// Returns a plain object (or null) to JSON.stringify into a <script> tag.

function pickImage(deal) {
  return (
    deal.ogImageUrl ||
    deal.images?.[0]?.ogImageUrl ||
    deal.images?.[0]?.url ||
    undefined
  );
}

function toIso(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function buildSeller(partner) {
  if (!partner || !partner.businessName) return undefined;

  const seller = { '@type': 'LocalBusiness', name: partner.businessName };

  const addr = partner.address || {};
  const address = { '@type': 'PostalAddress', addressCountry: 'AU' };
  if (addr.suburb) address.addressLocality = addr.suburb;
  if (addr.state) address.addressRegion = addr.state;
  if (addr.postalCode) address.postalCode = addr.postalCode;
  if (address.addressLocality || address.addressRegion || address.postalCode) {
    seller.address = address;
  }

  const coords = addr.location?.coordinates || []; // [longitude, latitude]
  if (coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0)) {
    seller.geo = { '@type': 'GeoCoordinates', latitude: coords[1], longitude: coords[0] };
  }

  if (partner.contactInfo?.phone) seller.telephone = partner.contactInfo.phone;
  if (partner.contactInfo?.website) seller.url = partner.contactInfo.website;

  return seller;
}

export function buildDealJsonLd(deal, url) {
  if (!deal) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: deal.dealTitle,
    url,
    availability: 'https://schema.org/InStock',
  };

  if (deal.description) jsonLd.description = deal.description;

  const validFrom = toIso(deal.startDate);
  if (validFrom) jsonLd.validFrom = validFrom;
  const validThrough = toIso(deal.endDate);
  if (validThrough) jsonLd.validThrough = validThrough;

  const image = pickImage(deal);
  if (image) jsonLd.image = image;

  const partner = deal.partnerstoreId;
  if (partner?.category) jsonLd.category = partner.category;

  const seller = buildSeller(partner);
  if (seller) jsonLd.seller = seller;

  return jsonLd;
}
