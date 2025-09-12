import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

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


export const renewUserAdvert = createAsyncThunk(
  'userAdverts/renewUserAdvert',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/renew/${id}`, {}, {
        withCredentials: true,
      });
      return response.data.advert; // Return the updated advert
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to renew advert.'
      );
    }
  }
);

// Add this thunk at the top with the other createAsyncThunk calls
export const fetchMyAdverts = createAsyncThunk(
  'userAdverts/fetchMyAdverts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/myadverts`, {
        withCredentials: true,
      });
      return response.data.adverts;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your adverts');
    }
  }
);

const userAdvertSlice = createSlice({
  name: 'userAdverts',
  initialState: {
    adverts: [], // List of adverts
    currentAdvert: null, // The advert being edited
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    renewStatus: 'idle',
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

    

      // Renew Advert
      .addCase(renewUserAdvert.pending, (state) => {
        state.renewStatus = 'loading';
        state.renewError = null;
      })
      .addCase(renewUserAdvert.fulfilled, (state, action) => {
        state.renewStatus = 'success';
      
        // Update the advert in the list if it's present
        const index = state.adverts.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.adverts[index] = action.payload;
        }
      
        // Optionally also update currentAdvert if it's the one renewed
        if (state.currentAdvert?._id === action.payload._id) {
          state.currentAdvert = action.payload;
        }
      })
      .addCase(renewUserAdvert.rejected, (state, action) => {
        state.renewStatus = 'failed';
        state.renewError = action.payload;
      })
      
      // Fetch My Adverts
      .addCase(fetchMyAdverts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyAdverts.fulfilled, (state, action) => {
        state.status = 'success';
        state.adverts = action.payload;
      })
      .addCase(fetchMyAdverts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { resetError, clearCurrentAdvert } = userAdvertSlice.actions;
export default userAdvertSlice.reducer;
