import { useQuery } from '@tanstack/react-query';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/threads`;

// Build the filters object in the format the backend expects
function buildApiFilters({ cat, communities, state, q, sort, location }) {
  const filters = {
    categories: cat ? [cat] : [],
    communities: communities || [],
    state: state || '',
    searchText: q || '',
    sortBy: sort || 'newest',
    location: location || null,
  };
  return filters;
}

// Fetch threads from the API
async function fetchThreads({ filters, page }) {
  const params = {
    filters: JSON.stringify(filters),
    pagination: JSON.stringify({ page, limit: 12 }),
  };

  const response = await axios.get(`${API_BASE_URL}/search`, { params });
  return response.data.data;
}

// TanStack Query hook for searching threads
export function useSearchThreads({ cat, communities, state, q, sort, page, location, initialData }) {
  const apiFilters = buildApiFilters({ cat, communities, state, q, sort, location });

  return useQuery({
    // Query key includes all filter values — TanStack Query refetches when any change
    queryKey: [
      'threads',
      cat,
      communities?.join(','),
      state,
      q,
      sort,
      page,
      location?.name,
      location?.coordinates?.[0],
      location?.coordinates?.[1],
      location?.radius,
    ],
    queryFn: () => fetchThreads({ filters: apiFilters, page }),
    // Server pre-fill for the default view (SSR): seeds the grid so first paint shows real
    // threads, not a skeleton. Undefined for filtered/paged views, which fetch normally.
    initialData,
    // Keep previous results visible while new ones load (no flash of empty)
    placeholderData: (previousData) => previousData,
  });
}

// Fetch filter options (categories list)
async function fetchFilterOptions() {
  const response = await axios.get(`${API_BASE_URL}/filter-options`);
  return response.data.data;
}

// TanStack Query hook for filter options
export function useThreadFilterOptions() {
  return useQuery({
    queryKey: ['threadFilterOptions'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes - filter options don't change often
  });
}
