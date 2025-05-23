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
        `${API_BASE_URL}/events/${eventId}/register-free`,
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
// SLICE DEFINITION
// ========================================

const freeEventSlice = createSlice({
  name: 'freeEvents',
  initialState: {
    // Registration state
    currentRegistration: null,
    
    // Status tracking
    registrationStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    
    // Error handling
    registrationError: null,
    
    // Success message
    successMessage: '',
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