// store/slices/adverts/searchAdvertsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/adverts`;

// Thunk for universal search
export const searchAdverts = createAsyncThunk(
  'search/searchAdverts',
  async (_, { getState, rejectWithValue }) => {
    const { filters, pagination } = getState().searchAdverts;
    
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
                          'Failed to search adverts';
                          
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

const initialState = {
  // Filter state
  filters: {
    categories: [],        // Parent categories
    subcategories: [],     // Subcategories
    location: null, // { coordinates: [lng, lat], radius: 10, name: 'Address' }
    state: '', // Australian state code (NSW, VIC, etc.)
    searchText: '',
    adType: null, // 'offered' or 'wanted'
    sortBy: 'newest'
  },
  
  // Pagination state
  pagination: {
    page: 1,
    limit: 12
  },
  
  // Results
  adverts: [],
  meta: {
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    itemsPerPage: 12,
  },
  
  // Filter options (for dropdowns)
  filterOptions: {
    categories: [],
    subcategories: [],
  },
  
  // UI state
  status: 'idle', // 'idle' | 'loading' | 'success' | 'failed'
  error: null
};

const searchAdvertsSlice = createSlice({
  name: 'searchAdverts',
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
        subcategories: [],
        location: null,
        state: '',
        searchText: '',
        adType: null,
        sortBy: 'newest'
      };
      state.pagination.page = 1;
    },
    
    // Update pagination
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Toggle category (parent)
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

    // Toggle subcategory
    toggleSubcategory: (state, action) => {
      const subcategory = action.payload;
      const index = state.filters.subcategories.indexOf(subcategory);

      if (index > -1) {
        state.filters.subcategories.splice(index, 1);
      } else {
        state.filters.subcategories.push(subcategory);
      }
      state.pagination.page = 1;
    },
    
    // Set location
    setLocation: (state, action) => {
      state.filters.location = action.payload;
      state.pagination.page = 1;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Search adverts
      .addCase(searchAdverts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchAdverts.fulfilled, (state, action) => {
        state.status = 'success';
        state.error = null;
        state.adverts = action.payload.adverts;
        state.meta = action.payload.meta;
      })
      .addCase(searchAdverts.rejected, (state, action) => {
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
      });
  }
});

export const {
  updateFilter,
  clearAllFilters,
  updatePagination,
  toggleCategory,
  toggleSubcategory,
  setLocation,
} = searchAdvertsSlice.actions;

// Selectors
// Selectors
export const selectActiveFilters = (state) => {
  const { filters } = state.searchAdverts; 
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

export default searchAdvertsSlice.reducer;