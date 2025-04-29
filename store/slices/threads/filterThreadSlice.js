import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/threads/filters`;

/* 🔥 First Thunk (All Filter) */
export const fetchThreadsAll = createAsyncThunk(
  'filterThreads/fetchThreadsAll',
  async (_, { getState, rejectWithValue }) => {
    const { all } = getState().filterThreads;
    try {
      const params = {
        ...(all.category && { category: all.category }),
        ...(all.location && { location: all.location }),
        ...(all.proximity && { proximity: all.proximity }),
        page: all.page,
        limit: all.limit,
      };
      const response = await axios.get(`${API_BASE_URL}/all`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ API Fetch Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch threads');
    }
  }
);

/* 🔥 Thunk for Categories Filter */
export const fetchThreadsByCategory = createAsyncThunk(
  'filterThreads/fetchThreadsByCategory',
  async (_, { getState, rejectWithValue }) => {
    const { categories } = getState().filterThreads;

    try {
      const params = {
        ...(categories.selectedCategories.length > 0 && {
          categories: categories.selectedCategories.join(','),
        }),
        page: categories.page,
        limit: categories.limit,
      };

      const response = await axios.get(`${API_BASE_URL}/categories`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch threads by categories');
    }
  }
);

/* 🔥 Thunk for Cities Filter */
export const fetchThreadsByCity = createAsyncThunk(
  'filterThreads/fetchThreadsByCity',
  async (_, { getState, rejectWithValue }) => {
    const { cities } = getState().filterThreads;

    try {
      const params = {
        ...(cities.location && { location: cities.location }),
        page: cities.page,
        limit: cities.limit,
      };

      const response = await axios.get(`${API_BASE_URL}/cities`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch threads by city');
    }
  }
);

/* 🔥 Thunk for Custom Categories Filter */
export const fetchThreadsCustomCategory = createAsyncThunk(
  'filterThreads/fetchThreadsCustomCategory',
  async (_, { getState, rejectWithValue }) => {
    const { customCategories } = getState().filterThreads;
    const POPULAR_CATEGORIES = ['Travel Partner', 'financial aid'];

    try {
      // Use selected categories or fall back to defaults (just like in fetchEventsCustomCategory)
      const categoriesToUse = customCategories.selectedCategories.length > 0 
        ? customCategories.selectedCategories 
        : POPULAR_CATEGORIES;
      
      const params = {
        categories: categoriesToUse.join(','),
        page: customCategories.page,
        limit: customCategories.limit,
      };

      console.log("🔍 Thread API Custom Categories Request Params:", params);
      const response = await axios.get(`${API_BASE_URL}/customcategories`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Thread API Custom Categories Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch threads by custom categories');
    }
  }
);

/* 🟡 Initial State */
const initialState = {
  mode: 'all',
  all: { category: '', location: '', locationInputText: '', proximity: 10, page: 1, limit: 10 },
  categories: { selectedCategories: [], page: 1, limit: 10 },
  cities: { location: '', page: 1, limit: 10 },
  customCategories: { selectedCategories: [], page: 1, limit: 10 },
  threads: [],
  meta: {},
  status: 'idle',
  error: null,
};

/* 🟢 Slice */
const filterThreadSlice = createSlice({
  name: 'filterThreads',
  initialState,
  reducers: {
    updateThreadFilter: (state, action) => {
      const { mode, values } = action.payload;
      state.mode = mode;
      state[mode] = { ...state[mode], ...values };
    },
    resetThreadFilters: (state, action) => {
      const mode = action.payload || 'all';  // Default to 'all' if not specified
    
      state.mode = mode;
    
      const defaultStates = {
        all: { category: '', location: '', locationInputText: '', proximity: 10, page: 1, limit: 10 },
        categories: { selectedCategories: [], page: 1, limit: 10 },
        cities: { location: '', page: 1, limit: 10 },
        customCategories: { selectedCategories: [], page: 1, limit: 10 },
      };
    
      state[mode] = defaultStates[mode];
    
      state.threads = [];
      state.meta = {};
      state.status = 'idle';
      state.error = null;
    
      if (typeof window !== 'undefined') {
        localStorage.removeItem('threadFilters');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ All Filters mode
      .addCase(fetchThreadsAll.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchThreadsAll.fulfilled, (state, action) => {
        state.status = 'success';
        state.threads = action.payload.threads;
        state.meta = action.payload.meta;
      })
      .addCase(fetchThreadsAll.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      })
      
      // ✅ Categories mode
      .addCase(fetchThreadsByCategory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchThreadsByCategory.fulfilled, (state, action) => {
        state.status = 'success';
        state.threads = action.payload.threads;
        state.meta = action.payload.meta;
      })
      .addCase(fetchThreadsByCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      })
      
      // ✅ Cities mode
      .addCase(fetchThreadsByCity.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchThreadsByCity.fulfilled, (state, action) => {
        state.status = 'success';
        state.threads = action.payload.threads;
        state.meta = action.payload.meta;
      })
      .addCase(fetchThreadsByCity.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      })
      
      // ✅ Custom Categories mode
      .addCase(fetchThreadsCustomCategory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchThreadsCustomCategory.fulfilled, (state, action) => {
        state.status = 'success';
        state.threads = action.payload.threads;
        state.meta = action.payload.meta;
      })
      .addCase(fetchThreadsCustomCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { updateThreadFilter, resetThreadFilters } = filterThreadSlice.actions;
export default filterThreadSlice.reducer;