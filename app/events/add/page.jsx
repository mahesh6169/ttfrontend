// app/events/add/page.jsx

'use client';

import React, { useEffect, useState } from 'react'; // updated import
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { 
  nextStep, 
  prevStep, 
  setStep, 
  resetForm,
  addFreeEvent,
  addPaidEvent,
  setFormErrors,
  clearFormErrors,
  updateField,
  setImages, // <--- Add this
} from '@/store/slices/events/eventSlice';

import { zonedTimeToUtc } from 'date-fns-tz';

// Step Components
import StepIndicator from '@/components/events/addevents/StepIndicator';
import EventDetailsStep from '@/components/events/addevents/EventDetailsStep';
import OrganiserDetailsStep from '@/components/events/addevents/OrganiserDetailsStep';
import EventTypeStep from '@/components/events/addevents/EventTypeStep';
import TicketConfigStep from '@/components/events/addevents/TicketConfigStep';
import SuccessStep from '@/components/events/addevents/SuccessStep';

// Auth Components
import RequireLogin from '@/components/Auth/RequireLogin';

const AddEventPage = () => {
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
    isEditMode
  } = useSelector((state) => state.events);

const [localImageFiles, setLocalImageFiles] = useState([]);

  // Reset form when component mounts (only for new events, not edit mode)
  useEffect(() => {
    if (!isEditMode) {
      dispatch(resetForm());
    }
    
    // Cleanup function
    return () => {
      if (formStatus !== 'succeeded' && !isEditMode) {
        dispatch(resetForm());
      }
    };
  }, [isEditMode, dispatch]);

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
    }
  }, [formStatus, successMessage]);

  // Use this to update images from the uploader (strip files for Redux, keep locally)
const handleImagesChange = (images) => {
  // Extract files for new images (local only)
  const files = images.filter(img => img.isNew && img.file).map(img => ({ file: img.file, id: img.id }));
  setLocalImageFiles(files);

  // Only keep metadata for Redux
  const safeImages = images.map(({ preview, url, id, name, size, type, isExisting, isNew }) =>
    ({ preview, url, id, name, size, type, isExisting, isNew })
  );
  dispatch(setImages(safeImages));
};

  // Handle form submission - choose between free and paid event endpoints
  const handleSubmit = async () => {
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
    // Choose the appropriate thunk based on event type
    if (formData.isPaid) {
      await dispatch(addPaidEvent(submitFormData)).unwrap();
    } else {
      await dispatch(addFreeEvent(submitFormData)).unwrap();
    }
    // Success is handled by the useEffect above
  } catch (error) {
    // Error is handled by the reducer and useEffect above
    // (You may leave this, or remove if not needed)
    console.error('Form submission error:', error);
  }
};


  // Prepare form data for submission
const prepareSubmissionData = () => {
  const submitFormData = new FormData();

  // Add basic fields
  Object.keys(formData).forEach(key => {
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
        recurrenceData.repeatSchedule = recurrenceData.repeatSchedule.map((schedule) => {
          try {
            const mainEventLocalDate = new Date(formData.dateTime);
            const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
            const mainEventDay = mainEventLocalDate.getDay();
            const targetDay = dayMap[schedule.day];
            let daysToAdd = (targetDay - mainEventDay + 7) % 7;
            if (daysToAdd === 0) daysToAdd = 7;
            const scheduleDate = new Date(mainEventLocalDate);
            scheduleDate.setDate(mainEventLocalDate.getDate() + daysToAdd);
            const [hours, minutes] = schedule.time.split(':');
            scheduleDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

            // Convert to UTC
            const utcDateTime = zonedTimeToUtc(scheduleDate, formData.timeZone);

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
              error: 'conversion_failed'
            };
          }
        });
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
      ['coordinators', 'ticketTypes', 'seatingLayout', 'registrationFields', 'address'].includes(key)
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

  // Add images from formData.images
  // Add images from localImageFiles (new uploads)
if (localImageFiles && localImageFiles.length > 0) {
  localImageFiles.forEach(({ file }) => {
    submitFormData.append('images', file);
  });
}
// Add existing image URLs from Redux
if (formData.images && formData.images.length > 0) {
  formData.images.forEach(image => {
    if (image.url && image.isExisting) {
      submitFormData.append('existingImages', image.url);
    }
  });
}

  // Add seating layout image if exists
  if (formData.seatingLayoutImage) {
    submitFormData.append('seatingLayoutImage', formData.seatingLayoutImage);
  }

  return submitFormData;
};


  // Enhanced form validation function
  const validateForm = () => {
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
      // Check if date is in the future
      const eventDate = new Date(formData.dateTime);
      const now = new Date();
      if (eventDate <= now) {
        errors.dateTime = ['Event date must be in the future'];
      }
    }
    
    if (!formData.venue?.trim()) {
      errors.venue = ['Venue is required'];
    }
    
    // Address validation
    if (!formData.address || 
        !formData.address.formattedAddress || 
        !formData.address.location || 
        !Array.isArray(formData.address.location.coordinates) ||
        formData.address.location.coordinates.length !== 2 ||
        formData.address.location.coordinates[0] === 0 || 
        formData.address.location.coordinates[1] === 0) {
      errors.address = ['Valid event address with location is required'];
    }
    
    // Coordinator validation
    if (!formData.coordinators || formData.coordinators.length === 0) {
      errors.coordinators = ['At least one event coordinator is required'];
    } else {
      const coordinatorErrors = [];
      formData.coordinators.forEach((coord, index) => {
        if (!coord.name?.trim() || !coord.phone?.trim()) {
          coordinatorErrors.push(`Coordinator ${index + 1} name and phone are required`);
        }
        // Basic phone validation
        if (coord.phone && !/^[\d\s\-\+\(\)]+$/.test(coord.phone)) {
          coordinatorErrors.push(`Coordinator ${index + 1} phone number format is invalid`);
        }
        // Basic email validation if provided
        if (coord.email && coord.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coord.email)) {
          coordinatorErrors.push(`Coordinator ${index + 1} email format is invalid`);
        }
      });
      if (coordinatorErrors.length > 0) errors.coordinators = coordinatorErrors;
    }
    
    // Recurring event validation
    if (formData.recurrence?.isRecurring) {
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
      if (formData.recurrence.endDate) {
        const endDate = new Date(formData.recurrence.endDate);
        const startDate = new Date(formData.dateTime);
        if (endDate <= startDate) {
          errors.recurrence = (errors.recurrence || []).concat(['Recurring end date must be after the event start date']);
        }
      }
    }
    
    // Paid event specific validation
    if (formData.isPaid) {
      if (!formData.ticketTypes || formData.ticketTypes.length === 0) {
        errors.ticketTypes = ['At least one ticket type is required for paid events'];
      } else {
        const ticketErrors = [];
        formData.ticketTypes.forEach((ticket, index) => {
          if (!ticket.name?.trim()) {
            ticketErrors.push(`Ticket type ${index + 1} name is required`);
          }
          if (!ticket.price || ticket.price <= 0) {
            ticketErrors.push(`Ticket type ${index + 1} price must be greater than 0`);
          }
          if (!ticket.quantity || ticket.quantity <= 0) {
            ticketErrors.push(`Ticket type ${index + 1} quantity must be greater than 0`);
          }
          if (!ticket.seatsRequired || ticket.seatsRequired <= 0) {
            ticketErrors.push(`Ticket type ${index + 1} seats required must be greater than 0`);
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
      if (!formData.maxAttendeesPerRegistration || formData.maxAttendeesPerRegistration < 1) {
        errors.maxAttendeesPerRegistration = ['Maximum attendees per registration must be at least 1'];
      }
    }
    
    // Custom registration fields validation
    if (formData.registrationFields && formData.registrationFields.length > 0) {
      const fieldErrors = [];
      formData.registrationFields.forEach((field, index) => {
        if (!field.fieldName?.trim()) {
          fieldErrors.push(`Registration field ${index + 1} name is required`);
        }
        if (field.fieldType === 'select' && (!field.fieldOptions || field.fieldOptions.length === 0)) {
          fieldErrors.push(`Registration field ${index + 1} dropdown options are required`);
        }
      });
      if (fieldErrors.length > 0) errors.registrationFields = fieldErrors;
    }
    
    return errors;
  };

  // Handle step navigation
  const handleNext = () => {
    console.log("Current step data:", { step: currentStep, formData });
    
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
  };

  const handlePrev = () => {
    dispatch(clearFormErrors());
    dispatch(prevStep());
    window.scrollTo(0, 0);
  };

  // Validate only fields in current step
  const validateCurrentStep = () => {
    const errors = {};
    
    switch (currentStep) {
      case 1: // Event Details
        if (!formData.title?.trim()) errors.title = ['Event title is required'];
        if (!formData.description?.trim()) errors.description = ['Event description is required'];
        if (!formData.dateTime) {
          errors.dateTime = ['Event date and time are required'];
        } else {
          const eventDate = new Date(formData.dateTime);
          const now = new Date();
          if (eventDate <= now) {
            errors.dateTime = ['Event date must be in the future'];
          }
        }
        if (!formData.venue?.trim()) errors.venue = ['Venue is required'];
        if (!formData.address?.formattedAddress) errors.address = ['Event address is required'];
        break;
        
      case 2: // Organiser Details
        if (!formData.coordinators || formData.coordinators.length === 0) {
          errors.coordinators = ['At least one event coordinator is required'];
        } else {
          const coordinatorErrors = [];
          formData.coordinators.forEach((coord, index) => {
            if (!coord.name?.trim() || !coord.phone?.trim()) {
              coordinatorErrors.push(`Coordinator ${index + 1} name and phone are required`);
            }
          });
          if (coordinatorErrors.length > 0) errors.coordinators = coordinatorErrors;
        }
        break;
        
      case 3: // Event Type
        // No specific validation needed for step 3, just selection
        break;
        
      case 4: // Ticket Config
        if (formData.isPaid) {
          if (!formData.ticketTypes || formData.ticketTypes.length === 0) {
            errors.ticketTypes = ['At least one ticket type is required for paid events'];
          } else {
            const ticketErrors = [];
            formData.ticketTypes.forEach((ticket, index) => {
              if (!ticket.name?.trim()) {
                ticketErrors.push(`Ticket type ${index + 1} name is required`);
              }
              if (!ticket.price || ticket.price <= 0) {
                ticketErrors.push(`Ticket type ${index + 1} price must be greater than 0`);
              }
              if (!ticket.quantity || ticket.quantity <= 0) {
                ticketErrors.push(`Ticket type ${index + 1} quantity must be greater than 0`);
              }
            });
            if (ticketErrors.length > 0) errors.ticketTypes = ticketErrors;
          }
        } else {
          // Free event validation
          if (formData.maxAttendeesPerRegistration < 1) {
            errors.maxAttendeesPerRegistration = ['Maximum attendees per registration must be at least 1'];
          }
        }
        break;
        
      default:
        break;
    }
    
    return errors;
  };

  // Render success step when form submission succeeds
  if (formStatus === 'succeeded') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <SuccessStep 
          event={formData}
          onAddAnother={() => {
            dispatch(resetForm());
          }}
          onManageEvents={() => {
            dispatch(resetForm());
            router.push('/users/profile/manageevents');
          }}
        />
      </div>
    );
  }



  return (
    <div className="p-4 max-w-4xl mx-auto">
      <RequireLogin message="You must be logged in to add a new event.">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-teal-700">
            {isEditMode ? 'Edit Event' : 'Add New Event'}
          </h1>
          <p className="text-gray-600">
            {isEditMode 
              ? 'Update your event details below' 
              : 'Fill in the details to create your event'
            }
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
/>

)}

          {currentStep === 2 && (
            <OrganiserDetailsStep
              formData={formData}
              errors={formErrors}
            />
          )}

          {currentStep === 3 && (
            <EventTypeStep
              formData={formData}
              errors={formErrors}
            />
          )}

          {currentStep === 4 && (
            <TicketConfigStep
              formData={formData}
              errors={formErrors}
            />
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={formStatus === 'loading'}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/events')}
                disabled={formStatus === 'loading'}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={formStatus === 'loading'}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={formStatus === 'loading'}
                className={`px-6 py-2 ${
                  formStatus === 'loading' 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-teal-600 hover:bg-teal-700'
                } text-white rounded-lg transition-colors flex items-center gap-2`}
              >
                {formStatus === 'loading' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditMode ? 'Updating Event...' : 'Creating Event...'}
                  </>
                ) : (
                  isEditMode ? 'Update Event' : 'Create Event'
                )}
              </button>
            )}
          </div>
        </div>
      </RequireLogin>
    </div>
  );
};

export default AddEventPage;