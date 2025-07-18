// store/slices/events/freeEventSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ========================================
// ASYNC THUNK FOR FREE EVENT REGISTRATION
// ========================================

export const registerForFreeEvent = createAsyncThunk(
  'freeEvents/registerForFreeEvent',
  async ({ eventId, registrationData }, { rejectWithValue }) => {
    try {
      console.log("🎫 Frontend: Calling registration API", { eventId, registrationData });
      
      const response = await axios.post(
        `${API_BASE_URL}/events/${eventId}/free/register`,
        registrationData,
        { withCredentials: true }
      );

      console.log("✅ Frontend: Registration API response", response.data);
      return response.data;
      
    } catch (error) {
      console.error("❌ Frontend: Registration API error", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);


// ========================================
// ASYNC THUNK FOR FREE EVENT UNREGISTER
// ========================================
export const unregisterFromFreeEvent = createAsyncThunk(
  'freeEvents/unregisterFromFreeEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      console.log("🗑️ Frontend: Calling unregister API", { eventId });

      const response = await axios.delete(
        `${API_BASE_URL}/events/${eventId}/free/unregister`,
        { withCredentials: true }
      );

      console.log("✅ Frontend: Unregister API response", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Frontend: Unregister API error", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 'Unregistration failed'
      );
    }
  }
);

// ========================================
// ASYNC THUNK TO CHECK FREE EVENT REGISTRATION STATUS
// ========================================
export const checkRegistrationStatus = createAsyncThunk(
  'freeEvents/checkRegistrationStatus',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/events/${eventId}/free/registration-status`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to check registration status'
      );
    }
  }
);


// ========================================
// ASYNC THUNK TO FETCH MY FREE REGISTRATIONS
// ========================================
export const fetchMyFreeRegistrations = createAsyncThunk(
  'freeEvents/fetchMyFreeRegistrations',
  async (eventIds = null, { rejectWithValue }) => {
    try {
      let url = `${API_BASE_URL}/events/free/my-free-registrations`;
      if (eventIds && Array.isArray(eventIds) && eventIds.length > 0) {
        url += `?eventIds=${eventIds.join(',')}`;
      }
      const response = await axios.get(url, { withCredentials: true });
      return response.data.registrations;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch registrations'
      );
    }
  }
);

// Check in an individual attendee
export const checkinFreeEvent = createAsyncThunk(
  'freeEvents/checkinFreeEvent',
  async ({ eventId, ticketId, attendeeId }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/events/${eventId}/free/checkin/${ticketId}`,
        { attendeeId }, // send as body, assuming backend expects attendeeId to check in
        { withCredentials: true }
      );
      return { ticketId, attendeeId, ticket: response.data.ticket }; // returning updated ticket and IDs
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Check-in failed'
      );
    }
  }
);

// Thunk for undoing attendee check-in
export const undoCheckinFreeEvent = createAsyncThunk(
  'freeEvents/undoCheckinFreeEvent',
  async ({ eventId, ticketId, attendeeId }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/events/${eventId}/free/undo-checkin/${ticketId}`,
        { attendeeId },
        { withCredentials: true }
      );
      return { ticketId, attendeeId, ticket: response.data.ticket };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Undo check-in failed'
      );
    }
  }
);



// ========================================
// SLICE DEFINITION
// ========================================

const freeEventSlice = createSlice({
  name: 'freeEvents',
  initialState: {
    currentRegistration: null,    
    registrationStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    registrationError: null,
    successMessage: '',

    myFreeRegistrations: [],
    myFreeRegistrationsStatus: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
    myFreeRegistrationsError: null,

    // manage check-in
    checkInStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    checkInError: null,



  },
  
  reducers: {
    // Clear registration error
    clearRegistrationError: (state) => {
      state.registrationError = null;
    },
    
    // Clear current registration
    clearCurrentRegistration: (state) => {
      state.currentRegistration = null;
    },
    
    // Clear success message
    clearSuccessMessage: (state) => {
      state.successMessage = '';
    },
    
    // Reset all registration state
    resetRegistrationState: (state) => {
      state.currentRegistration = null;
      state.registrationStatus = 'idle';
      state.registrationError = null;
      state.successMessage = '';
    },


  },
  
  extraReducers: (builder) => {
    builder
      // ========================================
      // REGISTER FOR FREE EVENT
      // ========================================
      .addCase(registerForFreeEvent.pending, (state) => {
        console.log("⏳ Redux: Registration pending");
        state.registrationStatus = 'loading';
        state.registrationError = null;
        state.successMessage = '';
      })
      .addCase(registerForFreeEvent.fulfilled, (state, action) => {
        console.log("✅ Redux: Registration succeeded", action.payload);
        state.registrationStatus = 'succeeded';
        state.currentRegistration = action.payload.registration;
        state.successMessage = action.payload.message;
      })
      .addCase(registerForFreeEvent.rejected, (state, action) => {
        console.log("❌ Redux: Registration failed", action.payload);
        state.registrationStatus = 'failed';
        state.registrationError = action.payload;
      })

      // ========================================
      // UNREGISTER FROM FREE EVENT
      // ========================================
      // Add below your registerForFreeEvent cases in extraReducers
.addCase(unregisterFromFreeEvent.pending, (state) => {
  state.registrationStatus = 'loading';
  state.registrationError = null;
  state.successMessage = '';
})
.addCase(unregisterFromFreeEvent.fulfilled, (state, action) => {
  state.registrationStatus = 'succeeded';
  state.currentRegistration = null; // User is now unregistered
  state.successMessage = action.payload.message;
})
.addCase(unregisterFromFreeEvent.rejected, (state, action) => {
  state.registrationStatus = 'failed';
  state.registrationError = action.payload;
})

// ========================================
// CHECK REGISTRATION STATUS
// ========================================
.addCase(checkRegistrationStatus.pending, (state) => {
  state.registrationStatus = 'loading';
  state.registrationError = null;
})
.addCase(checkRegistrationStatus.fulfilled, (state, action) => {
  if (action.payload.registered) {
    state.currentRegistration = action.payload.registration;
    state.registrationStatus = 'succeeded';
  } else {
    state.currentRegistration = null;
    state.registrationStatus = 'idle'; // or 'not_registered', your choice
  }
})
.addCase(checkRegistrationStatus.rejected, (state, action) => {
  state.registrationStatus = 'failed';
  state.registrationError = action.payload;
})

// ========================================
// FETCH ALL MY FREE EVENT REGISTRATIONS
// ========================================
.addCase(fetchMyFreeRegistrations.pending, (state) => {
  state.myFreeRegistrationsStatus = 'loading';
  state.myFreeRegistrationsError = null;
})
.addCase(fetchMyFreeRegistrations.fulfilled, (state, action) => {
  state.myFreeRegistrationsStatus = 'succeeded';
  state.myFreeRegistrations = action.payload;
})
.addCase(fetchMyFreeRegistrations.rejected, (state, action) => {
  state.myFreeRegistrationsStatus = 'failed';
  state.myFreeRegistrationsError = action.payload;
})

// ================================
// CHECK-IN FREE EVENT ATTENDEE
// ================================
.addCase(checkinFreeEvent.pending, (state) => {
  state.checkinStatus = 'loading';
  state.checkinError = null;
})
.addCase(checkinFreeEvent.fulfilled, (state, action) => {
  state.checkinStatus = 'succeeded';
  // Check-in successful
})
.addCase(checkinFreeEvent.rejected, (state, action) => {
  state.checkinStatus = 'failed';
  state.checkinError = action.payload;
})

// ================================
// Undo CHECK-IN FREE EVENT ATTENDEE
// ================================
.addCase(undoCheckinFreeEvent.pending, (state) => {
  state.checkinStatus = 'loading';
  state.checkinError = null;
})
.addCase(undoCheckinFreeEvent.fulfilled, (state, action) => {
  state.checkinStatus = 'succeeded';
  // Undo check-in successful
})
.addCase(undoCheckinFreeEvent.rejected, (state, action) => {
  state.checkinStatus = 'failed';
  state.checkinError = action.payload;
});



  },
});

// ========================================
// EXPORT ACTIONS AND REDUCER
// ========================================

export const {
  clearRegistrationError,
  clearCurrentRegistration,
  clearSuccessMessage,
  resetRegistrationState,
} = freeEventSlice.actions;

export default freeEventSlice.reducer;