import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/adverts/manage`;

// ✅ Async Thunk to Fetch Manage Adverts
export const getManageAdverts = createAsyncThunk(
  'adminManageAdverts/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { page, limit } = getState().adminManageAdvert;

      const response = await axios.get(API_BASE_URL, {
        params: { page, limit },
        withCredentials: true,
      });

      return response.data;
    } catch (err) {
      console.error("❌ Admin Adverts Fetch Error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch adverts');
    }
  }
);

export const deleteAdvertById = createAsyncThunk(
  'adminManageAdverts/deleteAdvertById',
  async (advertId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/adverts/byid/${advertId}`,
        { withCredentials: true }
      );
      return { advertId };
    } catch (err) {
      console.error("❌ Admin Delete Advert Error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || 'Failed to delete advert');
    }
  }
);

export const sendAdvertReminder = createAsyncThunk(
  'adminManageAdverts/sendAdvertReminder',
  async ({ advertId, type }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/adverts/remind/${advertId}?type=${type}`,
        {},
        { withCredentials: true }
      );
      
      // Return more data from the response if available
      return { 
        advertId, 
        type, 
        message: response.data.message,
        // If your API returns the updated advert, include it here
        updatedAdvert: response.data.advert 
      };
    } catch (err) {
      console.error(`❌ Reminder ${type} Email Error:`, err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || 'Failed to send reminder');
    }
  }
);



// ✅ Slice
const adminManageAdvertSlice = createSlice({
  name: 'adminManageAdvert',
  initialState: {
    manageAdverts: [],
    page: 1,
    limit: 10,
    meta: {},
    status: 'idle',
    error: null,
  },
  reducers: {
    updateAdminAdvertFilter: (state, action) => {
      Object.assign(state, action.payload);
    },
    resetManageAdvertsState: (state) => {
      state.manageAdverts = [];
      state.page = 1;
      state.limit = 10;
      state.meta = {};
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getManageAdverts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getManageAdverts.fulfilled, (state, action) => {
        state.status = 'success';
        state.manageAdverts = action.payload.adverts;
        state.meta = action.payload.meta;
      })
      .addCase(getManageAdverts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
       // 🗑️ Handle deleteAdvertById
    .addCase(deleteAdvertById.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(deleteAdvertById.fulfilled, (state, action) => {
      state.status = 'success';
      // Remove the deleted advert from the local state
      state.manageAdverts = state.manageAdverts.filter(ad => ad._id !== action.payload.advertId);
    })
    .addCase(deleteAdvertById.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    })

    .addCase(sendAdvertReminder.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(sendAdvertReminder.fulfilled, (state, action) => {
      state.status = 'success';
    })
    .addCase(sendAdvertReminder.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    });


  },
});

export const { updateAdminAdvertFilter, resetManageAdvertsState } = adminManageAdvertSlice.actions;
export default adminManageAdvertSlice.reducer;
