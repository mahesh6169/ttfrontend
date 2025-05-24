// store/slices/events/eventSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunks
export const addFreeEvent = createAsyncThunk(
  'events/addFreeEvent',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/events/add-free-event`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        return response.data.event;
      } else {
        return rejectWithValue(response.data.message || 'Failed to add free event');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add free event'
      );
    }
  }
);

export const addPaidEvent = createAsyncThunk(
  'events/addPaidEvent',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/events/add-paid-event`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        return response.data.event;
      } else {
        return rejectWithValue(response.data.message || 'Failed to add paid event');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add paid event'
      );
    }
  }
);


// Update existing event
export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ eventId, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/events/update/${eventId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        return response.data.event;
      } else {
        return rejectWithValue(response.data.message || 'Failed to update event');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update event'
      );
    }
  }
);

// Fetch event by ID
export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/events/views/${id}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch event'
      );
    }
  }
);

// Fetch all events
export const fetchAllEvents = createAsyncThunk(
  'events/fetchAllEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/events/fetchAllEvents`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch events'
      );
    }
  }
);

// Fetch my events
export const fetchMyEvents = createAsyncThunk(
  'events/fetchMyEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/events/mine`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch my events'
      );
    }
  }
);

// Delete event
export const deleteMyEvent = createAsyncThunk(
  'events/deleteMyEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/events/${eventId}`,
        { withCredentials: true }
      );
      return { eventId, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete event'
      );
    }
  }
);

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    // Event viewing state
    selectedEvent: null,
    allEvents: [],
    myEvents: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    
    // Form state
    currentStep: 1,
    totalSteps: 4,
    
    // Form data with updated structure to match your backend
    formData: {
      // Basic event details
      title: '',
      description: '',
      dateTime: '',
      timeZone: 'Australia/Sydney',
      venue: '',
      address: {
        formattedAddress: '',
        streetNumber: '',
        street: '',
        suburb: '',
        state: '',
        postalCode: '',
        location: { type: 'Point', coordinates: [0, 0] }
      },
      category: '',
      images: [],
      
      // Coordinators
      coordinators: [{ name: '', role: '', phone: '', email: '' }],
      
      // 🔄 Recurring Event Settings (NEW)
      recurrence: {
        isRecurring: false,
        repeatSchedule: [],
        endDate: null,
        parentEventId: null
      },
      
      // Ticketing
      isPaid: false,
      capacity: 0,
      maxAttendeesPerRegistration: 5,
      registrationFields: [],
      
      // Paid Event Details
      ticketTypes: [{ name: '', price: 0, quantity: 1, seatsRequired: 1 }],
      seatingLayout: [],
      seatingLayoutImage: null,
      
      // Financial
      applyGST: true,
      commissionRate: 0.05,
      commissionType: 'percentage',
      fixedCommissionAmount: 0,
      stripeAccountId: '', // Added from model
    },
    
    // Form state
    formErrors: {},
    formStatus: 'idle', // separate status for form operations
    formError: null,
    successMessage: '',
    
    // Edit mode state (NEW)
    isEditMode: false,
    editingEventId: null,
  },
  
  reducers: {
    // Clear selected event
    clearSelectedEvent: (state) => {
      state.selectedEvent = null;
    },
    
    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.formError = null;
    },
    
    // Edit mode management (NEW)
    setEditMode: (state, action) => {
      const { isEdit, eventId = null, eventData = null } = action.payload;
      state.isEditMode = isEdit;
      state.editingEventId = eventId;
      
      if (isEdit && eventData) {
        // Populate form with existing event data
        state.formData = {
          title: eventData.title || '',
          description: eventData.description || '',
          dateTime: eventData.dateTime || '',
          timeZone: eventData.timeZone || 'Australia/Sydney',
          venue: eventData.venue || '',
          address: eventData.address || {
            formattedAddress: '',
            streetNumber: '',
            street: '',
            suburb: '',
            state: '',
            postalCode: '',
            location: { type: 'Point', coordinates: [0, 0] }
          },
          category: eventData.category || '',
          images: eventData.images ? eventData.images.map(img => ({
  url: typeof img === 'string' ? img : img.url,
  isExisting: true,
  id: `existing_${Math.random()}`
})) : [],
          coordinators: eventData.coordinators || [{ name: '', role: '', phone: '', email: '' }],
          recurrence: eventData.recurrence || {
            isRecurring: false,
            repeatSchedule: [],
            endDate: null,
            parentEventId: null
          },
          isPaid: eventData.isPaid || false,
          capacity: eventData.capacity || 0,
          maxAttendeesPerRegistration: eventData.maxAttendeesPerRegistration || 5,
          registrationFields: eventData.registrationFields || [],
          ticketTypes: eventData.ticketTypes || [{ name: '', price: 0, quantity: 1, seatsRequired: 1 }],
          seatingLayout: eventData.seatingLayout || [],
          seatingLayoutImage: eventData.seatingLayoutImage || null,
          applyGST: eventData.applyGST !== false,
          commissionRate: eventData.commissionRate || 0.05,
          commissionType: eventData.commissionType || 'percentage',
          fixedCommissionAmount: eventData.fixedCommissionAmount || 0,
          stripeAccountId: eventData.stripeAccountId || '',
        };
      }
    },
    
    clearEditMode: (state) => {
      state.isEditMode = false;
      state.editingEventId = null;
    },
    
    // Navigation
    nextStep: (state) => {
      if (state.currentStep < state.totalSteps) {
        state.currentStep += 1;
      }
    },
    prevStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1;
      }
    },
    setStep: (state, action) => {
      const step = action.payload;
      if (step >= 1 && step <= state.totalSteps) {
        state.currentStep = step;
      }
    },
    
    // Form field updates
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
    },
    
    // Address update
    setAddress: (state, action) => {
      state.formData.address = action.payload;
    },
    
    // 🔄 Recurring Event Reducers (NEW)
    toggleRecurring: (state, action) => {
      state.formData.recurrence.isRecurring = action.payload;
      if (!action.payload) {
        // Clear recurring data when toggled off
        state.formData.recurrence.repeatSchedule = [];
        state.formData.recurrence.endDate = null;
      }
    },
    
    addRepeatSchedule: (state) => {
      state.formData.recurrence.repeatSchedule.push({
        day: 'Mon',
        time: '18:00'
      });
    },
    
    updateRepeatSchedule: (state, action) => {
      const { index, field, value } = action.payload;
      state.formData.recurrence.repeatSchedule[index][field] = value;
    },
    
    removeRepeatSchedule: (state, action) => {
      const index = action.payload;
      state.formData.recurrence.repeatSchedule = state.formData.recurrence.repeatSchedule.filter((_, i) => i !== index);
    },
    
    setRecurrenceEndDate: (state, action) => {
      state.formData.recurrence.endDate = action.payload;
    },
    
    // Coordinators
    addCoordinator: (state) => {
      state.formData.coordinators.push({ name: '', role: '', phone: '', email: '' });
    },
    updateCoordinator: (state, action) => {
      const { index, field, value } = action.payload;
      state.formData.coordinators[index][field] = value;
    },
    removeCoordinator: (state, action) => {
      const index = action.payload;
      state.formData.coordinators = state.formData.coordinators.filter((_, i) => i !== index);
    },
    
    // Registration Fields
    addRegistrationField: (state) => {
      state.formData.registrationFields.push({ 
        fieldName: '', 
        fieldType: 'text', 
        fieldOptions: [], 
        isRequired: false 
      });
    },
    updateRegistrationField: (state, action) => {
      const { index, field, value } = action.payload;
      state.formData.registrationFields[index][field] = value;
    },
    updateFieldOptions: (state, action) => {
      const { index, options } = action.payload;
      state.formData.registrationFields[index].fieldOptions = options;
    },
    removeRegistrationField: (state, action) => {
      const index = action.payload;
      state.formData.registrationFields = state.formData.registrationFields.filter((_, i) => i !== index);
    },
    
    // Ticket Types
    toggleIsPaid: (state, action) => {
      state.formData.isPaid = action.payload;
      // Initialize ticket types if switching to paid
      if (action.payload && state.formData.ticketTypes.length === 0) {
        state.formData.ticketTypes = [{ name: '', price: 0, quantity: 1, seatsRequired: 1 }];
      }
    },
    addTicketType: (state) => {
      state.formData.ticketTypes.push({ name: '', price: 0, quantity: 1, seatsRequired: 1 });
    },
    updateTicketType: (state, action) => {
      const { index, field, value } = action.payload;
      state.formData.ticketTypes[index][field] = value;
    },
    removeTicketType: (state, action) => {
      const index = action.payload;
      state.formData.ticketTypes = state.formData.ticketTypes.filter((_, i) => i !== index);
    },
    
    // Seating Layout
    addSeatingRow: (state) => {
      // Generate next row label (A, B, C, etc.)
      const nextRowLabel = String.fromCharCode(65 + state.formData.seatingLayout.length);
      
      // Create new row with 10 seats by default
      const newRow = {
        rowLabel: nextRowLabel,
        seats: Array(10).fill().map((_, i) => ({
          seatNumber: String(i + 1),
          status: 'available'
        }))
      };
      
      state.formData.seatingLayout.push(newRow);
    },
    updateRowLabel: (state, action) => {
      const { index, value } = action.payload;
      state.formData.seatingLayout[index].rowLabel = value;
    },
    updateSeatCount: (state, action) => {
      const { rowIndex, count } = action.payload;
      const currentCount = state.formData.seatingLayout[rowIndex].seats.length;
      const row = state.formData.seatingLayout[rowIndex];
      
      if (count > currentCount) {
        // Add more seats
        for (let i = currentCount + 1; i <= count; i++) {
          row.seats.push({ seatNumber: String(i), status: 'available' });
        }
      } else if (count < currentCount) {
        // Remove seats
        row.seats = row.seats.slice(0, count);
      }
    },
    removeSeatingRow: (state, action) => {
      const index = action.payload;
      state.formData.seatingLayout = state.formData.seatingLayout.filter((_, i) => i !== index);
    },

    // Image management
setImages: (state, action) => {
  state.formData.images = action.payload.map(img => {
    const { preview, url, id, name, size, type, isExisting, isNew } = img;
    return { preview, url, id, name, size, type, isExisting, isNew };
  });
},

addImages: (state, action) => {
  const newImages = Array.isArray(action.payload) ? action.payload : [action.payload];
  const safeNewImages = newImages.map(img => {
    const { preview, url, id, name, size, type, isExisting, isNew } = img;
    return { preview, url, id, name, size, type, isExisting, isNew };
  });
  state.formData.images = [...(state.formData.images || []), ...safeNewImages];
},

removeImage: (state, action) => {
  const index = action.payload;
  state.formData.images = state.formData.images.filter((_, i) => i !== index);
},

clearImages: (state) => {
  if (state.formData.images) {
    state.formData.images.forEach(image => {
      if (image.preview && image.preview.startsWith('blob:')) {
        URL.revokeObjectURL(image.preview);
      }
    });
  }
  state.formData.images = [];
},


    
    // Form Errors
    setErrors: (state, action) => {
      state.formErrors = action.payload;
    },
    setFormErrors: (state, action) => {
      state.formErrors = action.payload;
    },
    clearErrors: (state) => {
      state.formErrors = {};
      state.error = null;
      state.formError = null;
    },
    clearFormErrors: (state) => {
      state.formErrors = {};
    },
    
    // Reset form
    resetForm: (state) => {
  // Clean up any object URLs before resetting
  if (state.formData.images) {
    state.formData.images.forEach(image => {
      if (image.preview && image.preview.startsWith('blob:')) {
        URL.revokeObjectURL(image.preview);
      }
    });
  }
  
  state.currentStep = 1;
  state.isEditMode = false;
  state.editingEventId = null;
  state.formData = {
    title: '',
    description: '',
    dateTime: '',
    timeZone: 'Australia/Sydney',
    venue: '',
    address: {
      formattedAddress: '',
      streetNumber: '',
      street: '',
      suburb: '',
      state: '',
      postalCode: '',
      location: { type: 'Point', coordinates: [0, 0] }
    },
    category: '',
    images: [],
    coordinators: [{ name: '', role: '', phone: '', email: '' }],
    recurrence: {
      isRecurring: false,
      repeatSchedule: [],
      endDate: null,
      parentEventId: null
    },
    isPaid: false,
    capacity: 0,
    maxAttendeesPerRegistration: 5,
    registrationFields: [],
    ticketTypes: [{ name: '', price: 0, quantity: 1, seatsRequired: 1 }],
    seatingLayout: [],
    seatingLayoutImage: null,
    applyGST: true,
    commissionRate: 0.05,
    commissionType: 'percentage',
    fixedCommissionAmount: 0,
    stripeAccountId: '',
  };
  state.formErrors = {};
  state.formStatus = 'idle';
  state.formError = null;
  state.successMessage = '';
},
  },
  
  extraReducers: (builder) => {
    builder
      // Add Free Event
      .addCase(addFreeEvent.pending, (state) => {
        state.formStatus = 'loading';
        state.formError = null;
      })
      .addCase(addFreeEvent.fulfilled, (state, action) => {
        state.formStatus = 'succeeded';
        state.successMessage = 'Free event created successfully!';
        // Add to myEvents if it exists
        if (state.myEvents && Array.isArray(state.myEvents)) {
          state.myEvents.push(action.payload);
        }
      })
      .addCase(addFreeEvent.rejected, (state, action) => {
        state.formStatus = 'failed';
        state.formError = action.payload || 'Failed to add free event';
      })
      
      // Add Paid Event
      .addCase(addPaidEvent.pending, (state) => {
        state.formStatus = 'loading';
        state.formError = null;
      })
      .addCase(addPaidEvent.fulfilled, (state, action) => {
        state.formStatus = 'succeeded';
        state.successMessage = 'Paid event created successfully!';
        // Add to myEvents if it exists
        if (state.myEvents && Array.isArray(state.myEvents)) {
          state.myEvents.push(action.payload);
        }
      })
      .addCase(addPaidEvent.rejected, (state, action) => {
        state.formStatus = 'failed';
        state.formError = action.payload || 'Failed to add paid event';
      })
      
      // Update Event
      .addCase(updateEvent.pending, (state) => {
        state.formStatus = 'loading';
        state.formError = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.formStatus = 'succeeded';
        state.successMessage = 'Event updated successfully!';
        
        // Update in myEvents array
        const eventIndex = state.myEvents.findIndex(event => event._id === action.payload._id);
        if (eventIndex !== -1) {
          state.myEvents[eventIndex] = action.payload;
        }
        
        // Update selectedEvent if it's the same event
        if (state.selectedEvent?._id === action.payload._id) {
          state.selectedEvent = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.formStatus = 'failed';
        state.formError = action.payload || 'Failed to update event';
      })
      
      // Fetch Event By ID
      .addCase(fetchEventById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch event';
      })
      
      // Fetch All Events
      .addCase(fetchAllEvents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllEvents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allEvents = action.payload;
      })
      .addCase(fetchAllEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch events';
      })
      
      // Fetch My Events
      .addCase(fetchMyEvents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyEvents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myEvents = action.payload;
      })
      .addCase(fetchMyEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch my events';
      })
      
      // Delete My Event
      .addCase(deleteMyEvent.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteMyEvent.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Remove the deleted event from myEvents array
        state.myEvents = state.myEvents.filter(
          event => event._id !== action.payload.eventId
        );
        // Clear selectedEvent if it was the deleted one
        if (state.selectedEvent?._id === action.payload.eventId) {
          state.selectedEvent = null;
        }
      })
      .addCase(deleteMyEvent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to delete event';
      });
  },
});

export const {
  // Event viewing
  clearSelectedEvent,
  clearError,
  
  // Edit mode (NEW)
  setEditMode,
  clearEditMode,
  
  // Navigation
  nextStep,
  prevStep,
  setStep,
  
  // Form fields
  updateField,
  setAddress,
  
  // Recurring events (NEW)
  toggleRecurring,
  addRepeatSchedule,
  updateRepeatSchedule,
  removeRepeatSchedule,
  setRecurrenceEndDate,
  
  // Coordinators
  addCoordinator,
  updateCoordinator,
  removeCoordinator,
  
  // Registration fields
  addRegistrationField,
  updateRegistrationField,
  updateFieldOptions,
  removeRegistrationField,
  
  // Ticket types
  toggleIsPaid,
  addTicketType,
  updateTicketType,
  removeTicketType,
  
  // Seating layout
  addSeatingRow,
  updateRowLabel,
  updateSeatCount,
  removeSeatingRow,
  
  // Images

  setImages,
addImages,
removeImage,
clearImages,
  
  // Form errors
  setErrors,
  setFormErrors,
  clearFormErrors,
  
  // Form management
  resetForm,
} = eventSlice.actions;

export default eventSlice.reducer;