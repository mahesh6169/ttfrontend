// store/slices/threads/searchThreadsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/threads`;

// Thunk for universal search
export const searchThreads = createAsyncThunk(
  'search/searchThreads',
  async (_, { getState, rejectWithValue }) => {
    const { filters, pagination } = getState().searchThreads;
    
    try {
      const params = {
        filters: JSON.stringify(filters),
        pagination: JSON.stringify(pagination)
      };
      
      const response = await axios.get(`${API_BASE_URL}/search`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Search Error:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to search threads';
                          
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
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch filter options');
    }
  }
);

// Thunk for fetching recent activity
export const fetchRecentActivity = createAsyncThunk(
  'search/fetchRecentActivity',
  async (limit = 5, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/recent-activity`, { 
        params: { limit } 
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch recent activity');
    }
  }
);

const initialState = {
  // Filter state
  filters: {
    categories: [],
    communities: [],
    location: null, // { coordinates: [lng, lat], radius: 10, name: 'Address' }
    searchText: '',
    sortBy: 'newest' // 'newest', 'oldest', 'most_comments', 'recent_activity', 'distance'
  },
  
  // Pagination state
  pagination: {
    page: 1,
    limit: 12
  },
  
  // Results
  threads: [],
  recentActivity: [],
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
  recentActivityStatus: 'idle', // 'idle' | 'loading' | 'success' | 'failed'
  error: null
};

const searchThreadsSlice = createSlice({
  name: 'searchThreads',
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
      state.filters = initialState.filters;
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
    
    // Set location
    setLocation: (state, action) => {
      state.filters.location = action.payload;
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
  },
  
  extraReducers: (builder) => {
    builder
      // Search threads
      .addCase(searchThreads.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchThreads.fulfilled, (state, action) => {
        state.status = 'success';
        state.error = null;
        state.threads = action.payload.threads;
        state.meta = action.payload.meta;
      })
      .addCase(searchThreads.rejected, (state, action) => {
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
      
      // Fetch recent activity
      .addCase(fetchRecentActivity.pending, (state) => {
        state.recentActivityStatus = 'loading';
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.recentActivityStatus = 'success';
        state.recentActivity = action.payload.recentThreads;
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.recentActivityStatus = 'failed';
        state.error = action.payload || 'Failed to load recent activity';
      });
  }
});

export const {
  updateFilter,
  clearAllFilters,
  updatePagination,
  toggleCategory,
  setLocation,
  toggleCommunity,
} = searchThreadsSlice.actions;

// Selectors
export const selectActiveFilters = (state) => {
  const { filters } = state.searchThreads; 
  const active = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    // Special case for sortBy - we always have a sort, but we don't want to count the default as an active filter
    if (key === 'sortBy' && value === 'newest') {
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

export default searchThreadsSlice.reducer;