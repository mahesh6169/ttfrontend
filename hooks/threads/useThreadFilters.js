import { useQueryStates, parseAsString, parseAsInteger, parseAsFloat } from 'nuqs';

// URL param definitions for the threads page filters
const threadFilterParsers = {
  cat: parseAsString,           // Category (single selection)
  communities: parseAsString,   // Comma-separated community values
  state: parseAsString,         // Australian state code (NSW, VIC, etc.)
  q: parseAsString,             // Search text
  sort: parseAsString.withDefault('newest'),  // 'newest', 'oldest', 'most_comments', 'recent_activity', 'distance'
  page: parseAsInteger.withDefault(1),
  loc: parseAsString,           // Location display name
  lat: parseAsFloat,            // Latitude
  lng: parseAsFloat,            // Longitude
  radius: parseAsInteger.withDefault(10),  // Default 10km for threads
};

// Shallow updates by default (no server re-render), replace history (no back-button spam)
const defaultOptions = { shallow: true, history: 'replace' };

export function useThreadFilters() {
  const [params, setParams] = useQueryStates(threadFilterParsers, defaultOptions);

  // Helper: update filters and reset page to 1
  const setFiltersWithPageReset = (updates) => {
    setParams({ ...updates, page: null });
  };

  // Helper: clear all filters
  const clearAllFilters = () => {
    setParams({
      cat: null,
      communities: null,
      state: null,
      q: null,
      sort: null,     // reverts to default 'newest'
      page: null,     // reverts to default 1
      loc: null,
      lat: null,
      lng: null,
      radius: null,   // reverts to default 10
    });
  };

  // Helper: parse communities string to array
  const communitiesArray = params.communities ? params.communities.split(',') : [];

  // Helper: set communities (converts array to comma-separated string)
  const setCommunities = (arr) => {
    setFiltersWithPageReset({ communities: arr.length > 0 ? arr.join(',') : null });
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
    communities: communitiesArray,  // Array of selected communities
    state: params.state,
    q: params.q,
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
    setCommunities,             // Set communities array
    // Individual setters with page reset
    setCat: (val) => setFiltersWithPageReset({ cat: val || null, communities: null }), // clear communities when category changes
    setState: (val) => setFiltersWithPageReset({ state: val || null }),
    setQ: (val) => setFiltersWithPageReset({ q: val || null }),
    setSort: (val) => setParams({ sort: val }),  // sort change doesn't reset page
    setPage: (val) => setParams({ page: val }),
    // Radius update (doesn't reset page — it's a refinement of existing location)
    setRadius: (val) => setParams({ radius: val }),
  };
}
