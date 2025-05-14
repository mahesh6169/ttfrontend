// store/slices/adverts/searchAdvertsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/advertsV2`;

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
        
        // Extract error message from response
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
    categories: [],
    location: null, // { coordinates: [lng, lat], radius: 10 }
    priceRange: null, // { min: 0, max: 1000, priceType: 'sale' }
    searchText: '',
    adType: null, // 'offered' or 'wanted'
    featured: false,
    status: 'active',
    customFields: {}, // Dynamic fields based on category
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
    totalItems: 0,
    itemsPerPage: 12,
    hasMore: false
  },
  
  // Filter options (for dropdowns)
  filterOptions: {
    categories: [],
    priceTypes: [],
    sortOptions: [],
    locationBounds: null
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
    
    // Update multiple filters at once
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    
    // Clear specific filter
    clearFilter: (state, action) => {
      const filterType = action.payload;
      if (filterType === 'location') {
        state.filters.location = null;
      } else if (filterType === 'priceRange') {
        state.filters.priceRange = null;
      } else if (filterType === 'categories') {
        state.filters.categories = [];
      } else if (filterType === 'customFields') {
        state.filters.customFields = {};
      } else {
        state.filters[filterType] = initialState.filters[filterType];
      }
      state.pagination.page = 1;
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
    
    // Set price range
    setPriceRange: (state, action) => {
      state.filters.priceRange = action.payload;
      state.pagination.page = 1;
    },
    
    // Set custom field
    setCustomField: (state, action) => {
      const { field, value } = action.payload;
      if (value === null || value === undefined) {
        delete state.filters.customFields[field];
      } else {
        state.filters.customFields[field] = value;
      }
      state.pagination.page = 1;
    }
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
  updateFilters,
  clearFilter,
  clearAllFilters,
  updatePagination,
  toggleCategory,
  setLocation,
  setPriceRange,
  setCustomField
} = searchAdvertsSlice.actions;

// Selectors
export const selectActiveFilters = (state) => {
    const { filters } = state.searchAdverts; 
  const active = {};
  
  Object.entries(filters).forEach(([key, value]) => {
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