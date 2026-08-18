import { useQuery } from '@tanstack/react-query';
import axios from '@/utils/axiosConfig';

// Fetch deals from the API using query params (not JSON.stringify)
async function fetchDeals({ cat, subcat, state, day, q, partnerstoreId, sort, page, location }) {
  const params = new URLSearchParams();

  if (cat) {
    params.append('category', cat);
  }
  if (subcat) {
    params.append('subcategory', subcat);
  }
  if (state) {
    params.append('state', state);
  }
  if (location) {
    params.append('lat', location.coordinates[1]);
    params.append('lng', location.coordinates[0]);
    params.append('radius', location.radius || 10);
  }
  if (day) {
    params.append('day', day);
  }
  if (q) {
    params.append('searchText', q);
  }
  if (partnerstoreId) {
    params.append('partnerstoreId', partnerstoreId);
  }
  if (sort) {
    params.append('sortBy', sort);
  }
  params.append('page', page || 1);
  params.append('limit', 12);

  const response = await axios.get(`/dailydeals?${params.toString()}`);
  return response.data;
}

// TanStack Query hook for searching deals
export function useSearchDeals({ cat, subcat, state, day, q, partnerstoreId, sort, page, location, initialData }) {
  return useQuery({
    // Query key includes all filter values — TanStack Query refetches when any change
    queryKey: [
      'deals',
      cat,
      subcat,
      state,
      day,
      q,
      partnerstoreId,
      sort,
      page,
      location?.name,
      location?.coordinates?.[0],
      location?.coordinates?.[1],
      location?.radius,
    ],
    queryFn: () => fetchDeals({ cat, subcat, state, day, q, partnerstoreId, sort, page, location }),
    // Server pre-fill for the default view (SSR): seeds the grid so first paint shows real
    // deals, not a skeleton. Undefined for filtered/paged views, which fetch normally.
    initialData,
    // Keep previous results visible while new ones load (no flash of empty)
    placeholderData: (previousData) => previousData,
  });
}

// Fetch filter options (categories list)
async function fetchFilterOptions() {
  const response = await axios.get('/dailydeals/filter-options');
  return response.data;
}

// TanStack Query hook for filter options
export function useDealFilterOptions() {
  return useQuery({
    queryKey: ['dealFilterOptions'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes - filter options don't change often
  });
}
