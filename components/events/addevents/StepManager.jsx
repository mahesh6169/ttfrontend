// components/events/addevents/StepManager.jsx

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { zonedTimeToUtc } from 'date-fns-tz';

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
} from '@/store/slices/events/eventSlice';

// Step Components
import StepIndicator from './StepIndicator';
import EventDetailsStep from './EventDetailsStep';
import OrganiserDetailsStep from './OrganiserDetailsStep';
import EventTypeStep from './EventTypeStep';
import TicketConfigStep from './TicketConfigStep';
import RefundPolicyStep from './RefundPolicyStep';
import SuccessStep from './SuccessStep';

// Auth Components
import RequireLogin from '@/components/Auth/RequireLogin';
import LoadingSpinner from '@/components/LoadingSpinner';

const StepManager = ({
  mode = 'add', // 'add' | 'edit' | 'view'
  eventId = null,
  onComplete = null,
  allowCancel = true,
  customTitle = null,
  customDescription = null,
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

  // Local state for image files (can't store File objects in Redux)
  const [localImageFiles, setLocalImageFiles] = useState([]);

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

  // Show success toast when form submission succeeds
  useEffect(() => {
    if (formStatus === 'succeeded' && successMessage) {
      toast.success(successMessage);

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(formData);
      }
    }
  }, [formStatus, successMessage, onComplete, formData]);

  // Handle images change (strip files for Redux, keep locally)
  const handleImagesChange = useCallback(
    (images) => {
      // --- A. Sync Redux images (only metadata, no File object) ---
      const safeImages = images.map((img) => ({
        preview: img.preview,
        url: img.url,
        id: img.id,
        name: img.name,
        size: img.size,
        type: img.type,
        isExisting: img.isExisting,
        isNew: img.isNew,
      }));
      
      dispatch(setImages(safeImages));

      // --- B. Preserve existing File objects + add new ones ---
      setLocalImageFiles(prevFiles => {
        // Create a map of existing File objects by ID for quick lookup
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

    // Coordinator validation
    if (!formData.coordinators || formData.coordinators.length === 0) {
      errors.coordinators = ['At least one event coordinator is required'];
    } else {
      const coordinatorErrors = [];
      formData.coordinators.forEach((coord, index) => {
        if (!coord.name?.trim() || !coord.phone?.trim()) {
          coordinatorErrors.push(
            `Coordinator ${index + 1} name and phone are required`
          );
        }
        // Basic phone validation
        if (coord.phone && !/^[\d\s\-\+\(\)]+$/.test(coord.phone)) {
          coordinatorErrors.push(
            `Coordinator ${index + 1} phone number format is invalid`
          );
        }
        // Basic email validation if provided
        if (
          coord.email &&
          coord.email.trim() &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coord.email)
        ) {
          coordinatorErrors.push(
            `Coordinator ${index + 1} email format is invalid`
          );
        }
      });
      if (coordinatorErrors.length > 0) errors.coordinators = coordinatorErrors;
    }

      // Organizer validation
    if (!formData.organizer?.name?.trim()) {
      errors.organizer = ['Organizer name is required'];
    }
    
    // Basic email validation for organizer if provided
    if (
      formData.organizer?.email &&
      formData.organizer.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organizer.email)
    ) {
      errors.organizer = (errors.organizer || []).concat(['Organizer email format is invalid']);
    }

    // Recurring event validation
    if (formData.recurrence?.isRecurring) {
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

    // Paid event specific validation
    if (formData.isPaid) {
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
          }

          // Ticket Quantity validation
          if (
            ticket.quantity === undefined ||
            ticket.quantity === null ||
            ticket.quantity === '' ||
            isNaN(Number(ticket.quantity)) ||
            Number(ticket.quantity) < 0
          ) {
            ticketErrors.push(
              `Ticket type ${index + 1} quantity is required and must be 0 (share pool) or a positive number`
            );
          }

          // Date validation: startDate should be before expiryDate if both are set
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
    } else {
      // Free event specific validation
      if (formData.capacity && formData.capacity < 0) {
        errors.capacity = ['Event capacity cannot be negative'];
      }
      if (
        !formData.maxAttendeesPerRegistration ||
        formData.maxAttendeesPerRegistration < 1
      ) {
        errors.maxAttendeesPerRegistration = [
          'Maximum attendees per registration must be at least 1',
        ];
      }
    }

    // Custom registration fields validation
    if (formData.registrationFields && formData.registrationFields.length > 0) {
      const fieldErrors = [];
      formData.registrationFields.forEach((field, index) => {
        if (!field.fieldName?.trim()) {
          fieldErrors.push(`Registration field ${index + 1} name is required`);
        }
        if (
          field.fieldType === 'select' &&
          (!field.fieldOptions || field.fieldOptions.length === 0)
        ) {
          fieldErrors.push(
            `Registration field ${index + 1} dropdown options are required`
          );
        }
      });
      if (fieldErrors.length > 0) errors.registrationFields = fieldErrors;
    }

    return errors;
  }, [formData, isAddMode]);

  // Validate only fields in current step
  const validateCurrentStep = useCallback(() => {
    const errors = {};

    switch (currentStep) {
      case 1: // Event Details
        if (!formData.title?.trim()) errors.title = ['Event title is required'];
        if (!formData.description?.trim())
          errors.description = ['Event description is required'];
        if (!formData.dateTime) {
          errors.dateTime = ['Event date and time are required'];
        } else if (isAddMode) {
          const eventDate = new Date(formData.dateTime);
          const now = new Date();
          if (eventDate <= now) {
            errors.dateTime = ['Event date must be in the future'];
          }
        }
        if (!formData.venue?.trim()) errors.venue = ['Venue is required'];
        if (!formData.address?.formattedAddress)
          errors.address = ['Event address is required'];
        break;

      case 2: // Organiser Details
        // Organizer validation
        if (!formData.organizer?.name?.trim()) {
          errors.organizer = ['Organizer name is required'];
        }
        
        // Coordinators validation
        if (!formData.coordinators || formData.coordinators.length === 0) {
          errors.coordinators = ['At least one event coordinator is required'];
        } else {
          const coordinatorErrors = [];
          formData.coordinators.forEach((coord, index) => {
            if (!coord.name?.trim() || !coord.phone?.trim()) {
              coordinatorErrors.push(
                `Coordinator ${index + 1} name and phone are required`
              );
            }
          });
          if (coordinatorErrors.length > 0)
            errors.coordinators = coordinatorErrors;
        }
        break;

      case 3: // Event Type
        // No specific validation needed for step 3, just selection
        break;

      case 4: // Ticket Config
        if (formData.isPaid) {
          if (
            formData.capacity === '' ||
            formData.capacity === undefined ||
            formData.capacity === null ||
            isNaN(Number(formData.capacity)) ||
            Number(formData.capacity) < 0
          ) {
            errors.capacity = [
              'Please enter 0 for unlimited or a positive number',
            ];
          }
          if (!formData.ticketTypes || formData.ticketTypes.length === 0) {
            errors.ticketTypes = [
              'At least one ticket type is required for paid events',
            ];
          } else {
            const ticketErrors = [];
            formData.ticketTypes.forEach((ticket, index) => {
              // Name is required (has * in form)
              if (!ticket.name?.trim()) {
                ticketErrors.push(`Ticket type ${index + 1} name is required`);
              }

              // Price is required and must be > 0 (has * in form)
              if (
                ticket.price === undefined ||
                ticket.price === null ||
                ticket.price === '' ||
                isNaN(Number(ticket.price)) ||
                Number(ticket.price) <= 0
              ) {
                ticketErrors.push(
                  `Ticket type ${index + 1} price must be greater than 0`
                );
              }

              // Ticket Quantity validation
              if (
                ticket.quantity === undefined ||
                ticket.quantity === null ||
                ticket.quantity === '' ||
                isNaN(Number(ticket.quantity)) ||
                Number(ticket.quantity) < 0
              ) {
                ticketErrors.push(
                  `Ticket type ${index + 1} quantity is required and must be 0 (share pool) or a positive number`
                );
              }

              // Date validation: startDate should be before expiryDate if both are set
              if (ticket.startDate && ticket.expiryDate) {
                const startDate = new Date(ticket.startDate);
                const expiryDate = new Date(ticket.expiryDate);
                if (startDate >= expiryDate) {
                  ticketErrors.push(
                    `Ticket type ${
                      index + 1
                    } start date must be before expiry date`
                  );
                }
              }
            });
            if (ticketErrors.length > 0) errors.ticketTypes = ticketErrors;
          }
        } else {
          // Free event validation
          if (formData.maxAttendeesPerRegistration < 1) {
            errors.maxAttendeesPerRegistration = [
              'Maximum attendees per registration must be at least 1',
            ];
          }
        }
        break;

         case 5: // Refund Policy
        // Only validate refund policy for paid events
        if (formData.isPaid) {
          if (!formData.refundPolicy?.processingFeePolicy) {
            errors.refundPolicy = ['Please select a refund policy option'];
          }
        }
        // Free events skip refund policy validation
        break;

      default:
        break;
    }

    return errors;
  }, [currentStep, formData, isAddMode]);

const validateCurrentStepWithStripe = useCallback(() => {
  const errors = validateCurrentStep(); // Get existing validation errors
  
  // Additional validation for step 3 (Event Type) - Stripe setup check
  if (currentStep === 3 && formData.isPaid) {
    const isStripeFullySetup = user?.stripeAccountId && 
                              user?.stripeChargesEnabled && 
                              user?.stripeDetailsSubmitted && 
                              user?.stripePayoutsEnabled;
    
    if (!isStripeFullySetup) {
      errors.stripeSetup = ['Payment account setup is required for paid events. Please complete the setup above.'];
    }
  }
  
  return errors;
}, [currentStep, formData.isPaid, validateCurrentStep, user?.stripeAccountId, user?.stripeChargesEnabled, user?.stripeDetailsSubmitted, user?.stripePayoutsEnabled]);

// Helper function to check if Next button should be disabled
const isNextButtonDisabled = useCallback(() => {
  // Check if we're on step 3 (Event Type) with paid event but no Stripe setup
  if (currentStep === 3 && formData.isPaid) {
    const isStripeFullySetup = user?.stripeAccountId && 
                              user?.stripeChargesEnabled && 
                              user?.stripeDetailsSubmitted && 
                              user?.stripePayoutsEnabled;
    return !isStripeFullySetup;
  }
  
  return isLoading;
}, [currentStep, formData.isPaid, isLoading, user?.stripeAccountId, user?.stripeChargesEnabled, user?.stripeDetailsSubmitted, user?.stripePayoutsEnabled]);

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

    if (formData.dateTime) {
      // Convert to UTC if timezone is provided
      let finalDateTime = formData.dateTime;
      if (formData.timeZone) {
        try {
          const utcDateTime = zonedTimeToUtc(formData.dateTime, formData.timeZone);
          finalDateTime = utcDateTime.toISOString();
        } catch (error) {
          finalDateTime = new Date(formData.dateTime).toISOString();
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

    // Free event specific fields
    if (!formData.isPaid) {
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

      if (formData.ticketTypes && formData.ticketTypes.length > 0) {
        submitFormData.append('ticketTypes', JSON.stringify(formData.ticketTypes));
      }

      if (formData.seatingLayout && formData.seatingLayout.length > 0) {
        submitFormData.append('seatingLayout', JSON.stringify(formData.seatingLayout));
      }

      if (formData.stripeAccountId) {
        submitFormData.append('stripeAccountId', formData.stripeAccountId);
      }
      
       if (formData.refundPolicy) {
    submitFormData.append('refundPolicy', JSON.stringify(formData.refundPolicy));
  }
    }

    // Recurring event fields
    if (formData.recurrence && formData.recurrence.isRecurring) {
      submitFormData.append('recurrence', JSON.stringify(formData.recurrence));
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

    return submitFormData;
  }, [formData, localImageFiles]);

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
      if (isEditingMode) {
        // Update existing event - choose the appropriate thunk based on event type
        if (formData.isPaid) {
          await dispatch(
            updatePaidEvent({
              eventId: editingEventId,
              formData: submitFormData,
            })
          ).unwrap();
        } else {
          await dispatch(
            updateFreeEvent({
              eventId: editingEventId,
              formData: submitFormData,
            })
          ).unwrap();
        }
      } else {
        // Create new event - choose the appropriate thunk based on event type
        if (formData.isPaid) {
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
  ]);

  // Handle step navigation

const handleNext = useCallback(() => {
  // Validate current step
  const currentErrors = validateCurrentStepWithStripe();

  if (Object.keys(currentErrors).length > 0) {
    dispatch(setFormErrors(currentErrors));


     // Special handling for Stripe setup errors
    if (currentErrors.stripeSetup) {
      toast.error(
        <div>
          <p className="font-bold">Payment Setup Required</p>
          <p className="text-sm mt-1">
            Please complete your payment account setup before proceeding with paid events.
          </p>
        </div>,
        {
          duration: 6000,
          position: 'top-center',
        }
      );
      return;
    }

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
}, [currentStep, validateCurrentStepWithStripe, dispatch]);

  const handlePrev = useCallback(() => {
    dispatch(clearFormErrors());
    dispatch(prevStep());
    window.scrollTo(0, 0);
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    if (allowCancel) {
      if (isAddMode) {
        dispatch(resetForm());
      }
      router.push('/events');
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

  // Show loading spinner during initialization
  if (isInitializing) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <RequireLogin message="You must be logged in to manage events.">
          <div className="flex flex-col items-center justify-center min-h-64">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600">Loading event data...</p>
          </div>
        </RequireLogin>
      </div>
    );
  }

  // Show error if initialization failed
  if (initializationError) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <RequireLogin message="You must be logged in to manage events.">
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
        </RequireLogin>
      </div>
    );
  }

  // Render success step when form submission succeeds
  if (formStatus === 'succeeded') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <RequireLogin message="You must be logged in to manage events.">
          <SuccessStep
            event={formData}
            mode={mode}
            onAddAnother={handleAddAnother}
            onManageEvents={handleManageEvents}
          />
        </RequireLogin>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <RequireLogin message="You must be logged in to manage events.">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-teal-700">
            {customTitle ||
              (isEditingMode
                ? 'Edit Event'
                : isViewMode
                ? 'View Event'
                : 'Add New Event')}
          </h1>
          <p className="text-gray-600">
            {customDescription ||
              (isEditingMode
                ? 'Update your event details below'
                : isViewMode
                ? 'Event details (read-only)'
                : 'Fill in the details to create your event')}
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* Step Content */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          {currentStep === 1 && (
            <EventDetailsStep
              formData={formData}
              errors={formErrors}
              onImagesChange={handleImagesChange}
              mode={mode}
              readOnly={isViewMode}
            />
          )}

          {currentStep === 2 && (
            <OrganiserDetailsStep
              formData={formData}
              errors={formErrors}
              mode={mode}
              readOnly={isViewMode}
            />
          )}

          {currentStep === 3 && (
            <EventTypeStep
              formData={formData}
              errors={formErrors}
              mode={mode}
              readOnly={isViewMode}
            />
          )}

          {currentStep === 4 && (
            <TicketConfigStep
              formData={formData}
              errors={formErrors}
              mode={mode}
              readOnly={isViewMode}
            />
          )}

           {currentStep === 5 && (
            <RefundPolicyStep
              formData={formData}
              errors={formErrors}
              mode={mode}
              readOnly={isViewMode}
            />
          )}

          {/* Navigation Buttons */}
          {!isViewMode && (
            <div className="mt-8 flex justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}

              {currentStep < totalSteps ? (
  <button
    type="button"
    onClick={handleNext}
    disabled={isNextButtonDisabled()}
    className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
      isNextButtonDisabled()
        ? 'bg-gray-400 cursor-not-allowed text-white'
        : 'bg-teal-600 hover:bg-teal-700 text-white'
    }`}
    title={
  currentStep === 3 && formData.isPaid && !(user?.stripeAccountId && user?.stripeChargesEnabled && user?.stripeDetailsSubmitted && user?.stripePayoutsEnabled)
    ? 'Complete payment setup to proceed'
    : ''
}
  >
    {isNextButtonDisabled() && currentStep === 3 && formData.isPaid ? (
      <>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Payment Setup Required
      </>
    ) : isLoading ? (
      <>
        <svg
          className="animate-spin h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Next
      </>
    ) : (
      'Next'
    )}
  </button>
) : (
  <button
    type="button"
    onClick={handleSubmit}
    disabled={isLoading}
    className={`px-6 py-2 ${
      isLoading
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-teal-600 hover:bg-teal-700'
    } text-white rounded-lg transition-colors flex items-center gap-2`}
  >
    {isLoading ? (
      <>
        <svg
          className="animate-spin h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {isEditingMode
          ? 'Updating Event...'
          : 'Creating Event...'}
      </>
    ) : isEditingMode ? (
      'Update Event'
    ) : (
      'Create Event'
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
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Back to Events
              </button>
            </div>
          )}
        </div>
      </RequireLogin>
    </div>
  );
};

export default StepManager;