import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/adverts`; // Base URL

// Thunk to delete an advert
export const deleteUserAdvert = createAsyncThunk(
  'userAdverts/deleteUserAdvert',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/delete/${id}`, {
        withCredentials: true, // Ensures cookies are sent for authentication
      });

      return id; // Return deleted advert ID for Redux state update
    } catch (error) {
      console.error('Delete Advert Thunk - Error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete advert');
    }
  }
);

// Thunk to fetch an advert by ID for editing
export const editAdvertById = createAsyncThunk(
  'userAdverts/fetchAdvertById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/edit/${id}`, {
        withCredentials: true,
      });
      return response.data.advert;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch advert details.');
    }
  }
);

// Thunk to update an advert by ID
export const updateAdvertById = createAsyncThunk(
  'userAdverts/updateAdvertById',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/edit/${id}`, data, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data; // { success: true, message: '', advert: {...} }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update advert.');
    }
  }
);

const userAdvertSlice = createSlice({
  name: 'userAdverts',
  initialState: {
    adverts: [], // List of adverts
    currentAdvert: null, // The advert being edited
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null, // Error message
  },
  reducers: {
    resetError(state) {
      state.error = null;
    },
    clearCurrentAdvert(state) {
      state.currentAdvert = null; // Clear the current advert
    },
  },
  extraReducers: (builder) => {
    builder
      // Delete Advert
      .addCase(deleteUserAdvert.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteUserAdvert.fulfilled, (state, action) => {
        state.status = 'success';
        state.adverts = state.adverts.filter((advert) => advert._id !== action.payload);
      })
      .addCase(deleteUserAdvert.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to delete advert';
      })

      // Fetch Advert By Id
      .addCase(editAdvertById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(editAdvertById.fulfilled, (state, action) => {
        state.status = 'success';
        state.currentAdvert = action.payload;
      })
      .addCase(editAdvertById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update Advert By Id
      .addCase(updateAdvertById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateAdvertById.fulfilled, (state, action) => {
        state.status = 'success';
        if (action.payload.advert) {
          state.currentAdvert = action.payload.advert;
        }
      })
      .addCase(updateAdvertById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { resetError, clearCurrentAdvert } = userAdvertSlice.actions;
export default userAdvertSlice.reducer;
