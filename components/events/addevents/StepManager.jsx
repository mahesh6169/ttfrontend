// components/events/addevents/StepManager.jsx

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

// Redux actions
import {
  nextStep,
  prevStep,
  setStep,
  resetForm,
  addFreeEvent,
  addPaidEvent,
  updatePaidEvent,
  updateFreeEvent,
  fetchEventById,
  setEditMode,
  clearEditMode,
  setFormErrors,
  clearFormErrors,
  setImages,
  clearSuccessMessage,
  originalEventData,
  updateField,
  toggleIsPaid,
} from '@/store/slices/events/eventSlice';
import { markCapacityStale } from '@/store/slices/events/eventCapacitySlice';

// Step Components
import StepIndicator from './StepIndicator';
import BasicInfoStep from './BasicInfoStep';
import EventDetailsStep from './EventDetailsStep';
import RegistrationStep from './RegistrationStep';
import RefundPolicyStep from './RefundPolicyStep';
import SuccessStep from './SuccessStep';

// Auth Components
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
import LoadingSpinner from '@/components/LoadingSpinner';

const StepManager = ({
  mode = 'add', // 'add' | 'edit' | 'view'
  eventId = null,
  onComplete = null,
  allowCancel = true,
  customTitle = null,
  customDescription = null,
  initialFormData = null, // New prop to pre-populate form data
}) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const {
    currentStep,
    totalSteps,
    formData,
    formErrors,
    formStatus,
    formError,
    successMessage,
    isEditMode,
    editingEventId,
    status,
  } = useSelector((state) => state.events);

  const { user } = useSelector((state) => state.user);
  const originalEventData = useSelector((state) => state.events?.originalEventData || null);

  // Local state for image files (can't store File objects in Redux)
  const [localImageFiles, setLocalImageFiles] = useState([]);
  const [localSeatingImageFiles, setLocalSeatingImageFiles] = useState([]);
  
  // Track if we're returning to step 2 to handle blob URL regeneration
  const [isReturningToImageStep, setIsReturningToImageStep] = useState(false);

  // Loading states
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState(null);

  // Derived state
  const isAddMode = mode === 'add';
  const isEditingMode = mode === 'edit';
  const isViewMode = mode === 'view';
  

  const isLoading = formStatus === 'loading' || isInitializing;
  const canEdit = !isViewMode;

  useEffect(() => {
    toast.dismiss();
  }, []);

  // Clear success messages when component unmounts or mode changes
  useEffect(() => {
    return () => {
      dispatch(clearSuccessMessage());
    };
  }, [dispatch]);

  // Regenerate blob URLs when returning to step 1 (BasicInfoStep with images)
  useEffect(() => {
    if (isReturningToImageStep && currentStep === 1 && formData.images && formData.images.length > 0 && localImageFiles.length > 0) {
      // Create file map for quick lookup
      const fileMap = new Map();
      localImageFiles.forEach(localFile => {
        fileMap.set(localFile.id, localFile);
      });
      
      // Regenerate blob URLs for all new images
      const updatedImages = formData.images.map(img => {
        if (img.isNew && fileMap.has(img.id)) {
          const localFile = fileMap.get(img.id);
          if (localFile.file instanceof File) {
            // Always create fresh blob URL when returning to step
            const newPreview = URL.createObjectURL(localFile.file);
            return { ...img, preview: newPreview };
          }
        }
        return img;
      });
      
      // Update Redux with new blob URLs
      dispatch(setImages(updatedImages));
      
      // Reset the flag
      setIsReturningToImageStep(false);
    }
  }, [currentStep, isReturningToImageStep, formData.images, localImageFiles, dispatch]);

  useEffect(() => {
    if (isEditingMode) {
      dispatch(resetForm());
      dispatch(clearEditMode());
    }
  }, [isEditingMode, dispatch]);

  // Initialize component based on mode
  useEffect(() => {
    const initializeStepManager = async () => {
      try {
        setIsInitializing(true);
        setInitializationError(null);

        if (isAddMode) {
          // Reset form for new event
          dispatch(resetForm());
          dispatch(clearEditMode());
          
          // Apply initial form data if provided
          if (initialFormData) {
            Object.entries(initialFormData).forEach(([key, value]) => {
              // Use toggleIsPaid for isPaid field to ensure totalSteps is updated
              if (key === 'isPaid') {
                dispatch(toggleIsPaid(value));
              } else {
                dispatch(updateField({ field: key, value: value }));
              }
            });
            
            // If isPaid is set, skip to step 2
            if (initialFormData.isPaid !== undefined) {
              dispatch(setStep(2));
            }
          }
        } else if (isEditingMode && eventId) {
  // Clear any existing success messages when entering edit mode
  dispatch(clearSuccessMessage());
  
  // Load existing event for editing
  if (editingEventId !== eventId) {
    const result = await dispatch(fetchEventById(eventId)).unwrap();
    dispatch(
      setEditMode({
        isEdit: true,
        eventId: eventId,
        eventData: result,
      })
    );
  }
        } else if (isViewMode && eventId) {
          // Load event for viewing (read-only)
          if (editingEventId !== eventId) {
            const result = await dispatch(fetchEventById(eventId)).unwrap();
            dispatch(
              setEditMode({
                isEdit: false,
                eventId: eventId,
                eventData: result,
              })
            );
          }
        } else {
          throw new Error(
            `Invalid configuration: mode="${mode}", eventId="${eventId}"`
          );
        }
      } catch (error) {
        console.error('StepManager initialization error:', error);
        setInitializationError(error.message || 'Failed to initialize form');
        toast.error('Failed to load event data');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeStepManager();
  }, [
    mode,
    eventId,
    dispatch,
    isAddMode,
    isEditingMode,
    isViewMode,
    editingEventId,
  ]);



  // Show error toast when submission fails
  useEffect(() => {
    if (formStatus === 'failed' && formError) {
      toast.error(formError);
    }
  }, [formStatus, formError]);

  // Handle success when form submission succeeds
  useEffect(() => {
    if (formStatus === 'succeeded' && successMessage) {
      // Success is now shown in the SuccessStep component
      // Clear the success message to prevent duplicates
      dispatch(clearSuccessMessage());

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(formData);
      }
    }
  }, [formStatus, successMessage, onComplete, formData, dispatch]);



  // Handle images change (strip files for Redux, keep locally)
  const handleImagesChange = useCallback(
    (images) => {
      // --- A. Update local File objects first ---
      setLocalImageFiles(prevFiles => {
        const existingFileMap = new Map();
        prevFiles.forEach(localFile => {
          existingFileMap.set(localFile.id, localFile);
        });
        
        // Process all current images and preserve/add File objects
        const updatedFiles = [];
        
        images.forEach((img) => {
          // Check if we already have this File object in our local state
          if (existingFileMap.has(img.id)) {
            // Preserve existing File object
            const existingFile = existingFileMap.get(img.id);
            updatedFiles.push(existingFile);
          } else if (img.isNew && img.file && img.file instanceof File) {
            // Add new File object
            const localFile = {
              file: img.file,
              id: img.id,
              name: img.file.name,
              size: img.file.size,
            };
            
            updatedFiles.push(localFile);
          }
        });
        
        return updatedFiles;
      });

      // --- B. Process images for Redux separately ---
      const safeImages = images.map((img) => {
        // Keep existing preview if it's valid
        let preview = img.preview;
        
        // For new images with File objects, ensure we have a blob URL
        if (img.isNew && img.file instanceof File) {
          // Only create blob URL if we don't have a valid one
          if (!preview || !preview.startsWith('blob:')) {
            preview = URL.createObjectURL(img.file);
          }
        }

        // Return serializable data for Redux
        return {
          preview,
          url: img.url,
          id: img.id,
          name: img.name,
          size: img.size,
          type: img.type,
          isExisting: img.isExisting,
          isNew: img.isNew,
        };
      });
      
      dispatch(setImages(safeImages));
    },
    [dispatch]
  );

  // Handle seating images change (following the same pattern as handleImagesChange)
  const handleSeatingImagesChange = useCallback(
    (images) => {
      // Update local File objects first
      setLocalSeatingImageFiles(prevFiles => {
        const existingFileMap = new Map();
        prevFiles.forEach(localFile => {
          existingFileMap.set(localFile.id, localFile);
        });
        
        const updatedFiles = [];
        images.forEach(img => {
          if (img.isNew && img.file instanceof File) {
            const existingFile = existingFileMap.get(img.id);
            if (existingFile) {
              updatedFiles.push(existingFile);
            } else {
              updatedFiles.push({
                id: img.id,
                file: img.file,
                isNew: true
              });
            }
          }
        });
        
        return updatedFiles;
      });
      
      // Strip File objects for Redux
      const safeImages = images.map(img => {
        const { file, ...safeImg } = img;
        return {
          ...safeImg,
          url: img.url,
          id: img.id,
          name: img.name,
          size: img.size,
          type: img.type,
          isExisting: img.isExisting,
          isNew: img.isNew,
        };
      });
      
      dispatch(updateField({
        field: 'seatingLayoutImage',
        value: safeImages
      }));
    },
    [dispatch]
  );

  // Form validation function
  const validateForm = useCallback(() => {
    const errors = {};

    // Basic validation
    if (!formData.title?.trim()) {
      errors.title = ['Event title is required'];
    }

    if (!formData.description?.trim()) {
      errors.description = ['Event description is required'];
    }

    if (!formData.dateTime) {
      errors.dateTime = ['Event date and time are required'];
    } else {
      // Check if date is in the future (only for new events or when changing date)
      const eventDate = new Date(formData.dateTime);
      const now = new Date();
      if (isAddMode && eventDate <= now) {
        errors.dateTime = ['Event date must be in the future'];
      }
    }

    if (!formData.venue?.trim()) {
      errors.venue = ['Venue is required'];
    }

    if (!formData.category?.trim()) {
      errors.category = ['Event category is required'];
    }

    if (!formData.timeZone?.trim()) {
      errors.timeZone = ['Event timezone is required'];
    }

    // Event intent validation
    if (!formData.eventIntent) {
      errors.eventIntent = ['Please select whether you want to promote or host this event'];
    }

    // Address validation
    if (
      !formData.address ||
      !formData.address.formattedAddress ||
      !formData.address.location ||
      !Array.isArray(formData.address.location.coordinates) ||
      formData.address.location.coordinates.length !== 2 ||
      formData.address.location.coordinates[0] === 0 ||
      formData.address.location.coordinates[1] === 0
    ) {
      errors.address = ['Valid event address with location is required'];
    }

    // Coordinator validation — Name is the anchor field
    // Error messages target a single field so the inline display only shows under that field
    if (formData.coordinators && formData.coordinators.length > 0) {
      const coordinatorErrors = [];
      formData.coordinators.forEach((coord, index) => {
        const hasName = !!coord.name?.trim();
        const hasOtherData = !!(coord.phone?.trim() || coord.email?.trim() || coord.role?.trim());

        if (hasName && !coord.phone?.trim()) {
          coordinatorErrors.push(`Coordinator ${index + 1}: Phone is required.`);
        } else if (!hasName && hasOtherData) {
          coordinatorErrors.push(`Coordinator ${index + 1}: Name is required for this coordinator.`);
        }
      });
      if (coordinatorErrors.length > 0) errors.coordinators = coordinatorErrors;
    }

    // Organiser validation — Name required; contact number is optional for all event types
    if (!formData.organizer?.name?.trim()) {
      errors.organizer = ['Organiser name is required'];
    }

    // Basic email validation for organiser if provided
    if (
      formData.organizer?.email &&
      formData.organizer.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organizer.email)
    ) {
      errors.organizer = (errors.organizer || []).concat(['Organizer email format is invalid']);
    }

    // Recurring event validation - only for non-promotional events
    if (formData.eventIntent !== 'promote' && formData.recurrence?.isRecurring) {
      if (
        !formData.recurrence.repeatSchedule ||
        formData.recurrence.repeatSchedule.length === 0
      ) {
        errors.recurrence = [
          'At least one repeat schedule is required for recurring events',
        ];
      } else {
        const recurringErrors = [];
        formData.recurrence.repeatSchedule.forEach((schedule, index) => {
          if (!schedule.day || !schedule.time) {
            recurringErrors.push(
              `Repeat schedule ${index + 1} day and time are required`
            );
          }
        });
        if (recurringErrors.length > 0) errors.recurrence = recurringErrors;
      }

      // End date validation for recurring events
      if (formData.recurrence.endDate) {
        const endDate = new Date(formData.recurrence.endDate);
        const startDate = new Date(formData.dateTime);
        if (endDate <= startDate) {
          errors.recurrence = (errors.recurrence || []).concat([
            'Recurring end date must be after the event start date',
          ]);
        }
      }
    }

    // Paid event specific validation (only for hosted paid events, not promotional)
    if (formData.isPaid && formData.eventIntent === 'host') {
      if (
        formData.capacity === '' ||
        formData.capacity === undefined ||
        formData.capacity === null ||
        isNaN(Number(formData.capacity)) ||
        Number(formData.capacity) < 0
      ) {
        errors.capacity = ['Please enter 0 for unlimited or a positive number'];
      }

      if (!formData.ticketTypes || formData.ticketTypes.length === 0) {
        errors.ticketTypes = [
          'At least one ticket type is required for paid events',
        ];
      } else {
        const ticketErrors = [];
        formData.ticketTypes.forEach((ticket, index) => {
          // Ticket name is required
          if (!ticket.name?.trim()) {
            ticketErrors.push(`Ticket type ${index + 1} name is required`);
            // Individual field error
            errors[`ticketName_${index}`] = ['Ticket Name is required'];
          }

          // Price must be greater than 0
          if (
            ticket.price === undefined ||
            ticket.price === null ||
            ticket.price === '' ||
            isNaN(Number(ticket.price)) ||
            Number(ticket.price) <= 0
          ) {
            ticketErrors.push(`Ticket type ${index + 1} price must be greater than 0`);
            // Individual field error
            errors[`ticketPrice_${index}`] = ['Price must be greater than 0'];
          }

          

          // Date validation: startDate should be before expiryDate if both are set
          const today = new Date();
today.setHours(0, 0, 0, 0); // Start of today

if (ticket.startDate) {
  const startDate = new Date(ticket.startDate);
  if (startDate < today) {
    ticketErrors.push(`Ticket type ${index + 1} start date cannot be in the past`);
    errors[`ticketStartDate_${index}`] = ['Start date cannot be in the past'];
  }
}

if (ticket.expiryDate) {
  const expiryDate = new Date(ticket.expiryDate);
  if (expiryDate < today) {
    ticketErrors.push(`Ticket type ${index + 1} expiry date cannot be in the past`);
    errors[`ticketExpiryDate_${index}`] = ['Expiry date cannot be in the past'];
  }
}



if (ticket.startDate && ticket.expiryDate) {
  const startDate = new Date(ticket.startDate);
  const expiryDate = new Date(ticket.expiryDate);
  if (startDate >= expiryDate) {
    ticketErrors.push(
      `Ticket type ${index + 1} start date must be before expiry date`
    );
  }
}
        });

        if (ticketErrors.length > 0) errors.ticketTypes = ticketErrors;
      }

      // Seating layout validation (if provided)
      if (formData.seatingLayout && formData.seatingLayout.length > 0) {
        const seatingErrors = [];
        
        // Check if capacity is 0 when seating layout exists
        if (!formData.capacity || formData.capacity === 0 || formData.capacity === '0') {
          seatingErrors.push('Seating events cannot have unlimited capacity. Please set a capacity limit above 0.');
        } else {
          // Check if total seats match capacity exactly
          const totalSeats = formData.seatingLayout.reduce(
            (total, row) => total + (row.seats?.length || 0), 0
          );
          if (totalSeats !== Number(formData.capacity)) {
            seatingErrors.push(`For seated events, capacity must match total seats. Current: ${totalSeats} seats, ${formData.capacity} capacity`);
          }
        }
        
        formData.seatingLayout.forEach((row, index) => {
          if (!row.rowLabel?.trim()) {
            seatingErrors.push(`Row ${index + 1} label is required`);
          }
          if (!row.seats || row.seats.length === 0) {
            seatingErrors.push(`Row ${index + 1} must have at least one seat`);
          }
        });
        if (seatingErrors.length > 0) errors.seatingLayout = seatingErrors;
      }
       // Organizer reserved seats validation
      if (formData.organizerReservedSeats && formData.organizerReservedSeats.trim()) {
        const reservedSeatsStr = formData.organizerReservedSeats.trim();
        const seatPattern = /^[A-Z]+\d+(-[A-Z]+\d+)?$/; // Matches A1 or A7-A9
        const parts = reservedSeatsStr.split(',').map(part => part.trim()).filter(Boolean);
        
        const invalidSeats = parts.filter(part => !seatPattern.test(part));
        if (invalidSeats.length > 0) {
          errors.organizerReservedSeats = [
            `Invalid seat format. Use individual seats (A1,A3) or ranges (A7-A9,A12). Invalid: ${invalidSeats.join(', ')}`
          ];
        }
      }
    } else {
      // Free event specific validation - skip if promotional or advertise-only
      const isPromotional = formData.eventIntent === 'promote' || formData.isAdvertiseOnly;
      if (!isPromotional) {
        if (formData.capacity && formData.capacity < 0) {
          errors.capacity = ['Event capacity cannot be negative'];
        }
        if (
          !formData.maxAttendeesPerRegistration ||
          formData.maxAttendeesPerRegistration === '' ||
          Number(formData.maxAttendeesPerRegistration) < 1
        ) {
          errors.maxAttendeesPerRegistration = [
            'Number should be 1 or above',
          ];
        }
      }
    }

    // Custom registration fields validation - skip if promotional or advertise-only
    const isPromotionalEvent = formData.eventIntent === 'promote' || formData.isAdvertiseOnly;
    if (!isPromotionalEvent && formData.registrationFields && formData.registrationFields.length > 0) {
      const fieldErrors = [];
      formData.registrationFields.forEach((field, index) => {
        if (!field.fieldName?.trim()) {
          fieldErrors.push(`Registration field ${index + 1} name is required`);
        }
      });
      if (fieldErrors.length > 0) errors.registrationFields = fieldErrors;
    }

    return errors;
  }, [formData, isAddMode]);

// Step validation for new step structure:
// Step 1: Basic Info (intent, free/paid, title, datetime, recurring, timezone, venue, address)
// Step 2: Event Details (category, description, organizer, coordinators)
// Step 3: Registration (registration config based on intent)
// Step 4: Refund Policy (only for host + paid)
const validateCurrentStep = useCallback(() => {
  const errors = {};

  switch (currentStep) {
    case 1: // Basic Info - Intent, Free/Paid, Title, Date/Time, Recurring, Timezone, Venue, Address
      // Intent is required first
      if (!formData.eventIntent) {
        errors.eventIntent = ['Please select whether you want to promote or host this event'];
      }
      if (!formData.title?.trim()) errors.title = ['Event title is required'];
      if (!formData.dateTime) {
        errors.dateTime = ['Event date and time are required'];
      } else if (isAddMode) {
        const eventDate = new Date(formData.dateTime);
        const now = new Date();
        if (eventDate <= now) {
          errors.dateTime = ['Event date must be in the future'];
        }
      }
      if (!formData.timeZone?.trim()) errors.timeZone = ['Event timezone is required'];

      // Recurring event validation (only for host + free events)
      if (formData.eventIntent === 'host' && !formData.isPaid && formData.recurrence?.isRecurring) {
        if (!formData.recurrence.repeatSchedule || formData.recurrence.repeatSchedule.length === 0) {
          errors.recurrence = ['At least one repeat schedule is required for recurring events'];
        } else {
          const recurringErrors = [];
          formData.recurrence.repeatSchedule.forEach((schedule, index) => {
            if (!schedule.day || !schedule.time) {
              recurringErrors.push(`Repeat schedule ${index + 1} day and time are required`);
            }
          });
          if (recurringErrors.length > 0) errors.recurrence = recurringErrors;
        }

        // End date validation for recurring events
        if (!formData.recurrence.endDate) {
          errors.recurrence = (errors.recurrence || []).concat([
            'End date is required for recurring events',
          ]);
        } else {
          const endDate = new Date(formData.recurrence.endDate);
          const startDate = new Date(formData.dateTime);
          if (endDate <= startDate) {
            errors.recurrence = (errors.recurrence || []).concat([
              'Recurring end date must be after the event start date',
            ]);
          }
        }
      }

      if (!formData.venue?.trim()) errors.venue = ['Venue is required'];
      if (
        !formData.address ||
        !formData.address.formattedAddress?.trim() ||
        !formData.address.location ||
        !Array.isArray(formData.address.location.coordinates) ||
        formData.address.location.coordinates.length !== 2 ||
        formData.address.location.coordinates[0] === 0 ||
        formData.address.location.coordinates[1] === 0
      ) {
        errors.address = ['Valid event address with location is required'];
      }
      break;

    case 2: // Event Details - Category, Description, Organizer, Coordinators
      if (!formData.category?.trim()) errors.category = ['Event category is required'];
      if (!formData.description?.trim())
        errors.description = ['Event description is required'];

      // Organiser validation — Name required; contact number is optional for all event types
      if (!formData.organizer?.name?.trim()) {
        errors.organizer = ['Organiser name is required'];
      }

      // Coordinators validation — Name is the anchor field
      // Error messages target a single field so the inline display only shows under that field
      if (formData.coordinators && formData.coordinators.length > 0) {
        const coordinatorErrors = [];
        formData.coordinators.forEach((coord, index) => {
          const hasName = !!coord.name?.trim();
          const hasOtherData = !!(coord.phone?.trim() || coord.email?.trim() || coord.role?.trim());

          if (hasName && !coord.phone?.trim()) {
            coordinatorErrors.push(`Coordinator ${index + 1}: Phone is required.`);
          } else if (!hasName && hasOtherData) {
            coordinatorErrors.push(`Coordinator ${index + 1}: Name is required for this coordinator.`);
          }
        });
        if (coordinatorErrors.length > 0) errors.coordinators = coordinatorErrors;
      }
      break;

    case 3: // Registration - registration/ticket config based on intent
      // Promotional event validation - isPaid must be explicitly set (not null)
      if (formData.eventIntent === 'promote') {
        if (formData.isPaid === null) {
          errors.isPaid = ['Please select whether this is a free or paid event'];
        }
        // External URL is optional, no validation needed
      }

      // Hosted event validation
      if (formData.eventIntent === 'host') {
        if (formData.isPaid) {
          // Paid event: Capacity, booking limit, ticket types required
          if (
            formData.capacity === '' ||
            formData.capacity === undefined ||
            formData.capacity === null
          ) {
            errors.capacity = ['Event capacity is required'];
          }

          if (
            formData.maxAttendeesPerRegistration === undefined ||
            formData.maxAttendeesPerRegistration === null ||
            formData.maxAttendeesPerRegistration === ''
          ) {
            errors.maxAttendeesPerRegistration = ['Booking limit is required'];
          }

          // Seating layout validation
          if (formData.seatingLayout && formData.seatingLayout.length > 0) {
            const seatingErrors = [];
            const totalSeats = formData.seatingLayout.reduce(
              (total, row) => total + (row.seats?.length || 0), 0
            );

            if (formData.capacity && Number(formData.capacity) > 0) {
              if (totalSeats !== Number(formData.capacity)) {
                seatingErrors.push(`For seated events, capacity must match total seats. Current: ${totalSeats} seats, ${formData.capacity} capacity`);
              }
            }

            formData.seatingLayout.forEach((row, index) => {
              if (!row.rowLabel?.trim()) {
                seatingErrors.push(`Row ${index + 1} label is required`);
              }
              if (!row.seats || row.seats.length === 0) {
                seatingErrors.push(`Row ${index + 1} must have at least one seat`);
              }
            });

            if (seatingErrors.length > 0) errors.seatingLayout = seatingErrors;
          }

          // Ticket types validation
          if (!formData.ticketTypes || formData.ticketTypes.length === 0) {
            errors.ticketTypes = ['At least one ticket type is required for paid events'];
          } else {
            formData.ticketTypes.forEach((ticket, index) => {
              if (!ticket.name?.trim()) {
                errors[`ticketName_${index}`] = ['Ticket name is required'];
              }
              if (
                ticket.price === undefined ||
                ticket.price === null ||
                ticket.price === ''
              ) {
                errors[`ticketPrice_${index}`] = ['Ticket price is required'];
              }
            });
          }
        } else {
          // Free hosted event: Capacity and booking limit required
          if (
            formData.maxAttendeesPerRegistration === undefined ||
            formData.maxAttendeesPerRegistration === null ||
            formData.maxAttendeesPerRegistration === ''
          ) {
            errors.maxAttendeesPerRegistration = ['Booking limit is required'];
          }
        }
      }
      break;

    case 4: // Refund Policy - Only for hosted paid events
      if (formData.eventIntent === 'host' && formData.isPaid) {
        if (!formData.refundPolicy?.processingFeePolicy) {
          errors.refundPolicy = ['Please select a refund policy option'];
        }
      }
      break;

    default:
      break;
  }

  return errors;
}, [currentStep, formData, isAddMode]);


const isNextButtonDisabled = useCallback(() => {
  return isLoading;
}, [isLoading]);

// Add this helper function before prepareSubmissionData
const calculateRecurringUtcDateTimes = useCallback((recurrence, eventDateTime, timeZone) => {
  if (!recurrence?.isRecurring || !recurrence.repeatSchedule?.length) {
    return recurrence;
  }

  const processedSchedule = recurrence.repeatSchedule.map(schedule => {
    try {
      // Parse the main event date to get the week reference
      const eventDate = new Date(eventDateTime);
      
      // Find the next occurrence of this day from the event date
      const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
      const targetDay = dayMap[schedule.day];
      const eventDay = eventDate.getDay();
      
      // Calculate days to add to get to the target day
      let daysToAdd = targetDay - eventDay;
      if (daysToAdd < 0) daysToAdd += 7; // Next week if day already passed
      
      // Create a date for this recurring schedule
      const scheduleDate = new Date(eventDate);
      scheduleDate.setDate(scheduleDate.getDate() + daysToAdd);
      
      // Parse the time and set it
      const [hours, minutes] = schedule.time.split(':').map(Number);
      scheduleDate.setHours(hours, minutes, 0, 0);
      
      // Convert to UTC using the event's timezone
      const utcDateTime = zonedTimeToUtc(scheduleDate, timeZone);
      
      console.log(`🔄 Calculated utcDateTime for ${schedule.day} ${schedule.time}:`, utcDateTime.toISOString());
      
      return {
        ...schedule,
        utcDateTime: utcDateTime.toISOString(),
        timeZone: timeZone
      };
    } catch (error) {
      console.error('❌ Error calculating utcDateTime for schedule:', schedule, error);
      return schedule;
    }
  });

  return {
    ...recurrence,
    repeatSchedule: processedSchedule
  };
}, []);

  // Prepare form data for submission
  const prepareSubmissionData = useCallback(() => {
    const submitFormData = new FormData();

    // Basic event details
    if (formData.title) {
      submitFormData.append('title', formData.title);
    }

    if (formData.description) {
      submitFormData.append('description', formData.description);
    }

    if (formData.venue) {
      submitFormData.append('venue', formData.venue);
    }

    if (formData.category) {
      submitFormData.append('category', formData.category);
    }

    if (formData.communities && formData.communities.length > 0) {
      submitFormData.append('communities', JSON.stringify(formData.communities));
    }

if (formData.dateTime) {
  let finalDateTime = formData.dateTime;
  
  if (formData.timeZone) {
    try {
      // 🔧 FIX: In edit mode, check if datetime actually changed
      if (isEditMode && originalEventData?.dateTime) {
        console.log('🔍 Edit mode datetime handling:');
        console.log('  Current form value:', formData.dateTime);
        console.log('  Original UTC value:', originalEventData.dateTime);
        
        // Convert original UTC back to local format for comparison
        const originalLocal = utcToZonedTime(originalEventData.dateTime, formData.timeZone);
        const originalFormatted = format(originalLocal, 'yyyy-MM-dd\'T\'HH:mm');
        
        console.log('  Original as local:', originalFormatted);
        
        if (formData.dateTime === originalFormatted) {
          // ✅ No change detected - preserve original UTC to avoid conversion errors
          finalDateTime = originalEventData.dateTime;
          console.log('✅ No change detected, preserving original UTC:', finalDateTime);
        } else {
          // 🔄 User changed the time - convert new time to UTC
          const utcDateTime = zonedTimeToUtc(formData.dateTime, formData.timeZone);
          finalDateTime = utcDateTime.toISOString();
          console.log('🔄 Change detected, converting to UTC:', finalDateTime);
        }
      } else {
        // 🆕 New event or no original data - convert to UTC normally
        const utcDateTime = zonedTimeToUtc(formData.dateTime, formData.timeZone);
        finalDateTime = utcDateTime.toISOString();
        console.log('🆕 New event, converting to UTC:', finalDateTime);
      }
    } catch (error) {
      console.error('❌ DateTime conversion error:', error);
      // 🛡️ Fallback: use original if available, otherwise basic conversion
      finalDateTime = (isEditMode && originalEventData?.dateTime) 
        ? originalEventData.dateTime 
        : new Date(formData.dateTime).toISOString();
      console.log('🛡️ Using fallback datetime:', finalDateTime);
    }
  }
  
  submitFormData.append('dateTime', finalDateTime);
}


    if (formData.timeZone) {
      submitFormData.append('timeZone', formData.timeZone);
    }

    // Address - send as JSON string
    if (formData.address) {
      submitFormData.append('address', JSON.stringify(formData.address));
    }

    // Coordinators - send as JSON string
    if (formData.coordinators && formData.coordinators.length > 0) {
      submitFormData.append('coordinators', JSON.stringify(formData.coordinators));
    }

     // Organizer - send as JSON string
    if (formData.organizer) {
      submitFormData.append('organizer', JSON.stringify(formData.organizer));
    }

    // Event type
    submitFormData.append('isPaid', formData.isPaid ? 'true' : 'false');

    // Event intent and promotional fields
    if (formData.eventIntent) {
      submitFormData.append('eventIntent', formData.eventIntent);
    }
    if (formData.externalTicketUrl) {
      submitFormData.append('externalTicketUrl', formData.externalTicketUrl);
    }

    // Free event specific fields
    if (!formData.isPaid) {
      // Add isAdvertiseOnly flag
      submitFormData.append('isAdvertiseOnly', formData.isAdvertiseOnly ? 'true' : 'false');
      
      if (formData.capacity !== undefined && formData.capacity !== null) {
        submitFormData.append('capacity', formData.capacity.toString());
      }

      if (formData.maxAttendeesPerRegistration) {
        submitFormData.append('maxAttendeesPerRegistration', formData.maxAttendeesPerRegistration.toString());
      }
    }

    // Paid event specific fields
    if (formData.isPaid) {
      if (formData.capacity !== undefined && formData.capacity !== null) {
        submitFormData.append('capacity', formData.capacity.toString());
      }

      if (formData.maxAttendeesPerRegistration !== undefined && formData.maxAttendeesPerRegistration !== null) {
        submitFormData.append('maxAttendeesPerRegistration', formData.maxAttendeesPerRegistration.toString());
      }

      if (formData.ticketTypes && formData.ticketTypes.length > 0) {
  // 🔧 NEW: Process ticket dates with timezone conversion
  const processedTicketTypes = formData.ticketTypes.map(ticket => {
    const processedTicket = { ...ticket };
    
    // Process startDate - convert to UTC start of day
    if (ticket.startDate && formData.timeZone) {
      try {
        // Check if this is edit mode and compare with original
        let finalStartDate = ticket.startDate;
        
        if (isEditMode && originalEventData?.ticketTypes) {
          const originalTicket = originalEventData.ticketTypes.find(t => t.name === ticket.name);
          if (originalTicket?.startDate) {
            // Convert original UTC to local for comparison
            const originalLocal = utcToZonedTime(originalTicket.startDate, formData.timeZone);
            const originalFormatted = format(originalLocal, 'yyyy-MM-dd');
            
            if (ticket.startDate === originalFormatted) {
              // No change detected - preserve original UTC
              finalStartDate = originalTicket.startDate;
              console.log('✅ Ticket startDate unchanged, preserving UTC:', finalStartDate);
            } else {
              // User changed the date - convert to UTC start of day
              const utcStartOfDay = zonedTimeToUtc(ticket.startDate + 'T00:00:00', formData.timeZone);
              finalStartDate = utcStartOfDay.toISOString();
              console.log('🔄 Ticket startDate changed, converting to UTC:', finalStartDate);
            }
          } else {
            // New startDate in edit mode
            const utcStartOfDay = zonedTimeToUtc(ticket.startDate + 'T00:00:00', formData.timeZone);
            finalStartDate = utcStartOfDay.toISOString();
            console.log('🆕 New ticket startDate in edit, converting to UTC:', finalStartDate);
          }
        } else {
          // Add mode - convert to UTC start of day
          const utcStartOfDay = zonedTimeToUtc(ticket.startDate + 'T00:00:00', formData.timeZone);
          finalStartDate = utcStartOfDay.toISOString();
          console.log('🆕 New ticket startDate, converting to UTC:', finalStartDate);
        }
        
        processedTicket.startDate = finalStartDate;
      } catch (error) {
        console.error('❌ Ticket startDate conversion error:', error);
        processedTicket.startDate = ticket.startDate;
      }
    }
    
    // Process expiryDate - convert to UTC end of day
    if (ticket.expiryDate && formData.timeZone) {
      try {
        // Check if this is edit mode and compare with original
        let finalExpiryDate = ticket.expiryDate;
        
        if (isEditMode && originalEventData?.ticketTypes) {
          const originalTicket = originalEventData.ticketTypes.find(t => t.name === ticket.name);
          if (originalTicket?.expiryDate) {
            // Convert original UTC to local for comparison
            const originalLocal = utcToZonedTime(originalTicket.expiryDate, formData.timeZone);
            const originalFormatted = format(originalLocal, 'yyyy-MM-dd');
            
            if (ticket.expiryDate === originalFormatted) {
              // No change detected - preserve original UTC
              finalExpiryDate = originalTicket.expiryDate;
              console.log('✅ Ticket expiryDate unchanged, preserving UTC:', finalExpiryDate);
            } else {
              // User changed the date - convert to UTC end of day
              const utcEndOfDay = zonedTimeToUtc(ticket.expiryDate + 'T23:59:59', formData.timeZone);
              finalExpiryDate = utcEndOfDay.toISOString();
              console.log('🔄 Ticket expiryDate changed, converting to UTC:', finalExpiryDate);
            }
          } else {
            // New expiryDate in edit mode
            const utcEndOfDay = zonedTimeToUtc(ticket.expiryDate + 'T23:59:59', formData.timeZone);
            finalExpiryDate = utcEndOfDay.toISOString();
            console.log('🆕 New ticket expiryDate in edit, converting to UTC:', finalExpiryDate);
          }
        } else {
          // Add mode - convert to UTC end of day
          const utcEndOfDay = zonedTimeToUtc(ticket.expiryDate + 'T23:59:59', formData.timeZone);
          finalExpiryDate = utcEndOfDay.toISOString();
          console.log('🆕 New ticket expiryDate, converting to UTC:', finalExpiryDate);
        }
        
        processedTicket.expiryDate = finalExpiryDate;
      } catch (error) {
        console.error('❌ Ticket expiryDate conversion error:', error);
        processedTicket.expiryDate = ticket.expiryDate;
      }
    }
    
    return processedTicket;
  });
  
  submitFormData.append('ticketTypes', JSON.stringify(processedTicketTypes));
}

      if (formData.seatingLayout && formData.seatingLayout.length > 0) {
        submitFormData.append('seatingLayout', JSON.stringify(formData.seatingLayout));
      }

console.log("🔍 Debug organizerReservedSeats:", {
  value: formData.organizerReservedSeats,
  type: typeof formData.organizerReservedSeats,
  length: formData.organizerReservedSeats?.length,
  isPaid: formData.isPaid
})

       if (formData.organizerReservedSeats) {
        submitFormData.append('organizerReservedSeats', formData.organizerReservedSeats);
      }

      if (formData.stripeAccountId) {
        submitFormData.append('stripeAccountId', formData.stripeAccountId);
      }
      
       if (formData.refundPolicy) {
    submitFormData.append('refundPolicy', JSON.stringify(formData.refundPolicy));
  }
  if (formData.gstIncluded !== undefined) {
        submitFormData.append('gstIncluded', formData.gstIncluded ? 'true' : 'false');
      }
    }

    // Recurring event fields
if (formData.recurrence && formData.recurrence.isRecurring) {
  console.log('🔄 BEFORE calculateRecurringUtcDateTimes:', JSON.stringify(formData.recurrence));
  
  // Calculate utcDateTime for each schedule before sending
  const processedRecurrence = calculateRecurringUtcDateTimes(
    formData.recurrence, 
    formData.dateTime, 
    formData.timeZone
  );
  
  console.log('✅ AFTER calculateRecurringUtcDateTimes:', JSON.stringify(processedRecurrence));
  
  // Verify utcDateTime is present in all schedules
  const allHaveUtc = processedRecurrence.repeatSchedule.every(s => s.utcDateTime);
  if (!allHaveUtc) {
    console.error('❌ CRITICAL: Some schedules missing utcDateTime!');
    processedRecurrence.repeatSchedule.forEach((s, i) => {
      console.log(`Schedule ${i}:`, JSON.stringify(s));
    });
  } else {
    console.log('✅ All schedules have utcDateTime');
  }
  
  submitFormData.append('recurrence', JSON.stringify(processedRecurrence));
}

    // Registration fields
    if (formData.registrationFields && formData.registrationFields.length > 0) {
      submitFormData.append('registrationFields', JSON.stringify(formData.registrationFields));
    }
    
    // Add ALL new image files
    if (localImageFiles && localImageFiles.length > 0) {
      localImageFiles.forEach(({ file, name }) => {
        // Validate that file is actually a File object
        if (file instanceof File) {
          submitFormData.append('images', file, name);
        }
      });
    }

    // Add existing image data for backend processing
    const existingImages = (formData.images || []).filter(
      (image) => image.isExisting
    );
    
    if (existingImages.length > 0) {
      submitFormData.append('existingImages', JSON.stringify(existingImages));
    }
    
    // Handle seating layout images for paid events (now supports multiple)
    console.log('🪑 Checking seating images:', {
      isPaid: formData.isPaid,
      seatingLayoutImage: formData.seatingLayoutImage,
      seatingLayoutImageLength: formData.seatingLayoutImage ? formData.seatingLayoutImage.length : 0,
      localSeatingImageFiles: localSeatingImageFiles
    });
    
    if (formData.isPaid && formData.seatingLayoutImage && formData.seatingLayoutImage.length > 0) {
      const seatingImages = Array.isArray(formData.seatingLayoutImage) 
        ? formData.seatingLayoutImage 
        : [formData.seatingLayoutImage];
      
      console.log('🪑 Preparing seating images for submission:', {
        seatingImages: seatingImages.length,
        localSeatingImageFiles: localSeatingImageFiles.length,
        seatingImagesData: seatingImages
      });
      
      // Get new images that need file upload
      const newSeatingImages = seatingImages.filter(img => img.isNew);
      const existingSeatingImages = seatingImages.filter(img => img.isExisting);
      
      console.log('🪑 New seating images to upload:', newSeatingImages.length);
      console.log('🪑 Existing seating images:', existingSeatingImages.length);
      
      // Append new files from local state
      newSeatingImages.forEach(img => {
        const localFile = localSeatingImageFiles.find(f => f.id === img.id);
        console.log('🪑 Looking for file with id:', img.id, 'Found:', !!localFile);
        if (localFile && localFile.file) {
          console.log('🪑 Appending seating file:', localFile.file.name);
          submitFormData.append('seatingLayoutImageFiles', localFile.file);
        }
      });
      
      // Send existing images metadata
      if (existingSeatingImages.length > 0) {
        submitFormData.append('existingSeatingLayoutImages', JSON.stringify(
          existingSeatingImages.map(img => ({
            url: img.url,
            publicId: img.publicId
          }))
        ));
      }
    }

    // Debug log to see all FormData entries
    console.log('📋 Final FormData entries:');
    for (let [key, value] of submitFormData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File - ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}:`, value);
      }
    }
    
    return submitFormData;
  }, [formData, localImageFiles, localSeatingImageFiles, isEditMode, originalEventData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Validate form before submission
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      dispatch(setFormErrors(validationErrors));

      // Show toast with all errors
      const errorMessages = Object.values(validationErrors).flat();
      toast.error(
        <div>
          <p className="font-bold">Please fix the following errors:</p>
          <ul className="list-disc pl-4">
            {errorMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    // Clear previous errors
    dispatch(clearFormErrors());

    // Prepare form data for submission
    const submitFormData = prepareSubmissionData();

    try {
      // Determine if this is a hosted paid event (not promotional)
      const isHostedPaid = formData.eventIntent === 'host' && formData.isPaid;

      if (isEditingMode) {
        // Update existing event - choose the appropriate thunk based on event type
        if (isHostedPaid) {
          await dispatch(
            updatePaidEvent({
              eventId: editingEventId,
              formData: submitFormData,
            })
          ).unwrap();
          // Mark capacity as stale so it refreshes
          dispatch(markCapacityStale(editingEventId));
          // Revalidate metadata cache for WhatsApp sharing
          try {
            await fetch('/api/revalidate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tag: `event-${editingEventId}` })
            });
          } catch (error) {
            console.error('Failed to revalidate metadata:', error);
          }
        } else {
          await dispatch(
            updateFreeEvent({
              eventId: editingEventId,
              formData: submitFormData,
            })
          ).unwrap();
          // Mark capacity as stale so it refreshes
          dispatch(markCapacityStale(editingEventId));
          // Revalidate metadata cache for WhatsApp sharing
          try {
            await fetch('/api/revalidate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tag: `event-${editingEventId}` })
            });
          } catch (error) {
            console.error('Failed to revalidate metadata:', error);
          }
        }
      } else {
        // Create new event - choose the appropriate thunk based on event type
        // Promotional events always use free endpoint (even if promoting a paid event)
        if (isHostedPaid) {
          await dispatch(addPaidEvent(submitFormData)).unwrap();
        } else {
          await dispatch(addFreeEvent(submitFormData)).unwrap();
        }
      }
      // Success is handled by the useEffect above
    } catch (error) {
      // Error is handled by the reducer and useEffect above
      console.error('Form submission error:', error);
    }
  }, [
    validateForm,
    dispatch,
    prepareSubmissionData,
    isEditingMode,
    editingEventId,
    formData.isPaid,
    formData.eventIntent,
  ]);

  // Handle step navigation

const handleNext = useCallback(() => {
  // Validate current step
  const currentErrors = validateCurrentStep();

  if (Object.keys(currentErrors).length > 0) {
    dispatch(setFormErrors(currentErrors));



    // Show specific error messages instead of generic message
    const errorMessages = Object.values(currentErrors).flat();
    const errorCount = errorMessages.length;
    
    toast.error(
      <div>
        <p className="font-bold">
          {errorCount === 1 
            ? 'Please fix the following error:' 
            : `Please fix the following ${errorCount} errors:`
          }
        </p>
        <ul className="list-disc pl-4 mt-2">
          {errorMessages.map((msg, i) => (
            <li key={i} className="text-sm">{msg}</li>
          ))}
        </ul>
      </div>
    );
    return;
  }

  // Clear errors and proceed
  dispatch(clearFormErrors());
  dispatch(nextStep());
  window.scrollTo(0, 0);
}, [currentStep, validateCurrentStep, dispatch]);

  const handlePrev = useCallback(() => {
    dispatch(clearFormErrors());

    // Set flag when returning to step 1 (BasicInfoStep with images)
    if (currentStep === 2) {
      setIsReturningToImageStep(true);
    }

    dispatch(prevStep());
    window.scrollTo(0, 0);
  }, [dispatch, currentStep]);

  const handleCancel = useCallback(() => {
    if (allowCancel) {
      if (isAddMode) {
        dispatch(resetForm());
      }
      
      // Check for stored redirect URL
      const storedRedirect = localStorage.getItem('cancelRedirectUrl');
      
      if (storedRedirect) {
        // Use stored redirect and clean up
        localStorage.removeItem('cancelRedirectUrl');
        router.push(storedRedirect);
      } else {
        // Default to events page
        router.push('/events');
      }
    }
  }, [allowCancel, isAddMode, dispatch, router]);

const handleAddAnother = useCallback(() => {
  // Give user feedback before resetting
  toast.info('Preparing new event form...');
  
  // Small delay for better UX
  setTimeout(() => {
    dispatch(resetForm());
    // Don't navigate if we're already in add mode
    if (!isAddMode) {
      router.push('/events/add');
    }
  }, 800);
}, [dispatch, isAddMode, router]);

  const handleManageEvents = useCallback(() => {
    dispatch(resetForm()); // Always reset form, for both add and edit
    router.push('/users/profile/manageevents');
  }, [dispatch, router]);

  const handleViewEvent = useCallback(() => {
  if (editingEventId) {
    // Navigate to the event view page
    router.push(`/events/views/${editingEventId}`);
  } else {
    console.warn('No event ID available for navigation');
    toast.error('Unable to navigate to event page');
  }
}, [editingEventId, router]);

  // Show loading spinner during initialization
  if (isInitializing) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <RequireVerifiedAccount>
          <div className="flex flex-col items-center justify-center min-h-64">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-slate-600">Loading event data...</p>
          </div>
        </RequireVerifiedAccount>
      </div>
    );
  }

  // Show error if initialization failed
  if (initializationError) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <RequireVerifiedAccount>
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Error Loading Event
              </h2>
              <p className="text-red-600 mb-4">{initializationError}</p>
              <button
                onClick={() => router.push('/events')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Back to Events
              </button>
            </div>
          </div>
        </RequireVerifiedAccount>
      </div>
    );
  }

  // Render success step when form submission succeeds
  if (formStatus === 'succeeded') {


    return (
      <div className="p-8 max-w-4xl mx-auto">
        <RequireVerifiedAccount>
          <SuccessStep
            event={formData}
            mode={mode}
            onAddAnother={handleAddAnother}
            onManageEvents={handleManageEvents}
             onViewEvent={handleViewEvent}
          />
        </RequireVerifiedAccount>
      </div>
    );
  }

  return (
    <div className="px-0 py-4 sm:px-4 max-w-4xl mx-auto">
      <RequireVerifiedAccount message="You must be logged in to manage events.">

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* Step Content */}
        <div className="mt-8 bg-white p-3 sm:p-6 rounded-lg shadow-md border border-slate-200">
           {/* Step 1: Basic Info - Title, Date/Time, Venue, Address, Images */}
  {currentStep === 1 && (
    <BasicInfoStep
      formData={formData}
      errors={formErrors}
      onImagesChange={handleImagesChange}
      mode={mode}
      readOnly={isViewMode}
    />
  )}

  {/* Step 2: Event Details - Category, Description, Recurring, Organizer, Coordinators */}
  {currentStep === 2 && (
    <EventDetailsStep
      formData={formData}
      errors={formErrors}
      mode={mode}
      readOnly={isViewMode}
    />
  )}

  {/* Step 3: Registration - Intent selection + registration/ticket config */}
  {currentStep === 3 && (
    <RegistrationStep
      formData={formData}
      errors={formErrors}
      mode={mode}
      readOnly={isViewMode}
      onSeatingImagesChange={handleSeatingImagesChange}
    />
  )}

  {/* Step 4: Refund Policy - Only for hosted paid events */}
  {currentStep === 4 && formData.eventIntent === 'host' && formData.isPaid && (
    <RefundPolicyStep
      formData={formData}
      errors={formErrors}
      mode={mode}
      readOnly={isViewMode}
    />
  )}

          {/* Navigation */}
          {!isViewMode && (
            <div className="mt-8 flex justify-between items-center">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isLoading}
                  className="text-sm text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="text-sm text-teal-700 hover:text-teal-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`px-6 py-2 text-sm sm:text-base rounded-lg transition-colors flex items-center gap-2 ${
                    isLoading
                      ? 'bg-slate-400 cursor-not-allowed text-white'
                      : 'bg-teal-700 hover:bg-teal-800 text-white'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {isEditingMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : isEditingMode ? (
                    'Update'
                  ) : (
                    'Create'
                  )}
                </button>
              )}
            </div>
          )}

          {/* View Mode Navigation */}
          {isViewMode && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => router.push('/events')}
                className="px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
              >
                Back to Events
              </button>
            </div>
          )}
        </div>
      </RequireVerifiedAccount>
    </div>
  );
};

export default StepManager;