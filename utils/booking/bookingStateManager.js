// utils/booking/bookingStateManager.js

const STORAGE_KEY = 'bookingState';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes
const REFRESH_FLAG_KEY = 'isRefreshing';

export const bookingStateManager = {
  // Save complete or partial booking state
  save: (updates = {}) => {
    if (typeof window === 'undefined') return null;
    
    try {
      // Get existing state
      const existingState = bookingStateManager.load() || {};
      
      // Merge with updates
      const bookingState = {
        ...existingState,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bookingState));
      console.log('💾 Booking state saved:', bookingState);
      
      return bookingState;
    } catch (error) {
      console.error('❌ Failed to save booking state:', error);
      return null;
    }
  },
  
  // Load and validate state
  load: (eventId = null) => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        console.log('ℹ️ No booking state found in storage');
        return null;
      }
      
      const state = JSON.parse(stored);
      
      // Validate: correct event if eventId provided
      if (eventId && state.eventId !== eventId) {
        console.log('⚠️ Booking state for different event, clearing');
        bookingStateManager.clear();
        return null;
      }
      
      // Validate: not expired
      const age = Date.now() - new Date(state.lastUpdated).getTime();
      if (age > EXPIRY_TIME) {
        console.log('⏰ Booking state expired, clearing');
        bookingStateManager.clear();
        return null;
      }
      
      console.log('✅ Booking state loaded:', state);
      return state;
    } catch (error) {
      console.error('❌ Failed to load booking state:', error);
      return null;
    }
  },
  
  // Update specific fields
  updateTickets: (tickets, totals) => {
    return bookingStateManager.save({
      tickets: {
        selected: tickets,
        totals: totals,
        timestamp: new Date().toISOString()
      },
      currentStep: 'tickets'
    });
  },
  
  updateSeats: (seats, reservation) => {
    return bookingStateManager.save({
      seats: {
        selected: seats,
        reservation: reservation,
        timestamp: new Date().toISOString()
      },
      currentStep: 'seats'
    });
  },
  
  updateBuyer: (buyerInfo) => {
    return bookingStateManager.save({
      buyer: buyerInfo,
      currentStep: 'checkout'
    });
  },
  
  updatePayment: (paymentInfo) => {
    return bookingStateManager.save({
      payment: paymentInfo,
      currentStep: 'checkout'
    });
  },
  
  // Clear state
  clear: () => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      console.log('🧹 Booking state cleared');
    } catch (error) {
      console.error('❌ Failed to clear booking state:', error);
    }
  },
  
  // Check if current session has valid reservation
  hasValidReservation: () => {
    const state = bookingStateManager.load();
    if (!state?.seats?.reservation?.reservedUntil) return false;
    
    const expiry = new Date(state.seats.reservation.reservedUntil);
    return expiry > new Date();
  },
  
  // Refresh detection
  markRefreshing: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(REFRESH_FLAG_KEY, 'true');
    }
  },
  
  isRefresh: () => {
    if (typeof window === 'undefined') return false;
    
    const isRefresh = sessionStorage.getItem(REFRESH_FLAG_KEY) === 'true';
    sessionStorage.removeItem(REFRESH_FLAG_KEY);
    return isRefresh;
  },
  
  // Initialize refresh detection
  initRefreshDetection: () => {
    // Mark as refreshing when page is about to unload
    window.addEventListener('beforeunload', () => {
      bookingStateManager.markRefreshing();
    });
  }
};

// Auto-initialize refresh detection
if (typeof window !== 'undefined') {
  bookingStateManager.initRefreshDetection();
}

export default bookingStateManager;