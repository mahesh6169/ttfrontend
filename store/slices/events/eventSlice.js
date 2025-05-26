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

// Update free event
export const updateFreeEvent = createAsyncThunk(
  'events/updateFreeEvent',
  async ({ eventId, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/events/update-free/${eventId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        return response.data.event;
      } else {
        return rejectWithValue(response.data.message || 'Failed to update free event');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update free event'
      );
    }
  }
);

// Update paid event
export const updatePaidEvent = createAsyncThunk(
  'events/updatePaidEvent',
  async ({ eventId, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/events/update-paid/${eventId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        return response.data.event;
      } else {
        return rejectWithValue(response.data.message || 'Failed to update paid event');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update paid event'
      );
    }
  }
);


// Update existing event
export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ eventId, formData }, { rejectWithValue }) => {
     console.log("🚀 updateEvent thunk entered with:", { eventId, formData });
    console.log("🔗 API URL will be:", `${API_BASE_URL}/events/update/${eventId}`);
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
      
      // ✅ Your API returns the event directly, not wrapped
      if (response.data._id || response.data.id) {
        return response.data; // Return the event directly
      }
      
      return rejectWithValue('Invalid response format');
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

// Helper function to create default form data
const createDefaultFormData = () => ({
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
  
  // Recurring Event Settings
  recurrence: {
    isRecurring: false,
    repeatSchedule: [],
    endDate: null,
    parentEventId: null
  },
  
  // Ticketing
  isPaid: false,
  capacity: 0,
  maxAttendeesPerRegistration: 10,
  registrationFields: [],
  
  // Paid Event Details
  ticketTypes: [{ name: '', price: null, quantity: 0, startDate: null, expiryDate: null }],
  seatingLayout: [],
  seatingLayoutImage: null,
  
  // Financial
  applyGST: true,
  commissionRate: 0.05,
  commissionType: 'percentage',
  fixedCommissionAmount: 0,
  stripeAccountId: '',
});

// Helper function to safely convert images for edit mode
const processImagesForEdit = (images) => {
  if (!images || !Array.isArray(images)) return [];
  
  return images.map((img, index) => {
    // Handle different image data structures from backend
    if (typeof img === 'string') {
      // Simple URL string
      return {
        url: img,
        isExisting: true,
        id: `existing_${index}_${Date.now()}`,
        name: img.split('/').pop() || 'image',
        size: 0,
        type: 'image/*'
      };
    } else if (img && typeof img === 'object') {
      // Object with properties
      return {
        url: img.url || img.src || img.path,
        isExisting: true,
        id: img.id || img._id || `existing_${index}_${Date.now()}`,
        name: img.name || img.filename || img.originalName || 'image',
        size: img.size || 0,
        type: img.type || img.mimetype || 'image/*'
      };
    }
    
    return null;
  }).filter(Boolean); // Remove any null values
};

// Helper function to safely process event data for edit mode
const processEventDataForEdit = (eventData) => {
  if (!eventData) return createDefaultFormData();
  
  return {
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
    images: processImagesForEdit(eventData.images),
    coordinators: (eventData.coordinators && eventData.coordinators.length > 0) 
      ? eventData.coordinators 
      : [{ name: '', role: '', phone: '', email: '' }],
    recurrence: {
      isRecurring: eventData.recurrence?.isRecurring || false,
      repeatSchedule: eventData.recurrence?.repeatSchedule || [],
      endDate: eventData.recurrence?.endDate || null,
      parentEventId: eventData.recurrence?.parentEventId || null
    },
    isPaid: eventData.isPaid || false,
    capacity: eventData.capacity || 0,
    maxAttendeesPerRegistration: eventData.maxAttendeesPerRegistration || 5,
    registrationFields: eventData.registrationFields || [],
    ticketTypes: (eventData.ticketTypes && eventData.ticketTypes.length > 0) 
      ? eventData.ticketTypes 
      : [{ name: '', price: null, quantity: 0, startDate: null, expiryDate: null }],
    seatingLayout: eventData.seatingLayout || [],
    seatingLayoutImage: eventData.seatingLayoutImage || null,
    applyGST: eventData.applyGST !== false,
    commissionRate: eventData.commissionRate || 0.05,
    commissionType: eventData.commissionType || 'percentage',
    fixedCommissionAmount: eventData.fixedCommissionAmount || 0,
    stripeAccountId: eventData.stripeAccountId || '',
  };
};

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
    
    // Form data
    formData: createDefaultFormData(),
    
    // Form state
    formErrors: {},
    formStatus: 'idle', // separate status for form operations
    formError: null,
    successMessage: '',
    
    // Edit mode state
    isEditMode: false,
    editingEventId: null,
    originalEventData: null, // Store original data for comparison
    hasUnsavedChanges: false, // Track if form has been modified
    
    // Operation mode tracking
    currentMode: 'add', // 'add' | 'edit' | 'view'
    
    // Loading states
    isInitializing: false,
    initializationError: null,
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
      state.initializationError = null;
    },


    
    // Set current operation mode
    setCurrentMode: (state, action) => {
      state.currentMode = action.payload; // 'add' | 'edit' | 'view'
    },
    
    // Enhanced edit mode management
    setEditMode: (state, action) => {
      const { isEdit, eventId = null, eventData = null, mode = 'edit' } = action.payload;

       // 🔥 ADD ONLY THESE 3 LINES:
  state.formStatus = 'idle';
  state.successMessage = '';
  state.formError = null;
      
      state.isEditMode = isEdit;
      state.editingEventId = eventId;
      state.currentMode = mode;
      state.hasUnsavedChanges = false;
      
      if (isEdit && eventData) {
        // Store original data for comparison
        state.originalEventData = eventData;
        
        // Populate form with processed event data
        state.formData = processEventDataForEdit(eventData);
        
        // Reset to first step for edit mode
        state.currentStep = 1;
      }
    },
    
    clearEditMode: (state) => {
      state.isEditMode = false;
      state.editingEventId = null;
      state.originalEventData = null;
      state.hasUnsavedChanges = false;
      state.currentMode = 'add';
    },
    
    // Track unsaved changes
    markAsModified: (state) => {
      state.hasUnsavedChanges = true;
    },
    
    clearModifiedFlag: (state) => {
      state.hasUnsavedChanges = false;
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
    
    // Form field updates with change tracking
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
      state.hasUnsavedChanges = true;
    },
    
    // Address update with change tracking
    setAddress: (state, action) => {
      state.formData.address = action.payload;
      state.hasUnsavedChanges = true;
    },
    
    // Recurring Event Reducers with change tracking
    toggleRecurring: (state, action) => {
      state.formData.recurrence.isRecurring = action.payload;
      state.hasUnsavedChanges = true;
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
      state.hasUnsavedChanges = true;
    },
    
    updateRepeatSchedule: (state, action) => {
      const { index, field, value } = action.payload;
      state.formData.recurrence.repeatSchedule[index][field] = value;
      state.hasUnsavedChanges = true;
    },
    
    removeRepeatSchedule: (state, action) => {
      const index = action.payload;
      state.formData.recurrence.repeatSchedule = state.formData.recurrence.repeatSchedule.filter((_, i) => i !== index);
      state.hasUnsavedChanges = true;
    },
    
    setRecurrenceEndDate: (state, action) => {
      state.formData.recurrence.endDate = action.payload;
      state.hasUnsavedChanges = true;
    },
    
    // Coordinators with change tracking
    addCoordinator: (state) => {
      state.formData.coordinators.push({ name: '', role: '', phone: '', email: '' });
      state.hasUnsavedChanges = true;
    },
    updateCoordinator: (state, action) => {
      const { index, field, value } = action.payload;
      state.formData.coordinators[index][field] = value;
      state.hasUnsavedChanges = true;
    },
    removeCoordinator: (state, action) => {
      const index = action.payload;
      state.formData.coordinators = state.formData.coordinators.filter((_, i) => i !== index);
      state.hasUnsavedChanges = true;
    },
    
    // Registration Fields with change tracking
    addRegistrationField: (state) => {
      state.formData.registrationFields.push({ 
        fieldName: '', 
        fieldType: 'text', 
        fieldOptions: [], 
        isRequired: false 
      });
      state.hasUnsavedChanges = true;
    },
    updateRegistrationField: (state, action) => {
      const { index, field, value } = action.payload;
      state.formData.registrationFields[index][field] = value;
      state.hasUnsavedChanges = true;
    },
    updateFieldOptions: (state, action) => {
      const { index, options } = action.payload;
      state.formData.registrationFields[index].fieldOptions = options;
      state.hasUnsavedChanges = true;
    },
    removeRegistrationField: (state, action) => {
      const index = action.payload;
      state.formData.registrationFields = state.formData.registrationFields.filter((_, i) => i !== index);
      state.hasUnsavedChanges = true;
    },
    
    // Ticket Types with change tracking
    toggleIsPaid: (state, action) => {
      state.formData.isPaid = action.payload;
      state.hasUnsavedChanges = true;
      // Initialize ticket types if switching to paid
      if (action.payload && state.formData.ticketTypes.length === 0) {
        state.formData.ticketTypes = [{ name: '', price: null, quantity: 0, startDate: null, expiryDate: null }];
      }
    },
    addTicketType: (state) => {
      state.formData.ticketTypes.push({ name: '', price: null, quantity: 0, startDate: null, expiryDate: null });
      state.hasUnsavedChanges = true;
    },
    updateTicketType: (state, action) => {
      const { index, field, value } = action.payload;
      state.formData.ticketTypes[index][field] = value;
      state.hasUnsavedChanges = true;
    },
    removeTicketType: (state, action) => {
      const index = action.payload;
      state.formData.ticketTypes = state.formData.ticketTypes.filter((_, i) => i !== index);
      state.hasUnsavedChanges = true;
    },
    
    // Seating Layout with change tracking
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
      state.hasUnsavedChanges = true;
    },
    updateRowLabel: (state, action) => {
      const { index, value } = action.payload;
      state.formData.seatingLayout[index].rowLabel = value;
      state.hasUnsavedChanges = true;
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
      state.hasUnsavedChanges = true;
    },
    removeSeatingRow: (state, action) => {
      const index = action.payload;
      state.formData.seatingLayout = state.formData.seatingLayout.filter((_, i) => i !== index);
      state.hasUnsavedChanges = true;
    },

    // Enhanced image management
    setImages: (state, action) => {
      state.formData.images = action.payload.map(img => {
        const { preview, url, id, name, size, type, isExisting, isNew } = img;
        return { preview, url, id, name, size, type, isExisting, isNew };
      });
      state.hasUnsavedChanges = true;
    },

    addImages: (state, action) => {
      const newImages = Array.isArray(action.payload) ? action.payload : [action.payload];
      const safeNewImages = newImages.map(img => {
        const { preview, url, id, name, size, type, isExisting, isNew } = img;
        return { preview, url, id, name, size, type, isExisting, isNew };
      });
      state.formData.images = [...(state.formData.images || []), ...safeNewImages];
      state.hasUnsavedChanges = true;
    },

    removeImage: (state, action) => {
      const index = action.payload;
      state.formData.images = state.formData.images.filter((_, i) => i !== index);
      state.hasUnsavedChanges = true;
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
      state.hasUnsavedChanges = true;
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
    
    // Enhanced form reset with mode awareness
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
      state.originalEventData = null;
      state.hasUnsavedChanges = false;
      state.currentMode = 'add';
      state.formData = createDefaultFormData();
      state.formErrors = {};
      state.formStatus = 'idle';
      state.formError = null;
      state.successMessage = '';
      state.isInitializing = false;
      state.initializationError = null;
    },
    
    // Initialization state management
    setInitializing: (state, action) => {
      state.isInitializing = action.payload;
    },
    
    setInitializationError: (state, action) => {
      state.initializationError = action.payload;
      state.isInitializing = false;
    },
    
    clearInitializationError: (state) => {
      state.initializationError = null;
    },
    
    // Success message management
    clearSuccessMessage: (state) => {
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
        state.hasUnsavedChanges = false;
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
        state.hasUnsavedChanges = false;
        // Add to myEvents if it exists
        if (state.myEvents && Array.isArray(state.myEvents)) {
          state.myEvents.push(action.payload);
        }
      })
      .addCase(addPaidEvent.rejected, (state, action) => {
        state.formStatus = 'failed';
        state.formError = action.payload || 'Failed to add paid event';
      })
      
      
      // Update Free Event
      .addCase(updateFreeEvent.pending, (state) => {
        state.formStatus = 'loading';
        state.formError = null;
      })
      .addCase(updateFreeEvent.fulfilled, (state, action) => {
        state.formStatus = 'succeeded';
        state.successMessage = 'Free event updated successfully!';
        state.hasUnsavedChanges = false;
        
        // Update in myEvents array
        const eventIndex = state.myEvents.findIndex(event => event._id === action.payload._id);
        if (eventIndex !== -1) {
          state.myEvents[eventIndex] = action.payload;
        }
        
        // Update selectedEvent if it's the same event
        if (state.selectedEvent?._id === action.payload._id) {
          state.selectedEvent = action.payload;
        }
        
        // Update original event data for comparison
        state.originalEventData = action.payload;
      })
      .addCase(updateFreeEvent.rejected, (state, action) => {
        state.formStatus = 'failed';
        state.formError = action.payload || 'Failed to update free event';
      })

      // Update Paid Event
.addCase(updatePaidEvent.pending, (state) => {
  state.formStatus = 'loading';
  state.formError = null;
})
.addCase(updatePaidEvent.fulfilled, (state, action) => {
  state.formStatus = 'succeeded';
  state.successMessage = 'Paid event updated successfully!';
  state.hasUnsavedChanges = false;

  // Update in myEvents array
  const eventIndex = state.myEvents.findIndex(event => event._id === action.payload._id);
  if (eventIndex !== -1) {
    state.myEvents[eventIndex] = action.payload;
  }

  // Update selectedEvent if it's the same event
  if (state.selectedEvent?._id === action.payload._id) {
    state.selectedEvent = action.payload;
  }

  // Update original event data for comparison
  state.originalEventData = action.payload;
})
.addCase(updatePaidEvent.rejected, (state, action) => {
  state.formStatus = 'failed';
  state.formError = action.payload || 'Failed to update paid event';
})


      // Update Event
      .addCase(updateEvent.pending, (state) => {
        state.formStatus = 'loading';
        state.formError = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.formStatus = 'succeeded';
        state.successMessage = 'Event updated successfully!';
        state.hasUnsavedChanges = false;
        
        // Update in myEvents array
        const eventIndex = state.myEvents.findIndex(event => event._id === action.payload._id);
        if (eventIndex !== -1) {
          state.myEvents[eventIndex] = action.payload;
        }
        
        // Update selectedEvent if it's the same event
        if (state.selectedEvent?._id === action.payload._id) {
          state.selectedEvent = action.payload;
        }
        
        // Update original event data for comparison
        state.originalEventData = action.payload;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.formStatus = 'failed';
        state.formError = action.payload || 'Failed to update event';
      })
      
      // Fetch Event By ID
      .addCase(fetchEventById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.isInitializing = true;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedEvent = action.payload;
        state.isInitializing = false;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch event';
        state.isInitializing = false;
        state.initializationError = action.payload || 'Failed to fetch event';
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
  
  // Mode management
  setCurrentMode,
  setEditMode,
  clearEditMode,
  
  // Change tracking
  markAsModified,
  clearModifiedFlag,
  
  // Navigation
  nextStep,
  prevStep,
  setStep,
  
  // Form fields
  updateField,
  setAddress,
  
  // Recurring events
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
  
  // Initialization
  setInitializing,
  setInitializationError,
  clearInitializationError,
  
  // Success messages
  clearSuccessMessage,
  
  // Form management
  resetForm,
} = eventSlice.actions;

export default eventSlice.reducer;