import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/filters`;

/* 🔥 First Thunk (All Events Filter) */
export const fetchAllEvents = createAsyncThunk(
  'eventFilters/fetchAllEvents',
  async (_, { getState, rejectWithValue }) => {
    const { all } = getState().eventFilters;
    try {
      const params = {
        ...(all.category && { category: all.category }),
        ...(all.location && { location: all.location }),
        ...(all.proximity && { proximity: all.proximity }),
        ...(all.selectedMonth && { month: all.selectedMonth }),
        page: all.page,
        limit: all.limit,
      };
      console.log("🔍 Event API All Request Params:", params);
      const response = await axios.get(`${API_BASE_URL}/all`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Event API Fetch Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch events');
    }
  }
);

/* 🔥 Thunk for Categories Filter */
export const fetchEventsByCategory = createAsyncThunk(
  'eventFilters/fetchEventsByCategory',
  async (_, { getState, rejectWithValue }) => {
    const { categories } = getState().eventFilters;

    try {
      const params = {
        ...(categories.selectedCategories.length > 0 && {
          categories: categories.selectedCategories.join(','),
        }),
        ...(categories.selectedMonth && { month: categories.selectedMonth }),
        page: categories.page,
        limit: categories.limit,
      };

      console.log("🔍 Event API Categories Request Params:", params);
      const response = await axios.get(`${API_BASE_URL}/categories`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Event API Categories Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch events by categories');
    }
  }
);

/* 🔥 Thunk for Location Filter */
export const fetchEventsByLocation = createAsyncThunk(
  'eventFilters/fetchEventsByLocation',
  async (_, { getState, rejectWithValue }) => {
    const { locations } = getState().eventFilters;

    try {
      const params = {
        ...(locations.location && { location: locations.location }),
        ...(locations.selectedMonth && { month: locations.selectedMonth }),
        page: locations.page,
        limit: locations.limit,
      };

      console.log("🔍 Event API Locations Request Params:", params);
      const response = await axios.get(`${API_BASE_URL}/locations`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Event API Locations Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch events by location');
    }
  }
);

/* 🔥 Thunk for Custom Categories Filter */
export const fetchEventsCustomCategory = createAsyncThunk(
  'eventFilters/fetchEventsCustomCategory',
  async (_, { getState, rejectWithValue }) => {
    const { customCategories } = getState().eventFilters;
    const DEFAULT_CUSTOM_CATEGORIES = ['Technology', 'Real Estate', 'Community & Cultural'];

    try {
      // Use selected categories or fall back to defaults (just like Telugufy)
      const categoriesToUse = customCategories.selectedCategories.length > 0 
        ? customCategories.selectedCategories 
        : DEFAULT_CUSTOM_CATEGORIES;
      
      const params = {
        categories: categoriesToUse.join(','),
        ...(customCategories.selectedMonth && { month: customCategories.selectedMonth }),
        page: customCategories.page,
        limit: customCategories.limit,
      };

      console.log("🔍 Event API Custom Categories Request Params:", params);
      const response = await axios.get(`${API_BASE_URL}/customcategories`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Event API Custom Categories Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch events by custom categories');
    }
  }
);

/* 🟡 Initial State */
const initialState = {
  mode: 'all',
  all: { 
    category: '', 
    location: '', 
    locationInputText: '', 
    proximity: 10, 
    selectedMonth: '', // Format: "YYYY-MM"
    page: 1, 
    limit: 12 
  },
  categories: { 
    selectedCategories: [], 
    selectedMonth: '', 
    page: 1, 
    limit: 12 
  },
  locations: { 
    location: '', 
    selectedMonth: '', 
    page: 1, 
    limit: 12 
  },
  customCategories: { 
    selectedCategories: [], 
    selectedMonth: '', 
    page: 1, 
    limit: 12 
  },
  events: [],
  meta: {},
  status: 'idle',
  error: null,
};

/* 🟢 Slice */
const filterEventSlice = createSlice({
  name: 'eventFilters',
  initialState,
  reducers: {
    updateEventFilter: (state, action) => {
      const { mode, values } = action.payload;
      state.mode = mode;
      state[mode] = { ...state[mode], ...values };
    },
    resetEventFilters: (state, action) => {
      const mode = action.payload || 'all';  // Default to 'all' if not specified
    
      state.mode = mode;
    
      const defaultStates = {
        all: { 
          category: '', 
          location: '', 
          locationInputText: '', 
          proximity: 10, 
          selectedMonth: '', 
          page: 1, 
          limit: 12 
        },
        categories: { 
          selectedCategories: [], 
          selectedMonth: '', 
          page: 1, 
          limit: 12 
        },
        locations: { 
          location: '', 
          selectedMonth: '', 
          page: 1, 
          limit: 12 
        },
        customCategories: { 
          selectedCategories: [], 
          selectedMonth: '', 
          page: 1, 
          limit: 12 
        },
      };
    
      state[mode] = defaultStates[mode];
    
      state.events = [];
      state.meta = {};
      state.status = 'idle';
      state.error = null;
    
      if (typeof window !== 'undefined') {
        localStorage.removeItem('eventFilters');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // All Events
      .addCase(fetchAllEvents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAllEvents.fulfilled, (state, action) => {
        state.status = 'success';
        state.events = action.payload.events;
        state.meta = action.payload.meta;
      })
      .addCase(fetchAllEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      })
      
      // Events by Category
      .addCase(fetchEventsByCategory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEventsByCategory.fulfilled, (state, action) => {
        state.status = 'success';
        state.events = action.payload.events;
        state.meta = action.payload.meta;
      })
      .addCase(fetchEventsByCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      })
      
      // Events by Location
      .addCase(fetchEventsByLocation.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEventsByLocation.fulfilled, (state, action) => {
        state.status = 'success';
        state.events = action.payload.events;
        state.meta = action.payload.meta;
      })
      .addCase(fetchEventsByLocation.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      })
      
      // Events by Custom Categories
      .addCase(fetchEventsCustomCategory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEventsCustomCategory.fulfilled, (state, action) => {
        state.status = 'success';
        state.events = action.payload.events;
        state.meta = action.payload.meta;
      })
      .addCase(fetchEventsCustomCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { updateEventFilter, resetEventFilters } = filterEventSlice.actions;
export default filterEventSlice.reducer;