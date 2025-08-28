// components/events/addevents/SeatingLayoutSection.jsx

import React, { useState, Fragment, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  updateField,
  addSeatingRow,
  updateRowLabel,
  updateSeatCount,
  removeSeatingRow,
  clearCapacityWarning,
} from '@/store/slices/events/eventSlice';
import { FaInfoCircle } from 'react-icons/fa';

const SeatingLayoutSection = ({ formData, errors, dispatch }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [seatInputValues, setSeatInputValues] = useState({});
  const capacityWarning = useSelector((state) => state.events.capacityWarning);
  
  // Clear warning after 5 seconds
  useEffect(() => {
    if (capacityWarning) {
      const timer = setTimeout(() => {
        dispatch(clearCapacityWarning());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [capacityWarning, dispatch]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-medium text-gray-900">Seating Layout</h4>
          <p className="text-sm text-gray-500">
            Optional seating arrangement for your venue
          </p>
          {formData.capacity > 0 && formData.seatingLayout?.length > 0 && (
            <p className="text-xs mt-1 font-medium">
              Seats/Capacity: {(() => {
                const totalSeats = formData.seatingLayout.reduce((total, row) => total + (row.seats?.length || 0), 0);
                const isMatching = totalSeats === Number(formData.capacity);
                const seatColor = isMatching ? 'text-green-600' : 'text-red-600';
                return (
                  <>
                    <span className={seatColor}>{totalSeats}</span>
                    <span className="text-gray-600">/</span>
                    <span className={isMatching ? 'text-green-600' : 'text-gray-600'}>{formData.capacity}</span>
                    {!isMatching && <span className="text-red-600 ml-1">(must match)</span>}
                  </>
                );
              })()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowInstructions(true)}
          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
          title="Row naming instructions"
        >
          <FaInfoCircle className="text-xl" />
        </button>
      </div>

      {/* Validation Errors */}
      {errors?.seatingLayout && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-sm">
            {Array.isArray(errors.seatingLayout) 
              ? errors.seatingLayout.map((err, i) => <p key={i} className="mb-1">• {err}</p>)
              : <p>• {errors.seatingLayout}</p>
            }
          </div>
        </div>
      )}
      
      {(formData.seatingLayout || []).length > 0 ? (
        <>
          <style jsx>{`
            .seat-layout-container::-webkit-scrollbar {
              height: 8px;
            }
            .seat-layout-container::-webkit-scrollbar-track {
              background: #f7fafc;
              border-radius: 4px;
            }
            .seat-layout-container::-webkit-scrollbar-thumb {
              background: #cbd5e0;
              border-radius: 4px;
            }
            .seat-layout-container::-webkit-scrollbar-thumb:hover {
              background: #a0aec0;
            }
          `}</style>
          
          {/* Stage indicator */}
          <div className="text-center py-1.5 mb-2 sm:py-2 sm:mb-4 border border-gray-200 bg-gradient-to-b from-gray-100 to-gray-50 rounded-lg">
            <div className="inline-block bg-gray-800 text-white px-4 py-1 sm:px-6 sm:py-1.5 rounded text-[10px] sm:text-xs font-semibold tracking-wider">
              STAGE / FRONT
            </div>
          </div>

          <div className="mb-4">
            {/* Seating layout container */}
            <div className="seat-layout-container border border-gray-200 rounded-lg bg-white" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F7FAFC' }}>
              <div className="p-2 sm:p-4 space-y-2">
                {(formData.seatingLayout || []).map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center">
                    {/* Fixed controls container */}
                    <div className="flex items-center gap-2 flex-shrink-0 pr-2">
                      {/* Delete Button (X) */}
                      <button
                        type="button"
                        onClick={() => dispatch(removeSeatingRow(rowIndex))}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove row"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>

                      {/* Seat count input box */}
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={seatInputValues[rowIndex] !== undefined ? seatInputValues[rowIndex] : (row?.seats || []).length}
                        onChange={(e) => {
                          const value = e.target.value;
                          
                          // Only allow numeric input
                          if (value === '' || /^\d+$/.test(value)) {
                            // Update local state
                            setSeatInputValues(prev => ({
                              ...prev,
                              [rowIndex]: value
                            }));
                            
                            // Update Redux if valid number
                            if (value !== '') {
                              const numValue = parseInt(value);
                              if (numValue >= 1 && numValue <= 100) {
                                dispatch(
                                  updateSeatCount({
                                    rowIndex,
                                    count: numValue,
                                  })
                                );
                              }
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          let finalValue = 1;
                          
                          if (value !== '') {
                            const numValue = parseInt(value);
                            if (numValue >= 1 && numValue <= 100) {
                              finalValue = numValue;
                            }
                          }
                          
                          // Clear local state
                          setSeatInputValues(prev => {
                            const newState = { ...prev };
                            delete newState[rowIndex];
                            return newState;
                          });
                          
                          // Update Redux with final value
                          dispatch(
                            updateSeatCount({
                              rowIndex,
                              count: finalValue,
                            })
                          );
                        }}
                        className="w-12 sm:w-14 p-0.5 sm:p-1 border border-gray-300 rounded text-center text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />

                      {/* "seats" text */}
                      <span className="text-xs sm:text-sm text-gray-500">seats</span>
                    </div>

                    {/* Scrollable section */}
                    <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F7FAFC' }}>
                      <div className="flex items-center gap-2 min-w-fit">
                        {/* Row label (A, B, C, etc.) */}
                        <div className="w-6 sm:w-8 text-center font-bold text-gray-700 text-xs sm:text-sm flex-shrink-0 bg-gray-100 rounded px-1 sm:px-2 py-0.5 sm:py-1">
                          <input
                            type="text"
                            value={row?.rowLabel || ''}
                            onChange={(e) =>
                              dispatch(
                                updateRowLabel({
                                  index: rowIndex,
                                  value: e.target.value,
                                })
                              )
                            }
                            className="w-full bg-transparent text-center font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 rounded"
                            maxLength="3"
                            placeholder="A"
                          />
                        </div>

                        {/* Seats */}
                        {(row?.seats || []).map((seat, seatIndex) => {
                          // Add visual separator every 10 seats
                          const showSeparator = seatIndex > 0 && (seatIndex) % 10 === 0;
                          
                          return (
                            <Fragment key={seatIndex}>
                              {showSeparator && (
                                <div className="w-1 sm:w-2 h-8 flex items-center justify-center">
                                  <div className="w-px h-6 bg-gray-300"></div>
                                </div>
                              )}
                              <div
                                className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-50 border-2 border-gray-300 flex items-center justify-center rounded text-xs font-semibold text-gray-700 flex-shrink-0 hover:bg-gray-100 transition-colors"
                                title={`Row ${row.rowLabel || 'A'}, Seat ${
                                  seat?.seatNumber || seatIndex + 1
                                }`}
                              >
                                {seat?.seatNumber || seatIndex + 1}
                              </div>
                            </Fragment>
                          );
                        })}

                        {/* Right row label */}
                        <div className="w-6 sm:w-8 text-center font-bold text-gray-700 text-xs sm:text-sm flex-shrink-0 bg-gray-100 rounded px-1 sm:px-2 py-0.5 sm:py-1 ml-2">
                          {row?.rowLabel || 'A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Scroll hint for mobile */}
              <div className="md:hidden bg-gray-50 px-2 py-1 text-center border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  ← Swipe to view all seats →
                </div>
              </div>
            </div>
            
            {/* Capacity Warning */}
            {capacityWarning && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-xs sm:text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {capacityWarning}
                </p>
              </div>
            )}

            {/* Controls Row */}
            <div className="flex items-center justify-between mt-3 px-1 sm:px-2">
              <button
                type="button"
                onClick={() => dispatch(addSeatingRow())}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-teal-600 hover:text-teal-700 font-medium transition-colors text-sm sm:text-base"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Row
              </button>

              <div className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                Total Seats:{' '}
                <span className="font-semibold text-gray-900">
                  {(formData.seatingLayout || []).reduce(
                    (total, row) => total + (row.seats?.length || 0),
                    0
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Organizer Reserved Seats */}
          {(formData.seatingLayout || []).length > 0 && (
            <div className="border-t border-gray-200 pt-4 mb-4 sm:pt-6 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reserve Seats for Organizer
                <span className="text-xs text-gray-400 ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.organizerReservedSeats || ''}
                onChange={(e) =>
                  dispatch(
                    updateField({
                      field: 'organizerReservedSeats',
                      value: e.target.value,
                    })
                  )
                }
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                placeholder="A1,A4-A6,B1,C3-C5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Reserve specific seats for organizer use. Format: A1 for single seat, A4-A6 for consecutive seats in same row. Separate multiple selections with commas.
              </p>
            </div>
          )}

          {/* Seating Layout Image Upload */}
          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seating Layout Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  dispatch(
                    updateField({
                      field: 'seatingLayoutImage',
                      value: e.target.files[0],
                    })
                  );
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a visual reference of your seating layout for attendees
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <p className="text-gray-500 mb-4">No seating layout configured</p>
          
          {/* Capacity Warning for Create Button */}
          {capacityWarning && (
            <div className="max-w-md mx-auto mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm flex items-center justify-center">
                <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {capacityWarning}
              </p>
            </div>
          )}
          
          <button
            type="button"
            onClick={() => dispatch(addSeatingRow())}
            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Seating Layout
          </button>
        </div>
      )}

      {/* Row Name Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Row Name Instructions</h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700 mb-1">Seating Row Name Default:</p>
                  <p className="text-gray-600">A, B, C, D... and so on</p>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-1">Seating Row Name Character Limit:</p>
                  <p className="text-gray-600">3 characters maximum</p>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-1">Seating Row Names Allowed:</p>
                  <p className="text-gray-600">A, AA, 1A, VIP, BAL</p>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-1">Reserve Seats Examples:</p>
                  <div className="bg-gray-50 p-3 rounded font-mono text-xs space-y-1">
                    <p>A1, A5-A6</p>
                    <p>AA1, AA5-AA6</p>
                    <p>1A1, 1A5-1A7</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="mt-6 w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatingLayoutSection;