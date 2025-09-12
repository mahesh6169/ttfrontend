// store/slices/events/eventCapacitySlice.js

import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ========================================
// ASYNC THUNK FOR FETCHING EVENT CAPACITY
// ========================================

export const fetchEventCapacity = createAsyncThunk(
  'eventCapacity/fetchEventCapacity',
  async (eventId, { rejectWithValue }) => {
    try {
      console.log(`📊 Fetching capacity for event: ${eventId}`);
      
      const response = await axios.get(
        `${API_BASE_URL}/events/${eventId}/capacity`,
        { withCredentials: true }
      );

      if (response.data.success) {
        console.log(`✅ Capacity fetched for ${eventId}:`, response.data.capacity);
        return {
          eventId,
          capacity: response.data.capacity,
          lastUpdated: Date.now()
        };
      } else {
        return rejectWithValue('Failed to fetch capacity data');
      }
    } catch (error) {
      console.error(`❌ Error fetching capacity for ${eventId}:`, error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch event capacity'
      );
    }
  }
);

// ========================================
// SLICE DEFINITION
// ========================================

const eventCapacitySlice = createSlice({
  name: 'eventCapacity',
  initialState: {
    // Event capacity data: { [eventId]: { capacity, lastUpdated } }
    data: {},
    
    // Loading states: { [eventId]: boolean }
    loading: {},
    
    // Error states: { [eventId]: string }
    errors: {},
  },
  
  reducers: {
    // 🗑️ Remove capacity cache for specific event
    removeEventCapacity: (state, action) => {
      const eventId = action.payload;
      delete state.data[eventId];
      delete state.loading[eventId];
      delete state.errors[eventId];
      console.log(`🗑️ Removed capacity cache for event: ${eventId}`);
    },
    
    // ⚠️ Mark capacity as stale (force refresh on next access)
    markCapacityStale: (state, action) => {
      const eventId = action.payload;
      if (state.data[eventId]) {
        state.data[eventId].lastUpdated = 0; // Mark as stale
        console.log(`⚠️ Marked capacity as stale for event: ${eventId}`);
      }
    },
    
    // 🧹 Clear entire capacity cache
    resetCapacityCache: (state) => {
      state.data = {};
      state.loading = {};
      state.errors = {};
      console.log(`🧹 Reset entire capacity cache`);
    },
    
    // ❌ Clear error for specific event
    clearCapacityError: (state, action) => {
      const eventId = action.payload;
      delete state.errors[eventId];
    },
  },
  
  extraReducers: (builder) => {
    builder
      // ========================================
      // FETCH EVENT CAPACITY
      // ========================================
      .addCase(fetchEventCapacity.pending, (state, action) => {
        const eventId = action.meta.arg;
        state.loading[eventId] = true;
        delete state.errors[eventId];
      })
      .addCase(fetchEventCapacity.fulfilled, (state, action) => {
        const { eventId, capacity, lastUpdated } = action.payload;
        state.loading[eventId] = false;
        state.data[eventId] = { capacity, lastUpdated };
        delete state.errors[eventId];
      })
      .addCase(fetchEventCapacity.rejected, (state, action) => {
        const eventId = action.meta.arg;
        state.loading[eventId] = false;
        state.errors[eventId] = action.payload;
      });
  },
});

// ========================================
// EXPORT ACTIONS AND REDUCER
// ========================================

export const {
  removeEventCapacity,
  markCapacityStale,
  resetCapacityCache,
  clearCapacityError,
} = eventCapacitySlice.actions;

// ========================================
// SELECTORS
// ========================================

// 🎯 Primary selector - Get complete capacity state for an event
export const selectEventCapacityState = (state, eventId) => {
  return {
    capacity: state.eventCapacity.data[eventId]?.capacity || null,
    isLoading: state.eventCapacity.loading[eventId] || false,
    error: state.eventCapacity.errors[eventId] || null,
    lastFetched: state.eventCapacity.data[eventId]?.lastUpdated || null,
  };
};

// 📊 Get just the capacity data (for display components)
export const selectCapacityData = (state, eventId) => {
  return state.eventCapacity.data[eventId]?.capacity || null;
};

// ⏱️ Check if capacity needs refresh (stale check)
export const selectShouldRefreshCapacity = (state, eventId, freshnessPeriod = 2 * 60 * 1000) => {
  const lastFetched = state.eventCapacity.data[eventId]?.lastUpdated;
  if (!lastFetched) return true; // No data = needs fetch
  return Date.now() - lastFetched > freshnessPeriod;
};

// 📋 Get capacity for multiple events (bulk operations)
export const selectMultipleEventCapacities = (state, eventIds = []) => {
  const results = {};
  eventIds.forEach(eventId => {
    results[eventId] = selectEventCapacityState(state, eventId);
  });
  return results;
};

// 🔄 Check if any events are currently loading
export const selectHasLoadingCapacity = (state, eventIds = []) => {
  return eventIds.some(eventId => state.eventCapacity.loading[eventId]);
};

// 📈 Get capacity statistics (useful for admin/analytics)
export const selectCapacityStats = (state) => {
  const allData = state.eventCapacity.data;
  const totalEvents = Object.keys(allData).length;
  const loadingCount = Object.values(state.eventCapacity.loading).filter(Boolean).length;
  const errorCount = Object.keys(state.eventCapacity.errors).length;
  
  return {
    totalCachedEvents: totalEvents,
    currentlyLoading: loadingCount,
    withErrors: errorCount,
  };
};

// 🛒 Cart-aware capacity selector for ticket selection page
export const selectCartAwareCapacity = (state, eventId, cartQuantity = 0) => {
  const capacityState = selectEventCapacityState(state, eventId);
  
  if (!capacityState.capacity) return capacityState;
  
  const { capacity } = capacityState;
  const adjustedRemaining = Math.max(0, (capacity.remaining || 0) - cartQuantity);
  
  return {
    ...capacityState,
    capacity: {
      ...capacity,
      remaining: adjustedRemaining,
      adjustedForCart: cartQuantity > 0,
      cartQuantity
    }
  };
};

// ========================================
// MEMOIZED SELECTORS
// ========================================

// Base selectors
const selectEventCapacityData = (state) => state.eventCapacity.data;
const selectEventCapacityLoading = (state) => state.eventCapacity.loading;
const selectEventCapacityErrors = (state) => state.eventCapacity.errors;
const selectEventId = (_, eventId) => eventId;

// 🎯 Memoized selector for event capacity state
export const selectEventCapacityStateMemoized = createSelector(
  [selectEventCapacityData, selectEventCapacityLoading, selectEventCapacityErrors, selectEventId],
  (data, loading, errors, eventId) => ({
    capacity: data[eventId]?.capacity || null,
    isLoading: loading[eventId] || false,
    error: errors[eventId] || null,
    lastFetched: data[eventId]?.lastUpdated || null,
  })
);

// 📊 Memoized selector for just capacity data
export const selectCapacityDataMemoized = createSelector(
  [selectEventCapacityData, selectEventId],
  (data, eventId) => data[eventId]?.capacity || null
);

export default eventCapacitySlice.reducer;