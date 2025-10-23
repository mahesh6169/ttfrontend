// store/slices/coupons/searchCouponsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/coupons`;

// Thunk for fetching campaigns (coupons)
export const searchCoupons = createAsyncThunk(
  'searchCoupons/searchCoupons',
  async (_, { getState, rejectWithValue }) => {
    const { filters, pagination } = getState().searchCoupons;
    
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      // Add filters if present
      if (filters.categories.length > 0) {
        params.category = filters.categories.join(',');
      }
      if (filters.state) {
        params.state = filters.state;
      }
      if (filters.location) {
        params.lat = filters.location.coordinates[1];
        params.lng = filters.location.coordinates[0];
        params.radius = filters.location.radius || 10;
      }
      
      const response = await axios.get(`${API_BASE_URL}/stores`, { params });
      
      // Get stores, then fetch their campaigns
      const stores = response.data.stores || [];
      const campaignsPromises = stores.map(store =>
        axios.get(`${API_BASE_URL}/stores/${store._id}/campaigns`)
      );
      
      const campaignsResponses = await Promise.all(campaignsPromises);
      const allCampaigns = campaignsResponses.flatMap((res, index) => {
        return (res.data.campaigns || []).map(campaign => ({
          ...campaign,
          store: stores[index]
        }));
      });

      return {
        campaigns: allCampaigns,
        totalCount: response.data.totalCount || 0,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1
      };
    } catch (error) {
      console.error('Search Coupons Error:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to search coupons';
                          
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  // Filter state (NO communities/language filters for coupons)
  filters: {
    categories: [],
    location: null, // { coordinates: [lng, lat], radius: 10, name: 'Address' }
    state: '', // Australian state code (NSW, VIC, etc.)
    searchText: '',
    sortBy: 'newest'
  },
  
  // Pagination state
  pagination: {
    page: 1,
    limit: 20
  },
  
  // Results (campaigns with embedded store data)
  campaigns: [],
  meta: {
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  },
  
  // UI state
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

const searchCouponsSlice = createSlice({
  name: 'searchCoupons',
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
        location: null,
        state: '',
        searchText: '',
        sortBy: 'newest'
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
    
    // Set location
    setLocation: (state, action) => {
      state.filters.location = action.payload;
      state.pagination.page = 1;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Search coupons
      .addCase(searchCoupons.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchCoupons.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.campaigns = action.payload.campaigns;
        state.meta = {
          totalCount: action.payload.totalCount,
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage
        };
      })
      .addCase(searchCoupons.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const {
  updateFilter,
  clearAllFilters,
  updatePagination,
  toggleCategory,
  setLocation
} = searchCouponsSlice.actions;

export default searchCouponsSlice.reducer;
