import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/threads`;

/* -------------------------------- Fetch Threads by Category -------------------------------- */
export const fetchThreadsByCategory = createAsyncThunk(
  'filterThreads/fetchThreadsByCategory',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { category, page, limit } = getState().filterThreads;

      const params = {
        ...(category && { category }),
        page,
        limit,
      };

      const response = await axios.get(`${BASE_URL}/categories`, { params });
      return response.data;
    } catch (error) {
      console.error("🔴 Error fetching threads by category:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch threads");
    }
  }
);

/* -------------------------------- Fetch Threads (All) -------------------------------- */
export const fetchThreads = createAsyncThunk(
  'filterThreads/fetchThreads',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { page, limit } = getState().filterThreads;

      const response = await axios.get(BASE_URL, {
        params: { page, limit },
      });

      return {
        threads: response.data.threads || [],
        meta: response.data.meta || { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: limit },
      };
    } catch (error) {
      console.error("🔴 Error fetching all threads:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch threads");
    }
  }
);

const filterThreadsSlice = createSlice({
  name: 'filterThreads',
  initialState: {
    threads: [],
    category: '',
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    status: 'idle',
    error: null,
  },
  reducers: {
    updateThreadFilter: (state, action) => {
      Object.assign(state, action.payload);
    },
    clearThreadFilter: (state) => {
      state.category = '';
      state.page = 1;
      state.threads = [];
      state.totalItems = 0;
      state.totalPages = 0;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* --------- Fetch Threads (All) --------- */
      .addCase(fetchThreads.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.status = 'success';
        state.threads = action.payload.threads;
        const meta = action.payload.meta || {};
        state.totalItems = meta.totalItems || 0;
        state.totalPages = meta.totalPages || 1;
        state.page = meta.currentPage || 1;
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      /* --------- Fetch Threads by Category --------- */
      .addCase(fetchThreadsByCategory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchThreadsByCategory.fulfilled, (state, action) => {
        state.status = 'success';
        state.threads = action.payload.threads;
        state.totalItems = action.payload.meta.totalItems;
        state.totalPages = action.payload.meta.totalPages;
      })
      .addCase(fetchThreadsByCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { updateThreadFilter, clearThreadFilter } = filterThreadsSlice.actions;
export default filterThreadsSlice.reducer;
