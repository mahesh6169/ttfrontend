// components/events/addevents/StepIndicator.jsx

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setStep } from '@/store/slices/events/eventSlice';

const StepIndicator = ({ currentStep = 1, totalSteps = 4 }) => {
  const dispatch = useDispatch();
  const { formData, isEditMode } = useSelector((state) => state.events);
  
  const steps = [
    { 
      number: 1, 
      title: 'Event Details',
      description: 'Basic information & schedule',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      number: 2, 
      title: 'Organizer Info',
      description: 'Event coordinators',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      number: 3, 
      title: 'Event Type',
      description: 'Free or paid event',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    { 
      number: 4, 
      title: 'Configuration',
      description: formData?.isPaid ? 'Tickets & pricing' : 'Registration setup',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];
  
  const handleStepClick = (stepNumber) => {
    // Only allow clicking on completed steps or current step
    if (stepNumber <= currentStep) {
      dispatch(setStep(stepNumber));
    }
  };

  // Check if step has errors based on validation
  const hasStepErrors = (stepNumber) => {
    // This could be enhanced to check for specific step validation
    return false; // Placeholder for future enhancement
  };

  // Check if step is complete based on required data
  const isStepComplete = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return formData?.title && formData?.dateTime && formData?.venue && formData?.description;
      case 2:
        return formData?.coordinators?.length > 0 && 
               formData.coordinators.every(coord => coord.name && coord.phone);
      case 3:
        return formData?.isPaid !== undefined;
      case 4:
        if (formData?.isPaid) {
          return formData?.ticketTypes?.length > 0 && 
                 formData.ticketTypes.every(ticket => ticket.name && ticket.price > 0);
        } else {
          return formData?.maxAttendeesPerRegistration > 0;
        }
      default:
        return false;
    }
  };

  // Get step status
  const getStepStatus = (stepNumber) => {
    if (stepNumber < currentStep) {
      return isStepComplete(stepNumber) ? 'completed' : 'skipped';
    } else if (stepNumber === currentStep) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };

  // Check if this is a recurring event for display
  const isRecurringEvent = formData?.recurrence?.isRecurring || false;

  return (
    <div className="w-full">
      {/* Header with event type indicators */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditMode ? 'Edit Event' : 'Create Event'}
          </h3>
          <div className="flex items-center space-x-2">
            {formData?.isPaid !== undefined && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                formData.isPaid 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {formData.isPaid ? 'Paid Event' : 'Free Event'}
              </span>
            )}
            {isRecurringEvent && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recurring
              </span>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.number);
            const isClickable = step.number <= currentStep;
            
            return (
              <React.Fragment key={step.number}>
                {/* Step Circle and Content */}
                <div 
                  className={`flex flex-col items-center group ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                  onClick={() => isClickable && handleStepClick(step.number)}
                >
                  {/* Step Circle */}
                  <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                    status === 'completed' 
                      ? 'bg-teal-600 border-teal-600 text-white shadow-md' 
                      : status === 'current'
                        ? 'border-teal-600 text-teal-600 bg-white shadow-lg ring-4 ring-teal-100' 
                        : hasStepErrors(step.number)
                          ? 'border-red-300 text-red-400 bg-white'
                          : 'border-gray-300 text-gray-400 bg-white'
                  } ${isClickable ? 'group-hover:shadow-lg' : ''}`}>
                    {status === 'completed' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : (
                      <div className="transition-all duration-200">
                        {step.icon}
                      </div>
                    )}
                    
                    {/* Error indicator */}
                    {hasStepErrors(step.number) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Step Label and Description */}
                  <div className="mt-3 text-center max-w-24">
                    <div className={`text-sm font-medium ${
                      status === 'current' || status === 'completed'
                        ? 'text-teal-600' 
                        : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 leading-tight">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {/* Line Connector */}
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-colors duration-200 ${
                    currentStep > step.number ? 'bg-teal-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              getStepStatus(currentStep) === 'current'
                ? 'border-teal-600 text-teal-600 bg-white' 
                : 'border-gray-300 text-gray-400 bg-white'
            }`}>
              {steps[currentStep - 1]?.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {steps[currentStep - 1]?.title}
              </div>
              <div className="text-xs text-gray-500">
                {steps[currentStep - 1]?.description}
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {currentStep}/{totalSteps}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-teal-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Validation Summary (if needed) */}
      {hasStepErrors(currentStep) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please complete the required fields in this step
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepIndicator;