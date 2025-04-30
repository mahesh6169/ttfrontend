import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/events`;

// ✅ Async Thunk to Fetch Manage Events
export const getManageEvents = createAsyncThunk(
  'adminManageEvents/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { page, limit } = getState().adminManageEvent;
      const response = await axios.get(`${API_BASE_URL}/manage`, {
        params: { page, limit },
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      console.error("❌ Admin Events Fetch Error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch events');
    }
  }
);

// ✅ Send Reminder
export const sendEventReminder = createAsyncThunk(
    'adminManageEvents/sendEventReminder',
    async ({ eventId, type }, { rejectWithValue }) => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/remind/${eventId}`,
          {type },
          { withCredentials: true }
        );
        return { eventId, message: response.data.message };
      } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to send reminder');
      }
    }
  );

  // ✅ Delete Event
export const deleteEventById = createAsyncThunk(
    'adminManageEvents/deleteEventById',
    async (eventId, { rejectWithValue }) => {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/byid/${eventId}`,
          { withCredentials: true }
        );
        return { eventId };
      } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to delete event');
      }
    }
  );
  

// ✅ Slice
const adminManageEventSlice = createSlice({
  name: 'adminManageEvent',
  initialState: {
    manageEvents: [],
    page: 1,
    limit: 10,
    meta: {},
    status: 'idle',
    error: null,
  },
  reducers: {
    updateAdminEventFilter: (state, action) => {
      Object.assign(state, action.payload);
    },
    resetManageEventsState: (state) => {
      state.manageEvents = [];
      state.page = 1;
      state.limit = 10;
      state.meta = {};
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getManageEvents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getManageEvents.fulfilled, (state, action) => {
        state.status = 'success';
        state.manageEvents = action.payload.events;
        state.meta = action.payload.meta;
      })
      .addCase(getManageEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(sendEventReminder.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(sendEventReminder.fulfilled, (state, action) => {
        state.status = 'success';
        const event = state.manageEvents.find(e => e._id === action.payload.eventId);
        if (event) event.status = 'notified';
      })
      .addCase(sendEventReminder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      extraReducers: (builder) => {
        builder
          .addCase(getManageEvents.pending, (state) => {
            state.status = 'loading';
            state.error = null;
          })
          .addCase(getManageEvents.fulfilled, (state, action) => {
            state.status = 'success';
            state.manageEvents = action.payload.events;
            state.meta = action.payload.meta;
          })
          .addCase(getManageEvents.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
          })
          .addCase(sendEventReminder.pending, (state) => {
            state.status = 'loading';
          })
          .addCase(sendEventReminder.fulfilled, (state, action) => {
            state.status = 'success';
            const event = state.manageEvents.find(e => e._id === action.payload.eventId);
            if (event) event.status = 'notified';
          })
          .addCase(sendEventReminder.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
          })
          .addCase(deleteEventById.pending, (state) => {
            state.status = 'loading';
          })
          .addCase(deleteEventById.fulfilled, (state, action) => {
            state.status = 'success';
            state.manageEvents = state.manageEvents.filter(e => e._id !== action.payload.eventId);
          })
          .addCase(deleteEventById.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
          });
      }
      
  },
});

export const { updateAdminEventFilter, resetManageEventsState } = adminManageEventSlice.actions;
export default adminManageEventSlice.reducer;
