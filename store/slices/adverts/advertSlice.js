import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/adverts`;

/* ------------------ Thunks ------------------ */

// Fetch advert by ID
export const getAdvertById = createAsyncThunk(
  'adverts/getAdvertById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/byid/${id}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch advert' });
    }
  }
);

// Add advert
export const addAdvert = createAsyncThunk(
  'adverts/addAdvert',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/addAdvert`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to create advert' });
    }
  }
);

// Update advert
export const updateAdvert = createAsyncThunk(
  'adverts/updateAdvert',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/updateAdvert/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to update advert' });
    }
  }
);

/* ------------------ Slice ------------------ */

const advertSlice = createSlice({
  name: 'advert',
  initialState: {
    advert: null,
    fetchStatus: 'idle',    // For getAdvertById
    createStatus: 'idle',   // For addAdvert
    updateStatus: 'idle',   // For updateAdvert
    success: null,
    message: null,
    error: null,
    errors: [], // validation errors
  },
  reducers: {
    clearAdvert(state) {
      state.advert = null;
      state.fetchStatus = 'idle';
      state.createStatus = 'idle';
      state.updateStatus = 'idle';
      state.success = null;
      state.message = null;
      state.error = null;
      state.errors = [];
    },
    clearErrorsAndStatus(state) {
      // Preserve advert data
      state.fetchStatus = 'idle';
      state.createStatus = 'idle';
      state.updateStatus = 'idle';
      state.success = null;
      state.message = null;
      state.error = null;
      state.errors = [];
    }
  },
  extraReducers: (builder) => {
    // Fetch advert cases
    builder
      .addCase(getAdvertById.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
        state.errors = [];
        state.message = null;
        state.success = null;
      })
      .addCase(getAdvertById.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.success = action.payload.success ?? true;
        state.message = action.payload.message || 'Success';
        state.advert = action.payload.data?.advert || null;
      })
      .addCase(getAdvertById.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.success = action.payload?.success ?? false;
        state.message = action.payload?.message || 'Request failed';
        state.error = action.payload?.error || null;
        state.errors = action.payload?.errors || [];
      })

      // Add advert cases
      .addCase(addAdvert.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
        state.errors = [];
        state.message = null;
        state.success = null;
      })
      .addCase(addAdvert.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.success = action.payload.success ?? true;
        state.message = action.payload.message || 'Success';
        state.advert = action.payload.data?.advert || null;
      })
      .addCase(addAdvert.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.success = action.payload?.success ?? false;
        state.message = action.payload?.message || 'Request failed';
        state.error = action.payload?.error || null;
        state.errors = action.payload?.errors || [];
      })

      // Update advert cases
      .addCase(updateAdvert.pending, (state) => {
        state.updateStatus = 'loading';
        state.error = null;
        state.errors = [];
        state.message = null;
        state.success = null;
      })
      .addCase(updateAdvert.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.success = action.payload.success ?? true;
        state.message = action.payload.message || 'Success';
        state.advert = action.payload.data?.advert || null;
      })
      .addCase(updateAdvert.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.success = action.payload?.success ?? false;
        state.message = action.payload?.message || 'Request failed';
        state.error = action.payload?.error || null;
        state.errors = action.payload?.errors || [];
      });
  },
});

export const { clearAdvert, clearErrorsAndStatus } = advertSlice.actions;
export default advertSlice.reducer;