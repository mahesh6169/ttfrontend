import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/advertsV2`;

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
  name: 'advertsV2',
  initialState: {
    advert: null,
    status: 'idle',
    success: null,
    message: null,
    error: null,
    errors: [], // validation errors
  },
  reducers: {
    clearAdvert(state) {
      state.advert = null;
      state.status = 'idle';
      state.success = null;
      state.message = null;
      state.error = null;
      state.errors = [];
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.status = 'loading';
      state.error = null;
      state.errors = [];
      state.message = null;
      state.success = null;
    };

    const handleFulfilled = (state, action) => {
      state.status = 'succeeded';
      state.success = action.payload.success ?? true;
      state.message = action.payload.message || 'Success';
      state.advert = action.payload.data?.advert || null;
    };

    const handleRejected = (state, action) => {
        state.status = 'failed';
        state.success = action.payload?.success ?? false;
        state.message = action.payload?.message || 'Request failed';
        state.error = action.payload?.error || null;
        state.errors = action.payload?.errors || [];
      };

    builder
      .addCase(getAdvertById.pending, handlePending)
      .addCase(getAdvertById.fulfilled, handleFulfilled)
      .addCase(getAdvertById.rejected, handleRejected)

      .addCase(addAdvert.pending, handlePending)
      .addCase(addAdvert.fulfilled, handleFulfilled)
      .addCase(addAdvert.rejected, handleRejected)

      .addCase(updateAdvert.pending, handlePending)
      .addCase(updateAdvert.fulfilled, handleFulfilled)
      .addCase(updateAdvert.rejected, handleRejected);
  },
});

export const { clearAdvert } = advertSlice.actions;
export default advertSlice.reducer;
