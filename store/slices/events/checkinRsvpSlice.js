// store/slices/events/checkinRsvpSlice.js
//
// Dedicated slice for the RSVP check-in redesign pages (/users/profile/checkinrsvp). It supports
// paged "Load more" accumulation, server-side All/Pending/Done tabs, and event-wide stats - things
// the legacy checkInFreeSlice (still driving the old /checkInFree page) does not do. Kept separate
// so the doomed legacy page is never touched; it reuses the same backend endpoints.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchManagedFreeEvents = createAsyncThunk(
  'checkinRsvp/fetchManagedEvents',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/events/user/managed/free`, { withCredentials: true });
      return res.data.events;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch managed events');
    }
  }
);

// Fetch one page of attendees. page===1 replaces the list; page>1 appends (Load more).
// status is 'all' | 'pending' | 'done' (the All/Pending/Done tabs, filtered server-side).
export const fetchAttendeesPage = createAsyncThunk(
  'checkinRsvp/fetchAttendeesPage',
  async ({ eventId, page = 1, limit = 50, search = '', status = 'all' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      const res = await axios.get(`${API_BASE_URL}/events/${eventId}/free/attendees?${params}`, { withCredentials: true });
      return res.data; // { registrations, stats, pagination }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendees');
    }
  }
);

export const checkInAttendee = createAsyncThunk(
  'checkinRsvp/checkIn',
  async ({ eventId, ticketId, attendeeId }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/events/${eventId}/free/checkin/${ticketId}`, { attendeeId }, { withCredentials: true });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check in attendee');
    }
  }
);

export const undoCheckInAttendee = createAsyncThunk(
  'checkinRsvp/undoCheckIn',
  async ({ eventId, ticketId, attendeeId }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/events/${eventId}/free/undo-checkin/${ticketId}`, { attendeeId }, { withCredentials: true });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to undo check-in');
    }
  }
);

export const bulkCheckInRegistration = createAsyncThunk(
  'checkinRsvp/bulkCheckIn',
  async ({ eventId, ticketId, checkIn }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/events/${eventId}/free/bulk-checkin/${ticketId}`, { checkIn }, { withCredentials: true });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to perform bulk check-in');
    }
  }
);

export const cancelRegistration = createAsyncThunk(
  'checkinRsvp/cancelRegistration',
  async ({ eventId, ticketId }, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/events/${eventId}/free/registration/${ticketId}`, { withCredentials: true });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel registration');
    }
  }
);

const emptyPagination = { currentPage: 1, totalPages: 1, totalCount: 0, limit: 50, hasNextPage: false, hasPrevPage: false };
const emptyStats = { totalRegistrations: 0, totalAttendees: 0, checkedInAttendees: 0 };

const initialState = {
  managedEvents: [],
  managedLoading: false,
  rows: [],
  pagination: emptyPagination,
  stats: emptyStats,
  listLoading: false,   // first page / refetch
  loadingMore: false,   // Load more (page > 1)
  actionLoading: false, // a check-in / cancel in flight
  error: null,
};

const checkinRsvpSlice = createSlice({
  name: 'checkinRsvp',
  initialState,
  reducers: {
    resetPerEvent: (state) => {
      state.rows = [];
      state.pagination = emptyPagination;
      state.stats = emptyStats;
      state.error = null;
    },
    updateLocalCheckIn: (state, action) => {
      const { ticketId, attendeeId, checkedIn, checkInTime } = action.payload;
      const reg = state.rows.find((r) => r._id === ticketId);
      if (!reg) return;
      const att = reg.attendees.find((a) => a._id === attendeeId);
      if (!att) return;
      if (att.checkedIn !== checkedIn) state.stats.checkedInAttendees += checkedIn ? 1 : -1;
      att.checkedIn = checkedIn;
      att.checkInTime = checkInTime;
      reg.status = reg.attendees.every((a) => a.checkedIn) ? 'checkedin' : 'registered';
    },
    updateLocalBulkCheckIn: (state, action) => {
      const { ticketId, checkedIn, checkInTime } = action.payload;
      const reg = state.rows.find((r) => r._id === ticketId);
      if (!reg) return;
      const alreadyChecked = reg.attendees.filter((a) => a.checkedIn).length;
      const total = reg.attendees.length;
      state.stats.checkedInAttendees += checkedIn ? total - alreadyChecked : -alreadyChecked;
      reg.attendees.forEach((a) => { a.checkedIn = checkedIn; a.checkInTime = checkedIn ? checkInTime : null; });
      reg.status = checkedIn ? 'checkedin' : 'registered';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedFreeEvents.pending, (state) => { state.managedLoading = true; state.error = null; })
      .addCase(fetchManagedFreeEvents.fulfilled, (state, action) => { state.managedLoading = false; state.managedEvents = action.payload; })
      .addCase(fetchManagedFreeEvents.rejected, (state, action) => { state.managedLoading = false; state.error = action.payload; })

      .addCase(fetchAttendeesPage.pending, (state, action) => {
        if ((action.meta.arg.page || 1) > 1) state.loadingMore = true;
        else state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendeesPage.fulfilled, (state, action) => {
        state.listLoading = false;
        state.loadingMore = false;
        const page = action.meta.arg.page || 1;
        const registrations = action.payload.registrations || [];
        if (page > 1) {
          // Defensive dedupe: never append a row already in the list (a duplicate _id would break
          // React keys). The stable server sort should prevent overlap; this is belt-and-suspenders.
          const seen = new Set(state.rows.map((r) => r._id));
          state.rows = [...state.rows, ...registrations.filter((r) => !seen.has(r._id))];
        } else {
          state.rows = registrations;
        }
        state.pagination = action.payload.pagination || emptyPagination;
        state.stats = action.payload.stats || emptyStats;
      })
      .addCase(fetchAttendeesPage.rejected, (state, action) => {
        state.listLoading = false; state.loadingMore = false; state.error = action.payload;
      })

      .addCase(checkInAttendee.pending, (state) => { state.actionLoading = true; })
      .addCase(checkInAttendee.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(checkInAttendee.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; })
      .addCase(undoCheckInAttendee.pending, (state) => { state.actionLoading = true; })
      .addCase(undoCheckInAttendee.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(undoCheckInAttendee.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; })
      .addCase(bulkCheckInRegistration.pending, (state) => { state.actionLoading = true; })
      .addCase(bulkCheckInRegistration.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(bulkCheckInRegistration.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; })
      .addCase(cancelRegistration.pending, (state) => { state.actionLoading = true; })
      .addCase(cancelRegistration.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(cancelRegistration.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
  },
});

export const { resetPerEvent, updateLocalCheckIn, updateLocalBulkCheckIn } = checkinRsvpSlice.actions;
export default checkinRsvpSlice.reducer;
