// store/slices/events/eventSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';
import { utcToZonedTime, format } from 'date-fns-tz';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunks
export const addFreeEvent = createAsyncThunk(
  'events/addFreeEvent',
  async (formData, { rejectWithValue }) => {
    try {
      console.log("🔍EventSlice/AddFreeEvent FormData being sent to backend:", Array.from(formData.entries()));
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

      console.log("🔍EventSlice/AddPaidEvent FormData being sent to backend:", Array.from(formData.entries()));
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
      console.log("🔍EventSlice/UpdatePaidEvent FormData being sent to backend:", Array.from(formData.entries()));
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
  timeZone: '',
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
  communities: [],
  images: [],

  // Coordinators (optional) - start empty; the organiser clicks "Add Coordinator" to add one.
  coordinators: [],

  // Organizer
  organizer: {
    name: '',
    website: '',
    contact: '',
    email: '',
    abn: '', // Australian Business Number for invoicing (paid events)
    socialMedia: []
  },

  // Recurring Event Settings
  recurrence: {
    isRecurring: false,
    repeatSchedule: [],
    endDate: null,
    parentEventId: null
  },

  // Event Intent & Promotional Settings
  eventIntent: null, // 'promote' | 'host' | null (user must select)
  externalTicketUrl: '', // External ticketing link for promotional events

  // Ticketing
  isPaid: null, // null = ticket type not chosen yet (user picks RSVP/Paid); /add-paid presets true
  isAdvertiseOnly: false, // For free events that are advertise-only
  capacity: '',
  maxAttendeesPerRegistration: '',
  registrationFields: [],
  
  // Paid Event Details - start empty; the organiser clicks "Add Ticket Type" (paid events still require >=1, enforced at Next).
  ticketTypes: [],
  // Discount Codes (Paid Events Only). kind: 'percent' | 'fixed'; appliesToTicketTypes holds
  // ticket-type NAMES (explicit — no "all by default"). Matches the backend schema exactly.
  discountCodes: [],
  seatingLayout: [],
  seatingLayoutImage: [],
  organizerReservedSeats: '',
  
  // Financial
  stripeAccountId: '',

  // Refund Policy (Paid Events Only)
refundPolicy: {
  processingFeePolicy: 'non-refundable', // 'refunded' or 'non-refundable'
  policyText: ''
},

// GST Configuration (Paid Events Only)
gstIncluded: false,

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
        publicId: img.publicId,
        isExisting: true,
        id: img.id || img._id || `existing_${index}_${Date.now()}`,
        name: img.originalFilename || img.name || img.filename || img.originalName || 'image',
        originalFilename: img.originalFilename,
        size: img.size || 0,
        type: img.type || img.mimetype || 'image/*'
      };
    }
    
    return null;
  }).filter(Boolean); // Remove any null values
};

// Then update the processEventDataForEdit function:
const processEventDataForEdit = (eventData) => {
  if (!eventData) return createDefaultFormData();
  console.log('🔍 EventSlice/processEventDataForEdit:', eventData);
  
  // 🔧 FIX: Convert UTC datetime to local format for form display
  let formattedDateTime = '';
  if (eventData.dateTime && eventData.timeZone) {
    try {
      // Convert UTC to local time for form display
      const zonedDate = utcToZonedTime(eventData.dateTime, eventData.timeZone);
      formattedDateTime = format(zonedDate, 'yyyy-MM-dd\'T\'HH:mm');
      console.log('🔧 Converted UTC to local for form:', eventData.dateTime, '→', formattedDateTime);
    } catch (error) {
      console.error('❌ Error converting datetime for form:', error);
      formattedDateTime = eventData.dateTime; // Fallback to original
    }
  } else {
    formattedDateTime = eventData.dateTime || '';
  }

  // 🔧 NEW: Convert ticket dates from UTC to local for form display
const processTicketDatesForEdit = (ticketTypes, timeZone) => {
  if (!ticketTypes || !Array.isArray(ticketTypes) || !timeZone) {
    return ticketTypes;
  }
  
  return ticketTypes.map(ticket => {
    const processedTicket = { ...ticket };
    
    // Process startDate
    if (ticket.startDate) {
      try {
        const zonedDate = utcToZonedTime(ticket.startDate, timeZone);
        processedTicket.startDate = format(zonedDate, 'yyyy-MM-dd');
        console.log('🔧 Ticket startDate UTC to local:', ticket.startDate, '→', processedTicket.startDate);
      } catch (error) {
        console.error('❌ Error converting ticket startDate:', error);
        processedTicket.startDate = ticket.startDate;
      }
    }
    
    // Process expiryDate  
    if (ticket.expiryDate) {
      try {
        const zonedDate = utcToZonedTime(ticket.expiryDate, timeZone);
        processedTicket.expiryDate = format(zonedDate, 'yyyy-MM-dd');
        console.log('🔧 Ticket expiryDate UTC to local:', ticket.expiryDate, '→', processedTicket.expiryDate);
      } catch (error) {
        console.error('❌ Error converting ticket expiryDate:', error);
        processedTicket.expiryDate = ticket.expiryDate;
      }
    }
    
    return processedTicket;
  });
};

  // 🔧 Convert discount-code validity dates from UTC to local (yyyy-MM-dd) for the form.
  // Only the OWNER receives full discountCodes from the API (public gets hint-only); in edit
  // mode this is always the owner. Counters (usedCount/remainingUses) are server-owned and
  // are NOT put into the form — the backend reconciles them on save.
  const processDiscountCodesForEdit = (discountCodes, timeZone) => {
    if (!discountCodes || !Array.isArray(discountCodes)) return [];
    const toLocal = (d) => {
      if (!d) return null;
      if (!timeZone) return d;
      try { return format(utcToZonedTime(d, timeZone), 'yyyy-MM-dd'); }
      catch { return d; }
    };
    return discountCodes.map((dc) => ({
      code: dc.code || '',
      kind: dc.kind === 'fixed' ? 'fixed' : 'percent',
      value: dc.value ?? null,
      maxUses: dc.maxUses ?? null,
      usedCount: dc.usedCount ?? 0, // read-only; carried so the wizard can enforce V4 inline (step 3). NOT sent on save (server owns counters).
      validFrom: toLocal(dc.validFrom),
      validUntil: toLocal(dc.validUntil),
      active: dc.active !== false,
      appliesToTicketTypes: Array.isArray(dc.appliesToTicketTypes) ? dc.appliesToTicketTypes : [],
      showHint: dc.showHint === true,
      existing: true, // loaded from a saved event — code word is immutable; locks/delete-block apply (transient, not sent on save)
    }));
  };

  return {
    title: eventData.title || '',
    description: eventData.description || '',
    dateTime: formattedDateTime,  // ✅ Now stores local time for form!
    timeZone: eventData.timeZone || '',
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
    communities: eventData.communities || [],
    images: processImagesForEdit(eventData.images),
    coordinators: eventData.coordinators || [],
    organizer: eventData.organizer || {
      name: '',
      website: '',
      contact: '',
      email: '',
      abn: '', // Australian Business Number for invoicing
      socialMedia: []
    },
    recurrence: {
      isRecurring: eventData.recurrence?.isRecurring || false,
      repeatSchedule: eventData.recurrence?.repeatSchedule || [],
      endDate: eventData.recurrence?.endDate || null,
      parentEventId: eventData.recurrence?.parentEventId || null
    },
    // Event Intent & Promotional Settings
    eventIntent: eventData.eventIntent || 'host', // Default to 'host' for existing events
    externalTicketUrl: eventData.externalTicketUrl || '',

    isPaid: eventData.isPaid || false,
    isAdvertiseOnly: eventData.isAdvertiseOnly || false,
    capacity: eventData.capacity || '',
    maxAttendeesPerRegistration: eventData.maxAttendeesPerRegistration || '',
    registrationFields: eventData.registrationFields || [],
    ticketTypes: (eventData.ticketTypes && eventData.ticketTypes.length > 0)
  ? processTicketDatesForEdit(eventData.ticketTypes, eventData.timeZone)
  : [],
    discountCodes: processDiscountCodesForEdit(eventData.discountCodes, eventData.timeZone),
    seatingLayout: eventData.seatingLayout || [],
    seatingLayoutImage: processImagesForEdit(eventData.seatingLayoutImage),
    organizerReservedSeats: eventData.organizerReservedSeats || '',
    stripeAccountId: eventData.stripeAccountId || '',
    refundPolicy: eventData.refundPolicy || {
      processingFeePolicy: 'non-refundable',
      policyText: ''
    },
    gstIncluded: eventData.gstIncluded || false,
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

    // Last created/updated event (for SuccessStep sharing)
    createdEvent: null,
    
    // Form state
    currentStep: 1,
    totalSteps: 3, // Dynamic: 3 for free/promotional events (default), 4 for hosted paid events
    
    // Form data
    formData: createDefaultFormData(),
    
    // Form state
    formErrors: {},
    formStatus: 'idle', // separate status for form operations
    formError: null,
    successMessage: '',

    // Delete operation state
deleteStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
deleteError: null,
    
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
    
    // Capacity warning
    capacityWarning: null,
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

        // Set totalSteps based on event intent and type:
        // - Promotional events (eventIntent === 'promote'): 3 steps
        // - Hosted free events: 3 steps
        // - Hosted paid events: 4 steps (includes refund policy)
        const isPromotional = eventData.eventIntent === 'promote' || eventData.isAdvertiseOnly;
        const isHostedPaid = eventData.eventIntent === 'host' && eventData.isPaid;
        state.totalSteps = isHostedPaid ? 4 : 3;

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

     // Organizer with change tracking
    updateOrganizerField: (state, action) => {
      const { field, value } = action.payload;
      state.formData.organizer[field] = value;
      state.hasUnsavedChanges = true;
    },
    addOrganizerSocialMedia: (state) => {
      state.formData.organizer.socialMedia.push({ platform: '', url: '' });
      state.hasUnsavedChanges = true;
    },
    updateOrganizerSocialMedia: (state, action) => {
      const { index, field, value } = action.payload;
      state.formData.organizer.socialMedia[index][field] = value;
      state.hasUnsavedChanges = true;
    },
    removeOrganizerSocialMedia: (state, action) => {
      const index = action.payload;
      state.formData.organizer.socialMedia = state.formData.organizer.socialMedia.filter((_, i) => i !== index);
      state.hasUnsavedChanges = true;
    },
    
    // Registration Fields with change tracking
    // Optional payload: { fieldType: 'text' | 'select' } — defaults to 'text' if absent
    // Dropdowns pre-load with one empty option row so the host immediately sees
    // they need to fill an option, instead of guessing why the form is incomplete.
    addRegistrationField: (state, action) => {
      const fieldType = action?.payload?.fieldType || 'text';
      state.formData.registrationFields.push({
        fieldName: '',
        fieldType,
        fieldOptions: fieldType === 'select' ? [''] : [],
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
      // Update totalSteps based on event type (only for hosted events)
      // Hosted paid: 4 steps (includes refund policy), Hosted free/Promotional: 3 steps
      if (state.formData.eventIntent === 'host') {
        state.totalSteps = action.payload ? 4 : 3;
      }
      
      // Reset isAdvertiseOnly if switching to paid event
      if (action.payload) {
        state.formData.isAdvertiseOnly = false;
      }
      
    },
    toggleAdvertiseOnly: (state, action) => {
      // Only allow for free events
      if (!state.formData.isPaid) {
        state.formData.isAdvertiseOnly = action.payload;
        state.hasUnsavedChanges = true;

        // If enabling advertise-only, clear all registration-related fields
        if (action.payload) {
          state.formData.capacity = '';
          state.formData.maxAttendeesPerRegistration = '';
          state.formData.registrationFields = [];
        }
      }
    },

    // Event Intent & Promotional Settings
    setEventIntent: (state, action) => {
      state.formData.eventIntent = action.payload; // 'promote' | 'host'
      state.hasUnsavedChanges = true;

      if (action.payload === 'promote') {
        // Promotional events: set isAdvertiseOnly for backwards compat
        state.formData.isAdvertiseOnly = true;
        state.formData.isPaid = null; // null = not yet selected, user must choose in Step 3
        state.formData.capacity = '';
        state.formData.maxAttendeesPerRegistration = '';
        state.formData.registrationFields = [];
        // Promotional events cannot be recurring
        state.formData.recurrence = {
          isRecurring: false,
          repeatSchedule: [],
          endDate: null,
          parentEventId: null
        };
        state.totalSteps = 3; // Promotional events have 3 steps
      } else if (action.payload === 'host') {
        // Hosted events: clear promotional fields
        state.formData.isAdvertiseOnly = false;
        state.formData.externalTicketUrl = '';
        // totalSteps depends on isPaid (set by toggleIsPaid)
        state.totalSteps = state.formData.isPaid ? 4 : 3;
      }
    },

    setExternalTicketUrl: (state, action) => {
      state.formData.externalTicketUrl = action.payload;
      state.hasUnsavedChanges = true;
    },

    addTicketType: (state) => {
      state.formData.ticketTypes.push({ name: '', price: null, quantity: 0, startDate: null, expiryDate: null });
      state.hasUnsavedChanges = true;
    },
    updateTicketType: (state, action) => {
      const { index, field, value } = action.payload;
      // Ticket-type cascade (RENAME): discount codes reference ticket types by NAME, so when a
      // name changes, follow the link — replace the old name with the new one in every code's
      // appliesToTicketTypes. Keeps discounts pointing at the same ticket. (Past redemptions are
      // snapshots, unaffected.) See feature-add-discountcode.md "Ticket-type cascade".
      if (field === 'name') {
        const oldName = state.formData.ticketTypes[index]?.name;
        const newName = value;
        if (oldName && oldName !== newName && Array.isArray(state.formData.discountCodes)) {
          state.formData.discountCodes.forEach((dc) => {
            if (Array.isArray(dc.appliesToTicketTypes)) {
              dc.appliesToTicketTypes = dc.appliesToTicketTypes.map((n) => (n === oldName ? newName : n));
            }
          });
        }
      }
      state.formData.ticketTypes[index][field] = value;
      state.hasUnsavedChanges = true;
    },
    removeTicketType: (state, action) => {
      const index = action.payload;
      state.formData.ticketTypes = state.formData.ticketTypes.filter((_, i) => i !== index);
      state.hasUnsavedChanges = true;
    },

    // Discount Codes (Paid Events Only) — mirror ticket-type reducers.
    addDiscountCode: (state) => {
      if (!Array.isArray(state.formData.discountCodes)) state.formData.discountCodes = [];
      state.formData.discountCodes.push({
        code: '',
        kind: 'percent', // 'percent' | 'fixed'
        value: null,
        maxUses: null,
        validFrom: null,
        validUntil: null,
        active: true,
        appliesToTicketTypes: [], // ticket-type NAMES (explicit)
        showHint: false,
      });
      state.hasUnsavedChanges = true;
    },
    updateDiscountCode: (state, action) => {
      const { index, field, value } = action.payload;
      state.formData.discountCodes[index][field] = value;
      state.hasUnsavedChanges = true;
    },
    removeDiscountCode: (state, action) => {
      const index = action.payload;
      state.formData.discountCodes = state.formData.discountCodes.filter((_, i) => i !== index);
      state.hasUnsavedChanges = true;
    },

    // Refund Policy with change tracking (Paid Events Only)
updateRefundPolicy: (state, action) => {
  const { field, value } = action.payload;
  state.formData.refundPolicy[field] = value;
  state.hasUnsavedChanges = true;
},

setRefundPolicy: (state, action) => {
  state.formData.refundPolicy = {
    processingFeePolicy: action.payload.processingFeePolicy || 'non-refundable',
    policyText: action.payload.policyText || ''
  };
  state.hasUnsavedChanges = true;
},

// GST Configuration with change tracking
updateGstIncluded: (state, action) => {
  state.formData.gstIncluded = action.payload;
  state.hasUnsavedChanges = true;
},
    
    // Seating Layout with change tracking
    addSeatingRow: (state) => {
      // Check if capacity is 0
      if (state.formData.capacity === 0 || state.formData.capacity === '0' || !state.formData.capacity) {
        state.capacityWarning = 'Seating events cannot have unlimited capacity. Please set a capacity limit above 0.';
        return;
      }
      
      // Smart row label generation
      let nextRowLabel = '';
      if (state.formData.seatingLayout.length > 0) {
        const lastLabel = state.formData.seatingLayout[state.formData.seatingLayout.length - 1].rowLabel;
        
        // Single uppercase letter (A-Z)
        if (/^[A-Z]$/.test(lastLabel)) {
          if (lastLabel === 'Z') {
            nextRowLabel = 'AA'; // After Z, go to AA
          } else {
            nextRowLabel = String.fromCharCode(lastLabel.charCodeAt(0) + 1);
          }
        }
        // For any other pattern (AA, VIP, etc), don't auto-generate
        else {
          nextRowLabel = '';
        }
      } else {
        // First row defaults to 'A'
        nextRowLabel = 'A';
      }
      
      // Check current total
      const currentTotal = state.formData.seatingLayout.reduce(
        (total, row) => total + row.seats.length, 0
      );
      
      if (currentTotal >= state.formData.capacity) {
        // Can't add new row - at capacity
        state.capacityWarning = `Cannot add more seats. Total seats must equal capacity (${state.formData.capacity}).`;
        return;
      }
      
      // Add row with limited seats - copy seat count from previous row if available
      const remainingCapacity = state.formData.capacity - currentTotal;
      const previousRowSeatCount = state.formData.seatingLayout.length > 0 
        ? state.formData.seatingLayout[state.formData.seatingLayout.length - 1].seats.length 
        : 10;
      const defaultSeats = Math.min(previousRowSeatCount, remainingCapacity);
      
      state.formData.seatingLayout.push({
        rowLabel: nextRowLabel,
        seats: Array(defaultSeats).fill(null).map((_, index) => ({
          seatNumber: String(index + 1),
          seatId: `${nextRowLabel}-${index + 1}`,
          status: 'available'
        }))
      });
      
      if (defaultSeats < previousRowSeatCount) {
        state.capacityWarning = `Row limited to ${defaultSeats} seats. Total must equal capacity (${state.formData.capacity})`;
      }
      
      state.hasUnsavedChanges = true;
    },
    updateRowLabel: (state, action) => {
      const { index, value } = action.payload;
      state.formData.seatingLayout[index].rowLabel = value;
      state.hasUnsavedChanges = true;
    },
    updateSeatCount: (state, action) => {
      const { rowIndex, count } = action.payload;
      
      // Calculate current total excluding this row
      const otherRowsTotal = state.formData.seatingLayout.reduce((total, row, idx) => 
        idx === rowIndex ? total : total + (row.seats?.length || 0), 0
      );
      
      // Limit count to not exceed capacity
      const maxAllowed = state.formData.capacity - otherRowsTotal;
      const actualCount = Math.min(count, Math.max(1, maxAllowed));
      
      // Update with limited count
      state.formData.seatingLayout[rowIndex].seats = Array(actualCount)
        .fill(null)
        .map((_, index) => ({
          seatNumber: String(index + 1),
          seatId: `${state.formData.seatingLayout[rowIndex].rowLabel}-${index + 1}`,
          status: 'available'
        }));
        
      // Set warning flag if count was limited
      if (count > actualCount) {
        state.capacityWarning = `Seats limited to ${actualCount}. Total seats must equal capacity (${state.formData.capacity})`;
      }
      
      state.hasUnsavedChanges = true;
    },
    removeSeatingRow: (state, action) => {
      const index = action.payload;
      state.formData.seatingLayout = state.formData.seatingLayout.filter((_, i) => i !== index);
      state.hasUnsavedChanges = true;
    },

    // Set entire seating layout at once (for modal save)
    setSeatingLayout: (state, action) => {
      state.formData.seatingLayout = action.payload;
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
      state.totalSteps = 3; // Reset to default (3 steps for free/promotional events)
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
      state.createdEvent = null; // Clear created event on form reset
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
    
    // Capacity warning management
    clearCapacityWarning: (state) => {
      state.capacityWarning = null;
    },
    // Delete status management
clearDeleteError: (state) => {
  state.deleteError = null;
},

    // Clear created event (for cleanup after sharing)
    clearCreatedEvent: (state) => {
      state.createdEvent = null;
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
        // Store created event for SuccessStep sharing
        state.createdEvent = action.payload;
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
        // Store created event for SuccessStep sharing
        state.createdEvent = action.payload;
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
        // Store updated event for SuccessStep sharing
        state.createdEvent = action.payload;

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
  // Store updated event for SuccessStep sharing
  state.createdEvent = action.payload;

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
        // Store updated event for SuccessStep sharing
        state.createdEvent = action.payload;

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
  state.deleteStatus = 'loading';
  state.deleteError = null;
})
.addCase(deleteMyEvent.fulfilled, (state, action) => {
  state.deleteStatus = 'succeeded';
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
  state.deleteStatus = 'failed';
  state.deleteError = action.payload || 'Failed to delete event';
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

  // Organizer
  updateOrganizerField,
  addOrganizerSocialMedia,
  updateOrganizerSocialMedia,
  removeOrganizerSocialMedia,
  
  // Registration fields
  addRegistrationField,
  updateRegistrationField,
  updateFieldOptions,
  removeRegistrationField,
  
  // Ticket types
  toggleIsPaid,
  toggleAdvertiseOnly,
  addTicketType,
  updateTicketType,
  removeTicketType,
  addDiscountCode,
  updateDiscountCode,
  removeDiscountCode,

  // Event Intent & Promotional Settings
  setEventIntent,
  setExternalTicketUrl,
  
// Refund policy
updateRefundPolicy,
setRefundPolicy,

// GST configuration
updateGstIncluded,

  // Seating layout
  addSeatingRow,
  updateRowLabel,
  updateSeatCount,
  removeSeatingRow,
  setSeatingLayout,

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
  
  // Capacity warning
  clearCapacityWarning,

  // Delete management
clearDeleteError,

  // Created event management
  clearCreatedEvent,

  // Form management
  resetForm,
} = eventSlice.actions;

export default eventSlice.reducer;