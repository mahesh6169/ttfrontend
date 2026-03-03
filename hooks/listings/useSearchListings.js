import { useQuery } from '@tanstack/react-query';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/adverts`;

// Build the filters object in the format the backend expects
function buildApiFilters({ cat, sub, state, adType, q, sort, location, communities }) {
  const filters = {
    categories: cat ? [cat] : [],
    subcategories: sub ? [sub] : [],
    location: location || null,
    state: state || '',
    searchText: q || '',
    adType: adType || null,
    sortBy: sort || 'newest',
    communities: communities || [],
  };
  return filters;
}

// Fetch listings from the API
async function fetchListings({ filters, page }) {
  const params = {
    filters: JSON.stringify(filters),
    pagination: JSON.stringify({ page, limit: 12 }),
  };

  const response = await axios.get(`${API_BASE_URL}/search`, { params });
  return response.data.data;
}

// TanStack Query hook for searching listings
export function useSearchListings({ cat, sub, state, adType, q, sort, page, location, communities }) {
  const apiFilters = buildApiFilters({ cat, sub, state, adType, q, sort, location, communities });

  return useQuery({
    // Query key includes all filter values — TanStack Query refetches when any change
    queryKey: ['listings', cat, sub, state, adType, q, sort, page, location?.name, location?.coordinates?.[0], location?.coordinates?.[1], location?.radius, communities?.join(',')],
    queryFn: () => fetchListings({ filters: apiFilters, page }),
    // Keep previous results visible while new ones load (no flash of empty)
    placeholderData: (previousData) => previousData,
  });
}
