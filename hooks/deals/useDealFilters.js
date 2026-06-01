import { useQueryStates, parseAsString, parseAsInteger, parseAsFloat } from 'nuqs';

// URL param definitions for the deals page filters
const dealFilterParsers = {
  cat: parseAsString,           // Category (single selection)
  state: parseAsString,         // Australian state code (NSW, VIC, etc.)
  day: parseAsString,           // Day of week: monday, tuesday, etc.
  q: parseAsString,             // Search text
  partnerstoreId: parseAsString,// Filter by a specific partner store
  sort: parseAsString.withDefault('newest'),  // 'newest', 'ending', 'oldest'
  page: parseAsInteger.withDefault(1),
  loc: parseAsString,           // Location display name
  lat: parseAsFloat,            // Latitude
  lng: parseAsFloat,            // Longitude
  radius: parseAsInteger.withDefault(10),  // Default 10km for deals
};

// Shallow updates by default (no server re-render), replace history (no back-button spam)
const defaultOptions = { shallow: true, history: 'replace' };

export function useDealFilters() {
  const [params, setParams] = useQueryStates(dealFilterParsers, defaultOptions);

  // Helper: update filters and reset page to 1
  const setFiltersWithPageReset = (updates) => {
    setParams({ ...updates, page: null });
  };

  // Helper: clear all filters
  const clearAllFilters = () => {
    setParams({
      cat: null,
      state: null,
      day: null,
      q: null,
      partnerstoreId: null,
      sort: null,     // reverts to default 'newest'
      page: null,     // reverts to default 1
      loc: null,
      lat: null,
      lng: null,
      radius: null,   // reverts to default 10
    });
  };

  // Helper: set location (batch update all 4 location params)
  const setLocation = (location) => {
    if (location) {
      // Handle both formats: { coordinates: [lng, lat] } and { lat, lng }
      const lat = location.lat ?? location.coordinates?.[1];
      const lng = location.lng ?? location.coordinates?.[0];
      setFiltersWithPageReset({
        loc: location.name,
        lat: lat,
        lng: lng,
        radius: location.radius || 10,
      });
    } else {
      setFiltersWithPageReset({
        loc: null,
        lat: null,
        lng: null,
        radius: null,
      });
    }
  };

  // Helper: check if location is active
  const hasLocation = params.loc && params.lat != null && params.lng != null;

  // Build a location object from URL params (for display and API calls)
  const location = hasLocation
    ? {
        coordinates: [params.lng, params.lat], // GeoJSON [lng, lat] order for API
        radius: params.radius,
        name: params.loc,
      }
    : null;

  return {
    // Raw param values
    params,
    // Individual filter values (convenient access)
    cat: params.cat,
    state: params.state,
    day: params.day,
    q: params.q,
    partnerstoreId: params.partnerstoreId,
    sort: params.sort,
    page: params.page,
    // Location as a structured object (matches what the API expects)
    location,
    hasLocation,
    // Setters
    setParams,                  // Batch update any params
    setFiltersWithPageReset,    // Update filters + reset page to 1
    clearAllFilters,
    setLocation,
    // Individual setters with page reset
    setCat: (val) => setFiltersWithPageReset({ cat: val || null }),
    setState: (val) => setFiltersWithPageReset({ state: val || null }),
    setDay: (val) => setFiltersWithPageReset({ day: val || null }),
    setQ: (val) => setFiltersWithPageReset({ q: val || null }),
    setSort: (val) => setParams({ sort: val }),  // sort change doesn't reset page
    setPage: (val) => setParams({ page: val }),
    // Radius update (doesn't reset page — it's a refinement of existing location)
    setRadius: (val) => setParams({ radius: val }),
  };
}
