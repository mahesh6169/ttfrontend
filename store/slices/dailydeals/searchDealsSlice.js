import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

// Thunk for searching deals
export const searchDeals = createAsyncThunk(
  'searchDeals/search',
  async (_, { getState, rejectWithValue }) => {
    const { filters, pagination } = getState().searchDeals;

    try {
      const params = new URLSearchParams();

      if (filters.categories.length > 0) {
        params.append('category', filters.categories.join(','));
      }
      if (filters.state) {
        params.append('state', filters.state);
      }
      if (filters.location) {
        params.append('lat', filters.location.coordinates[1]);
        params.append('lng', filters.location.coordinates[0]);
        params.append('radius', filters.location.radius || 10);
      }
      if (filters.day) {
        params.append('day', filters.day);
      }
      if (filters.searchText) {
        params.append('searchText', filters.searchText);
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      const response = await axios.get(`/dailydeals?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search deals');
    }
  }
);

// Thunk for fetching filter options
export const fetchFilterOptions = createAsyncThunk(
  'searchDeals/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/dailydeals/filter-options');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch filter options');
    }
  }
);

const initialState = {
  filters: {
    categories: [],
    location: null,
    state: '',
    day: '',
    searchText: '',
    sortBy: 'newest'
  },
  pagination: {
    page: 1,
    limit: 12
  },
  deals: [],
  meta: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  },
  filterOptions: {
    categories: []
  },
  status: 'idle',
  error: null
};

const searchDealsSlice = createSlice({
  name: 'searchDeals',
  initialState,
  reducers: {
    updateFilter: (state, action) => {
      const { filterType, value } = action.payload;
      state.filters[filterType] = value;
      state.pagination.page = 1;
    },
    clearAllFilters: (state) => {
      state.filters = {
        categories: [],
        location: null,
        state: '',
        day: '',
        searchText: '',
        sortBy: 'newest'
      };
      state.pagination.page = 1;
    },
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
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
    setLocation: (state, action) => {
      state.filters.location = action.payload;
      state.pagination.page = 1;
    },
    setDay: (state, action) => {
      state.filters.day = action.payload;
      state.pagination.page = 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchDeals.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchDeals.fulfilled, (state, action) => {
        state.status = 'success';
        state.deals = action.payload.deals;
        state.meta = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalCount: action.payload.totalCount
        };
      })
      .addCase(searchDeals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.filterOptions.categories = action.payload.categories || [];
      });
  }
});

export const {
  updateFilter,
  clearAllFilters,
  updatePagination,
  toggleCategory,
  setLocation,
  setDay
} = searchDealsSlice.actions;

export default searchDealsSlice.reducer;
