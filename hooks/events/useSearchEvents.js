import { useQuery } from '@tanstack/react-query';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events`;

// Build the filters object in the format the backend expects
function buildApiFilters({ cat, communities, state, month, eventType, q, sort, location }) {
  const filters = {
    categories: cat ? [cat] : [],
    communities: communities || [],
    state: state || '',
    month: month || '',
    eventType: eventType || '',
    searchText: q || '',
    sortBy: sort || 'date',
    location: location || null,
  };
  return filters;
}

// Fetch events from the API
async function fetchEvents({ filters, page }) {
  const params = {
    filters: JSON.stringify(filters),
    pagination: JSON.stringify({ page, limit: 12 }),
  };

  const response = await axios.get(`${API_BASE_URL}/search`, { params });
  return response.data;
}

// TanStack Query hook for searching events
export function useSearchEvents({ cat, communities, state, month, eventType, q, sort, page, location }) {
  const apiFilters = buildApiFilters({ cat, communities, state, month, eventType, q, sort, location });

  return useQuery({
    // Query key includes all filter values — TanStack Query refetches when any change
    queryKey: [
      'events',
      cat,
      communities?.join(','),
      state,
      month,
      eventType,
      q,
      sort,
      page,
      location?.name,
      location?.coordinates?.[0],
      location?.coordinates?.[1],
      location?.radius,
    ],
    queryFn: () => fetchEvents({ filters: apiFilters, page }),
    // Keep previous results visible while new ones load (no flash of empty)
    placeholderData: (previousData) => previousData,
  });
}
