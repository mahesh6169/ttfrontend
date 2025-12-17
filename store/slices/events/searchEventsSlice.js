import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events`;

// Thunk for universal search
export const searchEvents = createAsyncThunk(
  'search/searchEvents',
  async (_, { getState, rejectWithValue }) => {
    const { filters, pagination } = getState().searchEvents;
    
    try {
      const params = {
        filters: JSON.stringify(filters),
        pagination: JSON.stringify(pagination)
      };
      
      const response = await axios.get(`${API_BASE_URL}/search`, { params });
      return response.data;
    } catch (error) {
      console.error('Search Error:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to search events';
                          
      return rejectWithValue(errorMessage);
    }
  }
);

// Thunk for fetching filter options
export const fetchFilterOptions = createAsyncThunk(
  'search/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/filter-options`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch filter options');
    }
  }
);

// Thunk for searching demo events only
export const searchDemoEvents = createAsyncThunk(
  'search/searchDemoEvents',
  async (_, { getState, rejectWithValue }) => {
    const { filters, pagination } = getState().searchEvents;

    try {
      const params = {
        filters: JSON.stringify(filters),
        pagination: JSON.stringify(pagination)
      };

      const response = await axios.get(`${API_BASE_URL}/demo`, { params });
      return response.data;
    } catch (error) {
      console.error('Demo Search Error:', error.response?.data || error.message);

      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to search demo events';

      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  // Filter state
  filters: {
    categories: [],
    communities: [],
    location: null, // { coordinates: [lng, lat], radius: 60, name: 'Address' }
    state: '', // Australian state code (NSW, VIC, etc.)
    month: '', // Format: "YYYY-MM"
    searchText: '',
    sortBy: 'date' // 'date', 'distance'
  },
  
  // Pagination state
  pagination: {
    page: 1,
    limit: 12
  },
  
  // Results
  events: [],
  meta: {
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    itemsPerPage: 12,
  },
  
  // Filter options (for dropdowns)
  filterOptions: {
    categories: [],
  },
  
  // UI state
  status: 'idle', // 'idle' | 'loading' | 'success' | 'failed'
  error: null
};

const searchEventsSlice = createSlice({
  name: 'searchEvents',
  initialState,
  reducers: {
    // Update specific filter
    updateFilter: (state, action) => {
      const { filterType, value } = action.payload;
      state.filters[filterType] = value;
      state.pagination.page = 1; // Reset to page 1 when filters change
    },
    
    // Clear all filters
    clearAllFilters: (state) => {
      state.filters = {
        categories: [],
        communities: [],
        location: null,
        state: '',
        month: '',
        searchText: '',
        sortBy: 'date'
      };
      state.pagination.page = 1;
    },
    
    // Update pagination
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Toggle category
    toggleCategory: (state, action) => {
      const category = action.payload;
      const index = state.filters.categories.indexOf(category);
      
      if (index > -1) {
        state.filters.categories.splice(index, 1);
      } else {
        state.filters.categories.push(category);
      }
      state.pagination.page = 1;
    },
    
    // Toggle community
    toggleCommunity: (state, action) => {
      const community = action.payload;
      const index = state.filters.communities.indexOf(community);
      
      if (index > -1) {
        state.filters.communities.splice(index, 1);
      } else {
        state.filters.communities.push(community);
      }
      state.pagination.page = 1;
    },
    
    // Set location
    setLocation: (state, action) => {
      state.filters.location = action.payload;
      state.pagination.page = 1;
    },
    
    // Set month
    setMonth: (state, action) => {
      state.filters.month = action.payload;
      state.pagination.page = 1;
    },
    
    // Set sort type
    setSortBy: (state, action) => {
      state.filters.sortBy = action.payload;
      state.pagination.page = 1;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Search events
      .addCase(searchEvents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.status = 'success';
        state.error = null;
        state.events = action.payload.events;
        state.meta = action.payload.meta;
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Search failed';
      })
      
      // Fetch filter options
      .addCase(fetchFilterOptions.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.filterOptions = action.payload;
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.error = action.payload || 'Failed to load filter options';
      })

      // Search demo events
      .addCase(searchDemoEvents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchDemoEvents.fulfilled, (state, action) => {
        state.status = 'success';
        state.error = null;
        state.events = action.payload.events;
        state.meta = action.payload.meta;
      })
      .addCase(searchDemoEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Demo search failed';
      });
  }
});

export const {
  updateFilter,
  clearAllFilters,
  updatePagination,
  toggleCategory,
  toggleCommunity,
  setLocation,
  setMonth,
  setSortBy,
} = searchEventsSlice.actions;

// Selectors
export const selectActiveFilters = (state) => {
  const { filters } = state.searchEvents; 
  const active = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    // Special case for sortBy - we always have a sort, but we don't want to count the default as an active filter
    if (key === 'sortBy' && value === 'date') {
      return;
    }
    
    // For all other filters
    if (
      value !== null && 
      value !== '' && 
      value !== false &&
      (Array.isArray(value) ? value.length > 0 : true) &&
      (typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).length > 0 : true)
    ) {
      active[key] = value;
    }
  });
  
  return active;
};

export const selectActiveFilterCount = (state) => {
  return Object.keys(selectActiveFilters(state)).length;
};

export default searchEventsSlice.reducer;