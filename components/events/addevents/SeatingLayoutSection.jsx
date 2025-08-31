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
import ImageUploader from './ImageUploader';

const SeatingLayoutSection = ({ formData, errors, dispatch, isEditMode = false, onSeatingImagesChange }) => {
  console.log('🪑 SeatingLayoutSection rendered with formData.seatingLayoutImage:', formData.seatingLayoutImage);
  const [showInstructions, setShowInstructions] = useState(false);
  const [seatInputValues, setSeatInputValues] = useState({});
  const capacityWarning = useSelector((state) => state.events.capacityWarning);
  const [reservedSeatsError, setReservedSeatsError] = useState('');
  
  // Track original row count when component mounts in edit mode
  const [originalRowCount] = useState(() => 
    isEditMode ? (formData.seatingLayout?.length || 0) : 0
  );
  
  // Parse reserved seats for dynamic coloring
  const parseReservedSeats = (reservedString) => {
    const reserved = new Set();
    if (!reservedString || !reservedString.trim()) return reserved;
    
    try {
      const parts = reservedString.split(',').map(p => p.trim()).filter(Boolean);
      
      parts.forEach(part => {
        if (part.includes('-')) {
          // Handle range like A4-A6
          const [start, end] = part.split('-');
          const startMatch = start.match(/^([A-Z]+)(\d+)$/);
          const endMatch = end.match(/^([A-Z]+)(\d+)$/);
          
          if (startMatch && endMatch && startMatch[1] === endMatch[1]) {
            const rowLabel = startMatch[1];
            const startNum = parseInt(startMatch[2]);
            const endNum = parseInt(endMatch[2]);
            
            for (let i = startNum; i <= endNum; i++) {
              reserved.add(`${rowLabel}${i}`);
            }
          }
        } else {
          // Handle single seat like A1
          const match = part.match(/^([A-Z]+)(\d+)$/);
          if (match) {
            reserved.add(part);
          }
        }
      });
    } catch (e) {
      // Invalid format, return empty set
    }
    
    return reserved;
  };
  
  const reservedSeats = parseReservedSeats(formData.organizerReservedSeats);
  
  // Clear warning after 5 seconds
  useEffect(() => {
    if (capacityWarning) {
      const timer = setTimeout(() => {
        dispatch(clearCapacityWarning());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [capacityWarning, dispatch]);
  
  // Validate reserved seats format
  const validateReservedSeats = (value) => {
    if (!value || !value.trim()) {
      setReservedSeatsError('');
      return;
    }
    
    const seatPattern = /^[A-Z]+\d+(-[A-Z]+\d+)?$/;
    const parts = value.trim().split(',').map(part => part.trim()).filter(Boolean);
    const invalidSeats = parts.filter(part => !seatPattern.test(part));
    
    if (invalidSeats.length > 0) {
      // Generate helpful examples based on actual row labels
      const rows = formData.seatingLayout || [];
      let exampleFormat = "A1 or A1-A5";
      
      if (rows.length > 0 && rows[0]?.rowLabel) {
        const label = rows[0].rowLabel;
        exampleFormat = `${label}1 or ${label}1-${label}5`;
      }
      
      setReservedSeatsError(`Invalid format: ${invalidSeats.join(', ')}. Use format like ${exampleFormat}`);
    } else {
      setReservedSeatsError('');
    }
  };

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
          {/* Configuration Section with Fixed Height */}
          <div className="mb-4">
            <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Configure Rows</h5>
              {isEditMode && originalRowCount > 0 && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  <strong>Edit Mode:</strong> Existing rows cannot be modified or deleted to preserve sold tickets. New rows can be added and configured normally.
                </div>
              )}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F7FAFC' }}>
                {(formData.seatingLayout || []).map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-3">
                    {/* Row label input */}
                    <input
                      type="text"
                      value={row?.rowLabel || ''}
                      disabled={isEditMode && rowIndex < originalRowCount}
                      onChange={(e) => {
                        if (isEditMode && rowIndex < originalRowCount) return;
                        const value = e.target.value.toUpperCase();
                        
                        // Only allow letters (no numbers or alphanumeric)
                        if (value === '' || /^[A-Z]+$/.test(value)) {
                          const isDuplicate = formData.seatingLayout.some(
                            (r, i) => i !== rowIndex && r.rowLabel === value && value !== ''
                          );
                          
                          if (!isDuplicate) {
                            dispatch(
                              updateRowLabel({
                                index: rowIndex,
                                value: value,
                              })
                            );
                          }
                        }
                      }}
                      className={`w-16 p-2 border border-gray-300 rounded text-center font-bold text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        isEditMode && rowIndex < originalRowCount ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      maxLength="3"
                      placeholder={(() => {
                        // Show previous label as placeholder for complex patterns
                        if (rowIndex > 0 && !row?.rowLabel) {
                          const prevLabel = formData.seatingLayout[rowIndex - 1]?.rowLabel;
                          // If previous label is complex (not single letter), show it as hint
                          if (prevLabel && !/^[A-Z]$/.test(prevLabel)) {
                            return prevLabel;
                          }
                        }
                        return "A";
                      })()}
                    />

                    {/* Seat count input */}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      disabled={isEditMode && rowIndex < originalRowCount}
                      value={seatInputValues[rowIndex] !== undefined ? seatInputValues[rowIndex] : (row?.seats || []).length}
                      onChange={(e) => {
                        if (isEditMode && rowIndex < originalRowCount) return;
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
                        if (isEditMode && rowIndex < originalRowCount) return;
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
                      className={`w-20 p-2 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        isEditMode && rowIndex < originalRowCount ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder="10"
                    />

                    <span className="text-sm text-gray-600">seats</span>

                    {/* Delete Button - Hidden only for existing rows in edit mode */}
                    {!(isEditMode && rowIndex < originalRowCount) && (
                      <button
                        type="button"
                        onClick={() => dispatch(removeSeatingRow(rowIndex))}
                        className="ml-auto p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
                    )}
                  </div>
                ))}
              </div>
              
              {/* Add Row Button */}
              <button
                type="button"
                onClick={() => dispatch(addSeatingRow())}
                disabled={(() => {
                  const totalSeats = formData.seatingLayout.reduce((sum, row) => sum + (row.seats?.length || 0), 0);
                  const capacity = Number(formData.capacity) || 0;
                  return capacity > 0 && totalSeats >= capacity;
                })()}
                className={`mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium transition-colors ${
                  (() => {
                    const totalSeats = formData.seatingLayout.reduce((sum, row) => sum + (row.seats?.length || 0), 0);
                    const capacity = Number(formData.capacity) || 0;
                    return capacity > 0 && totalSeats >= capacity;
                  })()
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-teal-600 hover:text-teal-700'
                }`}
              >
                <svg
                  className="w-4 h-4 mr-1.5"
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
            </div>
          </div>

          {/* Visual Preview Section */}
          <div className="border border-gray-200 rounded-lg bg-white p-4">
            {/* Stage indicator */}
            <div className="text-center py-2 mb-4 border border-gray-200 bg-gradient-to-b from-gray-100 to-gray-50 rounded">
              <div className="inline-block bg-gray-800 text-white px-6 py-1 rounded text-xs font-semibold tracking-wider">
                STAGE / FRONT
              </div>
            </div>
            
            {/* Theater-style dotted visualization */}
            <div className="max-h-64 overflow-y-auto overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F7FAFC' }}>
              <div className="min-w-fit">
                {(formData.seatingLayout || []).map((row, rowIndex) => {
                  const seatCount = row.seats?.length || 0;
                  const totalRows = formData.seatingLayout.length;
                  // Calculate padding to create theater effect (first row most padded)
                  const paddingPercentage = ((totalRows - rowIndex - 1) / Math.max(totalRows - 1, 1)) * 25;
                  
                  return (
                    <div key={rowIndex} className="flex items-center h-8">
                      {/* Row label - fixed width and right aligned */}
                      <div className="w-12 flex-shrink-0 text-right pr-4">
                        <span className="font-bold text-gray-700 text-sm">
                          {row.rowLabel || (() => {
                            // Use same logic as Add Row for default labels
                            if (rowIndex === 0) return 'A';
                            
                            const prevRow = formData.seatingLayout[rowIndex - 1];
                            if (!prevRow?.rowLabel) return '';
                            
                            // Single letter progression
                            if (/^[A-Z]$/.test(prevRow.rowLabel)) {
                              if (prevRow.rowLabel === 'Z') {
                                return 'AA';
                              } else {
                                return String.fromCharCode(prevRow.rowLabel.charCodeAt(0) + 1);
                              }
                            }
                            
                            // For any other pattern, return empty (show previous label)
                            return prevRow.rowLabel;
                          })()}
                        </span>
                      </div>
                      
                      {/* Centered container for dots */}
                      <div className="flex-1 flex justify-center">
                        {/* Seats as dots with theater-style padding */}
                        <div className="flex items-center" style={{ paddingLeft: `${paddingPercentage}%`, paddingRight: `${paddingPercentage}%` }}>
                          {Array.from({ length: seatCount }).map((_, seatIndex) => {
                            const seatId = `${row.rowLabel || 'A'}${seatIndex + 1}`;
                            const isReserved = reservedSeats.has(seatId);
                            
                            return (
                              <span 
                                key={seatIndex} 
                                className={`mx-0.5 text-xl ${isReserved ? 'text-purple-600' : 'text-gray-400'}`}
                                title={isReserved ? `Reserved: ${seatId}` : seatId}
                              >
                                •
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Total seats indicator and legend */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Total Seats:{' '}
                  <span className="font-semibold text-gray-900">
                    {(formData.seatingLayout || []).reduce(
                      (total, row) => total + (row.seats?.length || 0),
                      0
                    )}
                  </span>
                </span>
                {reservedSeats.size > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 text-xl">•</span>
                    <span className="text-gray-600">Available</span>
                    <span className="text-purple-600 text-xl ml-2">•</span>
                    <span className="text-gray-600">Reserved ({reservedSeats.size})</span>
                  </div>
                )}
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

          {/* Organizer Reserved Seats */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reserve Seats for Organizer
              <span className="text-xs text-gray-400 ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.organizerReservedSeats || ''}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                dispatch(
                  updateField({
                    field: 'organizerReservedSeats',
                    value: value,
                  })
                );
                validateReservedSeats(value);
              }}
              className={`w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm ${
                reservedSeatsError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={(() => {
                const rows = formData.seatingLayout || [];
                if (rows.length === 0) return "A1,A4-A6,B1,C3-C5";
                
                // Categorize row labels by type
                const labelTypes = {
                  singleLetter: [],    // A, B, C
                  doubleLetter: [],    // AA, BB
                  word: []            // VIP, BAL
                };
                
                rows.forEach(row => {
                  if (!row?.rowLabel) return;
                  const label = row.rowLabel;
                  
                  if (/^[A-Z]$/.test(label)) {
                    labelTypes.singleLetter.push(row);
                  } else if (/^[A-Z]{2}$/.test(label)) {
                    labelTypes.doubleLetter.push(row);
                  } else if (/^[A-Z]{3,}$/.test(label)) {
                    labelTypes.word.push(row);
                  }
                });
                
                const examples = [];
                
                // Add one example from each type (single seat + range)
                Object.values(labelTypes).forEach(typeRows => {
                  if (typeRows.length > 0) {
                    const row = typeRows[0];
                    examples.push(`${row.rowLabel}1`);
                    
                    if (row.seats?.length >= 4) {
                      examples.push(`${row.rowLabel}1-${row.rowLabel}4`);
                    }
                  }
                });
                
                // If we have very few examples, add more from available rows
                if (examples.length < 4 && rows.length > 1) {
                  for (let i = 1; i < rows.length && examples.length < 6; i++) {
                    if (rows[i]?.rowLabel && !examples.some(ex => ex.startsWith(rows[i].rowLabel))) {
                      examples.push(`${rows[i].rowLabel}1`);
                    }
                  }
                }
                
                return examples.join(',') || "A1,A4-A6,B1,C3-C5";
              })()}
            />
            {reservedSeatsError && (
              <p className="text-red-500 text-xs mt-1">{reservedSeatsError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Reserve seats for organizer use. These will be excluded from sale.
            </p>
          </div>

          {/* Venue Seating Image Upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue Seating Layout
              <span className="text-xs text-gray-400 ml-1">(optional)</span>
            </label>
            <ImageUploader
              images={formData.seatingLayoutImage || []}
              onImagesChange={onSeatingImagesChange}
              maxImages={4}
              disabled={false}
              mode={isEditMode ? 'edit' : 'add'}
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload visual references of your venue seating layout (up to 4 images).
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