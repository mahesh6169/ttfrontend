import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/adverts/categories`;

// ** Async Thunk to Fetch Adverts Based on Filters **
export const fetchAdvertsByFilter = createAsyncThunk(
  'filters/fetchAdvertsByFilter',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { category, location, proximity, page, limit } = getState().filters;
      
      const params = {
        ...(category && { category }),
        ...(location && { location }),
        ...(proximity && { proximity }),
        page,
        limit,
      };

      console.log("🔍 API Request Params:", params); // Debug

      const response = await axios.get(API_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error("❌ API Fetch Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch adverts');
    }
  }
);

// ** Redux Slice **
const filterSlice = createSlice({
  name: 'filters',
  initialState: {
    category: '',
    location: '',
    proximity: 10,
    page: 1,
    limit: 12,
    adverts: [],
    meta: {},
    status: 'idle', 
    error: null,
  },
  reducers: {
    // Update filter values
    updateFilter: (state, action) => {
      Object.assign(state, action.payload); // Merges new filters into state
    },
    // Reset all filters
    resetFilters: (state) => {
      state.category = '';
      state.location = '';
      state.proximity = 10;
      state.page = 1;
      state.limit = 10;
      state.adverts = [];
      state.meta = {};
      state.status = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdvertsByFilter.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAdvertsByFilter.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.adverts = action.payload.adverts;
        state.meta = action.payload.meta;
      })
      .addCase(fetchAdvertsByFilter.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { updateFilter, resetFilters } = filterSlice.actions;
export default filterSlice.reducer;
