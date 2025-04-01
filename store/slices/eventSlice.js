import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Thunks
export const fetchAllEvents = createAsyncThunk('events/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/events/fetchAllEvents`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
  }
});

export const fetchMyEvents = createAsyncThunk('events/fetchMine', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/events/mine`, { withCredentials: true });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch your events');
  }
});

export const deleteMyEvent = createAsyncThunk('events/deleteOne', async (eventId, { rejectWithValue }) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/events/${eventId}`, { withCredentials: true });
    return response.data.deletedEventId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
  }
});

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    allEvents: [],
    myEvents: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      // Fetch all events
      .addCase(fetchAllEvents.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.allEvents = action.payload;
      })
      .addCase(fetchAllEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch my events
      .addCase(fetchMyEvents.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.myEvents = action.payload;
      })
      .addCase(fetchMyEvents.rejected, (state, action) => {
        state.loading = false;
        state.myEvents = [];
        state.error = action.payload;
      })

      // Delete event
      .addCase(deleteMyEvent.fulfilled, (state, action) => {
        state.myEvents = state.myEvents.filter(event => event._id !== action.payload);
      });
  },
});

export default eventSlice.reducer;
