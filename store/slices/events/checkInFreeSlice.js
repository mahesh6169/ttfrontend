// store/slices/events/checkInFreeSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Fetch user's managed free events
export const fetchManagedFreeEvents = createAsyncThunk(
  'checkInFree/fetchManagedEvents',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching managed events from:', `${API_BASE_URL}/events/user/managed/free`);
      const response = await axios.get(
        `${API_BASE_URL}/events/user/managed/free`,
        { withCredentials: true }
      );
      console.log('Managed events response:', response.data);
      return response.data.events;
    } catch (error) {
      console.error('Error fetching managed events:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch managed events'
      );
    }
  }
);

// Fetch attendees for a specific event
export const fetchEventAttendees = createAsyncThunk(
  'checkInFree/fetchAttendees',
  async ({ eventId, page = 1, limit = 20, search = '' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/events/${eventId}/free/attendees?${params}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch attendees'
      );
    }
  }
);

// Check in an attendee
export const checkInAttendee = createAsyncThunk(
  'checkInFree/checkIn',
  async ({ eventId, ticketId, attendeeId }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/events/${eventId}/free/checkin/${ticketId}`,
        { attendeeId },
        { withCredentials: true }
      );
      return { ticketId, attendeeId, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to check in attendee'
      );
    }
  }
);

// Undo check-in for an attendee
export const undoCheckInAttendee = createAsyncThunk(
  'checkInFree/undoCheckIn',
  async ({ eventId, ticketId, attendeeId }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/events/${eventId}/free/undo-checkin/${ticketId}`,
        { attendeeId },
        { withCredentials: true }
      );
      return { ticketId, attendeeId, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to undo check-in'
      );
    }
  }
);

// Bulk check-in/out for a registration
export const bulkCheckInRegistration = createAsyncThunk(
  'checkInFree/bulkCheckIn',
  async ({ eventId, ticketId, checkIn }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/events/${eventId}/free/bulk-checkin/${ticketId}`,
        { checkIn },
        { withCredentials: true }
      );
      return { ticketId, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to perform bulk check-in'
      );
    }
  }
);

const initialState = {
  managedEvents: [],
  selectedEvent: null,
  attendees: [], // Array of registration objects with nested attendees
  searchTerm: '',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  },
  stats: {
    totalRegistrations: 0,
    totalAttendees: 0,
    checkedInAttendees: 0,
    percentageCheckedIn: 0,
  },
  loading: false,
  attendeesLoading: false,
  actionLoading: false,
  error: null,
};

const checkInFreeSlice = createSlice({
  name: 'checkInFree',
  initialState,
  reducers: {
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload;
      state.attendees = [];
      state.searchTerm = '';
      state.stats = initialState.stats;
      state.pagination = initialState.pagination;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    clearCheckInData: (state) => {
      state.selectedEvent = null;
      state.attendees = [];
      state.searchTerm = '';
      state.stats = initialState.stats;
      state.pagination = initialState.pagination;
      state.error = null;
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    updateLocalCheckIn: (state, action) => {
      const { ticketId, attendeeId, checkedIn, checkInTime } = action.payload;
      
      // Find the registration
      const registration = state.attendees.find(r => r._id === ticketId);
      if (registration) {
        // Find the attendee
        const attendee = registration.attendees.find(a => a._id === attendeeId);
        if (attendee) {
          attendee.checkedIn = checkedIn;
          attendee.checkInTime = checkInTime;
          
          // Update stats
          state.stats = calculateStats(state.attendees);
        }
      }
    },
    updateLocalBulkCheckIn: (state, action) => {
      const { ticketId, checkedIn, checkInTime } = action.payload;
      
      // Find the registration
      const registration = state.attendees.find(r => r._id === ticketId);
      if (registration) {
        // Update all attendees
        registration.attendees.forEach(attendee => {
          attendee.checkedIn = checkedIn;
          attendee.checkInTime = checkedIn ? checkInTime : null;
        });
        
        // Update registration status
        registration.status = checkedIn ? 'checkedin' : 'registered';
        
        // Update stats
        state.stats = calculateStats(state.attendees);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch managed events
      .addCase(fetchManagedFreeEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagedFreeEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.managedEvents = action.payload;
      })
      .addCase(fetchManagedFreeEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch attendees
      .addCase(fetchEventAttendees.pending, (state) => {
        state.attendeesLoading = true;
        state.error = null;
      })
      .addCase(fetchEventAttendees.fulfilled, (state, action) => {
        state.attendeesLoading = false;
        state.attendees = action.payload.registrations || [];
        state.pagination = action.payload.pagination || initialState.pagination;
        // Stats should be calculated from total count, not just current page
        state.stats = {
          ...state.stats,
          totalRegistrations: action.payload.pagination?.totalCount || 0,
          // Calculate stats for current page attendees
          ...calculateStats(state.attendees)
        };
      })
      .addCase(fetchEventAttendees.rejected, (state, action) => {
        state.attendeesLoading = false;
        state.error = action.payload;
      })
      
      // Check in attendee
      .addCase(checkInAttendee.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(checkInAttendee.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update will be handled by updateLocalCheckIn
      })
      .addCase(checkInAttendee.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Undo check-in
      .addCase(undoCheckInAttendee.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(undoCheckInAttendee.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update will be handled by updateLocalCheckIn
      })
      .addCase(undoCheckInAttendee.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Bulk check-in
      .addCase(bulkCheckInRegistration.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(bulkCheckInRegistration.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update will be handled by updateLocalBulkCheckIn
      })
      .addCase(bulkCheckInRegistration.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

// Helper function to calculate stats
const calculateStats = (attendees) => {
  let totalRegistrations = attendees.length;
  let totalAttendees = 0;
  let checkedInAttendees = 0;
  
  attendees.forEach(registration => {
    registration.attendees.forEach(attendee => {
      totalAttendees++;
      if (attendee.checkedIn) {
        checkedInAttendees++;
      }
    });
  });
  
  const percentageCheckedIn = totalAttendees > 0 
    ? Math.round((checkedInAttendees / totalAttendees) * 100)
    : 0;
  
  return {
    totalRegistrations,
    totalAttendees,
    checkedInAttendees,
    percentageCheckedIn,
  };
};

export const {
  setSelectedEvent,
  setSearchTerm,
  clearCheckInData,
  updateLocalCheckIn,
  updateLocalBulkCheckIn,
  setCurrentPage,
} = checkInFreeSlice.actions;

export default checkInFreeSlice.reducer;