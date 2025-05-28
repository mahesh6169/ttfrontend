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
} from '@/store/slices/events/eventSlice';

// Step Components
import StepIndicator from './StepIndicator';
import EventDetailsStep from './EventDetailsStep';
import OrganiserDetailsStep from './OrganiserDetailsStep';
import EventTypeStep from './EventTypeStep';
import TicketConfigStep from './TicketConfigStep';
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only reset if we're in add mode and haven't successfully submitted
      if (isAddMode && formStatus !== 'succeeded') {
        dispatch(resetForm());
      }
    };
  }, [isAddMode, formStatus, dispatch]);

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
      console.log(
        `📸 StepManager: handleImagesChange called with ${images.length} images`
      );

      // Extract files for new images (local only) - ENHANCED LOGGING
      const files = images
        .filter((img) => img.isNew && img.file)
        .map((img) => ({
          file: img.file,
          id: img.id,
          name: img.file.name,
          size: img.file.size,
        }));

      console.log(
        `📸 StepManager: Extracted ${files.length} files for local storage:`,
        files.map((f) => ({ id: f.id, name: f.name, size: f.size }))
      );

      setLocalImageFiles(files);

      // Only keep metadata for Redux (strip File objects to avoid serialization issues)
      const safeImages = images.map(
        ({ preview, url, id, name, size, type, isExisting, isNew }) => ({
          preview,
          url,
          id,
          name,
          size,
          type,
          isExisting,
          isNew,
        })
      );

      console.log(
        `📸 StepManager: Storing ${safeImages.length} safe images in Redux`
      );
      dispatch(setImages(safeImages));
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
      // ----- ADD THIS BLOCK HERE -----
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
          // Inside formData.ticketTypes.forEach in validateForm:
if (
  ticket.price === undefined ||
  ticket.price === null ||
  ticket.price === '' ||
  isNaN(Number(ticket.price)) ||
  Number(ticket.price) <= 0
) {
  ticketErrors.push(`Ticket type ${index + 1} price must be greater than 0`);
}


          // Quantity validation: 0 means shares remaining pool (valid)
          // No validation needed for quantity since 0 is valid (shares pool)
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

              // Quantity can be 0 (shares pool) - no validation needed
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

      default:
        break;
    }

    return errors;
  }, [currentStep, formData, isAddMode]);

  // Prepare form data for submission
  const prepareSubmissionData = useCallback(() => {
    console.log(`📸 StepManager: Preparing submission data...`);
    console.log(
      `📸 Local image files: ${localImageFiles.length}`,
      localImageFiles.map((f) => f.name)
    );
    console.log(
      `📸 Redux images: ${formData.images?.length || 0}`,
      formData.images?.map((img) => ({
        id: img.id,
        name: img.name,
        isNew: img.isNew,
        isExisting: img.isExisting,
      }))
    );

    const submitFormData = new FormData();

    // Add basic fields
    Object.keys(formData).forEach((key) => {
      if (key === 'images' || key === 'seatingLayoutImage') {
        // Skip file arrays, handled separately
        return;
      } else if (key === 'recurrence') {
        // Add utcDateTime field for each schedule
        const recurrenceData = { ...formData[key] };

        if (
          recurrenceData.isRecurring &&
          recurrenceData.repeatSchedule &&
          recurrenceData.repeatSchedule.length > 0
        ) {
          recurrenceData.repeatSchedule = recurrenceData.repeatSchedule.map(
            (schedule) => {
              try {
                const mainEventLocalDate = new Date(formData.dateTime);
                const dayMap = {
                  Sun: 0,
                  Mon: 1,
                  Tue: 2,
                  Wed: 3,
                  Thu: 4,
                  Fri: 5,
                  Sat: 6,
                };
                const mainEventDay = mainEventLocalDate.getDay();
                const targetDay = dayMap[schedule.day];
                let daysToAdd = (targetDay - mainEventDay + 7) % 7;
                if (daysToAdd === 0) daysToAdd = 7;
                const scheduleDate = new Date(mainEventLocalDate);
                scheduleDate.setDate(mainEventLocalDate.getDate() + daysToAdd);
                const [hours, minutes] = schedule.time.split(':');
                scheduleDate.setHours(
                  parseInt(hours, 10),
                  parseInt(minutes, 10),
                  0,
                  0
                );

                // Convert to UTC
                const utcDateTime = zonedTimeToUtc(
                  scheduleDate,
                  formData.timeZone
                );

                return {
                  day: schedule.day,
                  time: schedule.time,
                  utcDateTime: utcDateTime.toISOString(),
                  timeZone: formData.timeZone,
                };
              } catch (error) {
                return {
                  day: schedule.day,
                  time: schedule.time,
                  timeZone: formData.timeZone,
                  error: 'conversion_failed',
                };
              }
            }
          );
        }

        // Convert endDate to UTC if it exists
        if (recurrenceData.endDate) {
          try {
            const endOfDay = new Date(recurrenceData.endDate + 'T23:59:59');
            const utcEndDate = zonedTimeToUtc(endOfDay, formData.timeZone);
            recurrenceData.endDate = utcEndDate.toISOString();
          } catch (error) {
            // If conversion fails, just keep as is
          }
        }

        submitFormData.append(key, JSON.stringify(recurrenceData));
      } else if (
        [
          'coordinators',
          'ticketTypes',
          'seatingLayout',
          'registrationFields',
          'address',
        ].includes(key)
      ) {
        // Convert objects/arrays to JSON strings
        submitFormData.append(key, JSON.stringify(formData[key]));
      } else if (key === 'dateTime') {
        // Main event datetime conversion
        try {
          const utcDate = zonedTimeToUtc(formData[key], formData.timeZone);
          submitFormData.append('dateTime', utcDate.toISOString());
        } catch (error) {
          submitFormData.append('dateTime', formData[key]);
        }
      } else if (formData[key] !== null && formData[key] !== undefined) {
        // Add primitive values directly (skip null/undefined)
        submitFormData.append(key, formData[key]);
      }
    });

    // 🔧 CRITICAL FIX: Add ALL new image files
    if (localImageFiles && localImageFiles.length > 0) {
      console.log(
        `📸 Adding ${localImageFiles.length} new images to FormData:`
      );
      localImageFiles.forEach(({ file, id, name }, index) => {
        console.log(
          `📸   ${index + 1}. ${name} (${file.size} bytes) - ID: ${id}`
        );
        submitFormData.append('images', file, name); // Include filename for better backend handling
      });
    } else {
      console.log(`📸 No local image files to upload`);
    }

    // Add existing image data for backend processing
    const existingImages = (formData.images || []).filter(
      (image) => image.isExisting
    );
    if (existingImages.length > 0) {
      console.log(
        `📸 Adding ${existingImages.length} existing images to FormData:`
      );
      existingImages.forEach((image, index) => {
        console.log(`📸   ${index + 1}. Existing: ${image.name || image.url}`);
        // Send the full image object as JSON for existing images
        submitFormData.append('existingImages', JSON.stringify(image));
      });
    }

    // Add seating layout image if exists
    if (formData.seatingLayoutImage) {
      submitFormData.append('seatingLayoutImage', formData.seatingLayoutImage);
    }

    // Debug: Log all FormData entries
    if (process.env.NODE_ENV === 'development') {
      console.log(`📸 Final FormData contents:`);
      for (let pair of submitFormData.entries()) {
        if (pair[1] instanceof File) {
          console.log(
            `📸   ${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes)`
          );
        } else {
          console.log(
            `📸   ${pair[0]}: ${
              typeof pair[1] === 'string'
                ? pair[1].substring(0, 100) + '...'
                : pair[1]
            }`
          );
        }
      }
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
          ).unwrap(); // ✅ Use updateFreeEvent for free events
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
    console.log('Current step data:', { step: currentStep, formData });

    // Validate current step
    const currentErrors = validateCurrentStep();
    if (Object.keys(currentErrors).length > 0) {
      dispatch(setFormErrors(currentErrors));

      // Show error toast
      toast.error('Please fix the errors before proceeding');
      return;
    }

    // Clear errors and proceed
    dispatch(clearFormErrors());
    dispatch(nextStep());
    window.scrollTo(0, 0);
  }, [currentStep, validateCurrentStep, dispatch, formData]);

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
    dispatch(resetForm());
    // Don't navigate if we're already in add mode
    if (!isAddMode) {
      router.push('/events/add');
    }
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
                  disabled={isLoading}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
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
