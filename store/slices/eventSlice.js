import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Thunks

export const addEvent = createAsyncThunk(
  'events/addEvent',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/events/addevent`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        return response.data.event;
      } else {
        return rejectWithValue(response.data.message || 'Failed to add event');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add event'
      );
    }
  }
);


export const fetchAllEvents = createAsyncThunk('events/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/events/fetchAllEvents`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
  }
});


export const fetchEventById = createAsyncThunk('events/fetchById', async (eventId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/events/views/${eventId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch event');
  }
});

export const updateEventById = createAsyncThunk(
  'events/updateEvent',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/events/update/${id}`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );
      return response.data.event;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update event'
      );
    }
  }
);


export const fetchMyEvents = createAsyncThunk(
  'events/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/events/mine`, {
        withCredentials: true,
      });

      if (Array.isArray(data)) {
        return data;
      }

      return rejectWithValue('Invalid response format');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch your events'
      );
    }
  }
);


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
    selectedEvent: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder

      // Add Event
      .addCase(addEvent.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.myEvents.push(action.payload);
        state.allEvents.push(action.payload);
      })
      .addCase(addEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch single event by ID
      .addCase(fetchEventById.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.selectedEvent = null;
      })

      .addCase(updateEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEvent = action.payload;
      })
      .addCase(updateEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      


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
