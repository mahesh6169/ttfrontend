import { getParentForSubcategory } from '@/components/adverts/fieldSystem/Categories';

// Build schema.org JSON-LD for a listing detail page, choosing the type by category:
//   Buy & Sell (goods)                     -> Product
//   Employment (jobs)                      -> JobPosting
//   Real Estate > Sell, Rent & Share       -> RealEstateListing
//   everything else (services, shops,      -> LocalBusiness
//     food, professionals, agents)
// Returns a plain object (or null) to JSON.stringify into a <script> tag.

const EMPLOYMENT_TYPE = {
  'Full Time': 'FULL_TIME',
  'Part Time': 'PART_TIME',
  Casual: 'TEMPORARY',
};

function pickImage(advert) {
  return (
    advert.ogImageUrl ||
    advert.images?.[0]?.ogImageUrl ||
    advert.images?.[0]?.url ||
    undefined
  );
}

function buildPostalAddress(addr = {}) {
  const address = { '@type': 'PostalAddress', addressCountry: 'AU' };
  const street = [addr.streetNumber, addr.street].filter(Boolean).join(' ');
  if (street) address.streetAddress = street;
  if (addr.suburb) address.addressLocality = addr.suburb;
  if (addr.state) address.addressRegion = addr.state;
  if (addr.postalCode) address.postalCode = addr.postalCode;
  return address;
}

function buildGeo(addr = {}) {
  const coords = addr.location?.coordinates || [];
  // coordinates are stored [longitude, latitude]
  if (coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0)) {
    return { '@type': 'GeoCoordinates', latitude: coords[1], longitude: coords[0] };
  }
  return null;
}

function firstPrice(advert) {
  return (advert.pricing || []).find((p) => p && p.amount > 0);
}

export function buildListingJsonLd(advert, url) {
  if (!advert) return null;

  const base = { '@context': 'https://schema.org' };
  const image = pickImage(advert);
  const parent = getParentForSubcategory(advert.subcategory);
  const priced = firstPrice(advert);

  // --- Goods -> Product ---
  if (parent === 'Buy & Sell') {
    const jsonLd = { ...base, '@type': 'Product', name: advert.title, url };
    if (advert.description) jsonLd.description = advert.description;
    if (image) jsonLd.image = image;
    if (priced) {
      jsonLd.offers = {
        '@type': 'Offer',
        price: priced.amount,
        priceCurrency: 'AUD',
        availability: 'https://schema.org/InStock',
        url,
      };
    }
    return jsonLd;
  }

  // --- Jobs -> JobPosting ---
  if (parent === 'Employment') {
    const jsonLd = {
      ...base,
      '@type': 'JobPosting',
      title: advert.title,
      description: advert.description || advert.title,
      hiringOrganization: {
        '@type': 'Organization',
        name: advert.postedBy?.name || 'Desify',
      },
      jobLocation: { '@type': 'Place', address: buildPostalAddress(advert.address) },
      url,
    };
    if (advert.createdAt) jsonLd.datePosted = advert.createdAt;
    if (EMPLOYMENT_TYPE[advert.subcategory]) jsonLd.employmentType = EMPLOYMENT_TYPE[advert.subcategory];
    return jsonLd;
  }

  // --- Property listing -> RealEstateListing ---
  if (advert.subcategory === 'Sell, Rent & Share') {
    const jsonLd = { ...base, '@type': 'RealEstateListing', name: advert.title, url };
    if (advert.description) jsonLd.description = advert.description;
    if (image) jsonLd.image = image;
    jsonLd.address = buildPostalAddress(advert.address);
    const geo = buildGeo(advert.address);
    if (geo) jsonLd.geo = geo;
    if (priced) {
      jsonLd.offers = {
        '@type': 'Offer',
        price: priced.amount,
        priceCurrency: 'AUD',
        url,
      };
    }
    return jsonLd;
  }

  // --- Everything else (services, shops, food, professionals, agents) -> LocalBusiness ---
  const jsonLd = {
    ...base,
    '@type': 'LocalBusiness',
    name: advert.title,
    url,
    address: buildPostalAddress(advert.address),
  };
  if (advert.description) jsonLd.description = advert.description;
  if (image) jsonLd.image = image;
  if (advert.contactInfo?.mobile) jsonLd.telephone = advert.contactInfo.mobile;
  const geo = buildGeo(advert.address);
  if (geo) jsonLd.geo = geo;
  return jsonLd;
}
