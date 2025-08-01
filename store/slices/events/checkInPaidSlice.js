// store/slices/events/checkInPaidSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Fetch user's managed paid events
export const fetchManagedPaidEvents = createAsyncThunk(
  'checkInPaid/fetchManagedEvents',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching managed paid events from:', `${API_BASE_URL}/events/user/managed/paid`);
      const response = await axios.get(
        `${API_BASE_URL}/events/user/managed/paid`,
        { withCredentials: true }
      );
      console.log('Managed paid events response:', response.data);
      return response.data.events;
    } catch (error) {
      console.error('Error fetching managed paid events:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch managed events'
      );
    }
  }
);

// Fetch attendees for a specific paid event
export const fetchPaidEventAttendees = createAsyncThunk(
  'checkInPaid/fetchAttendees',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/events/${eventId}/paid/attendees`,
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
export const checkInPaidAttendee = createAsyncThunk(
  'checkInPaid/checkIn',
  async ({ eventId, ticketId, attendeeId }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/events/${eventId}/paid/checkin/${ticketId}`,
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
export const undoCheckInPaidAttendee = createAsyncThunk(
  'checkInPaid/undoCheckIn',
  async ({ eventId, ticketId, attendeeId }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/events/${eventId}/paid/undo-checkin/${ticketId}`,
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

// Bulk check-in/out for a ticket
export const bulkCheckInPaidTicket = createAsyncThunk(
  'checkInPaid/bulkCheckIn',
  async ({ eventId, ticketId, checkIn }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/events/${eventId}/paid/bulk-checkin/${ticketId}`,
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
  attendees: [], // Array of ticket objects with nested attendees
  searchTerm: '',
  stats: {
    totalTickets: 0,
    totalAttendees: 0,
    checkedInAttendees: 0,
    percentageCheckedIn: 0,
    revenue: 0,
  },
  loading: false,
  attendeesLoading: false,
  actionLoading: false,
  error: null,
};

const checkInPaidSlice = createSlice({
  name: 'checkInPaid',
  initialState,
  reducers: {
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload;
      state.attendees = [];
      state.searchTerm = '';
      state.stats = initialState.stats;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    clearCheckInData: (state) => {
      state.selectedEvent = null;
      state.attendees = [];
      state.searchTerm = '';
      state.stats = initialState.stats;
      state.error = null;
    },
    updateLocalCheckIn: (state, action) => {
      const { ticketId, attendeeId, checkedIn, checkInTime } = action.payload;
      
      // Find the ticket
      const ticket = state.attendees.find(t => t._id === ticketId);
      if (ticket) {
        // Find the attendee
        const attendee = ticket.attendees.find(a => a._id === attendeeId);
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
      
      // Find the ticket
      const ticket = state.attendees.find(t => t._id === ticketId);
      if (ticket) {
        // Update all attendees
        ticket.attendees.forEach(attendee => {
          attendee.checkedIn = checkedIn;
          attendee.checkInTime = checkedIn ? checkInTime : null;
        });
        
        // Update ticket status
        ticket.status = checkedIn ? 'checkedin' : 'purchased';
        
        // Update stats
        state.stats = calculateStats(state.attendees);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch managed events
      .addCase(fetchManagedPaidEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagedPaidEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.managedEvents = action.payload;
      })
      .addCase(fetchManagedPaidEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch attendees
      .addCase(fetchPaidEventAttendees.pending, (state) => {
        state.attendeesLoading = true;
        state.error = null;
      })
      .addCase(fetchPaidEventAttendees.fulfilled, (state, action) => {
        state.attendeesLoading = false;
        state.attendees = action.payload.registrations || [];
        state.stats = calculateStats(state.attendees);
      })
      .addCase(fetchPaidEventAttendees.rejected, (state, action) => {
        state.attendeesLoading = false;
        state.error = action.payload;
      })
      
      // Check in attendee
      .addCase(checkInPaidAttendee.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(checkInPaidAttendee.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update will be handled by updateLocalCheckIn
      })
      .addCase(checkInPaidAttendee.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Undo check-in
      .addCase(undoCheckInPaidAttendee.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(undoCheckInPaidAttendee.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update will be handled by updateLocalCheckIn
      })
      .addCase(undoCheckInPaidAttendee.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Bulk check-in
      .addCase(bulkCheckInPaidTicket.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(bulkCheckInPaidTicket.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update will be handled by updateLocalBulkCheckIn
      })
      .addCase(bulkCheckInPaidTicket.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

// Helper function to calculate stats
const calculateStats = (tickets) => {
  let totalTickets = tickets.length;
  let totalAttendees = 0;
  let checkedInAttendees = 0;
  let revenue = 0;
  
  tickets.forEach(ticket => {
    // Count attendees
    ticket.attendees.forEach(attendee => {
      totalAttendees++;
      if (attendee.checkedIn) {
        checkedInAttendees++;
      }
    });
    
    // Calculate revenue
    if (ticket.priceDetails?.totalPrice) {
      revenue += ticket.priceDetails.totalPrice;
    }
  });
  
  const percentageCheckedIn = totalAttendees > 0 
    ? Math.round((checkedInAttendees / totalAttendees) * 100)
    : 0;
  
  return {
    totalTickets,
    totalAttendees,
    checkedInAttendees,
    percentageCheckedIn,
    revenue,
  };
};

export const {
  setSelectedEvent,
  setSearchTerm,
  clearCheckInData,
  updateLocalCheckIn,
  updateLocalBulkCheckIn,
} = checkInPaidSlice.actions;

export default checkInPaidSlice.reducer;