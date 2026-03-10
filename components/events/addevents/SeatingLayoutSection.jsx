// components/events/addevents/SeatingLayoutSection.jsx

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  updateField,
  addSeatingRow,
  updateRowLabel,
  updateSeatCount,
  removeSeatingRow,
  clearCapacityWarning,
  setSeatingLayout,
} from '@/store/slices/events/eventSlice';
import { FaInfoCircle } from 'react-icons/fa';
import ImageUploader from './ImageUploader';

const SeatingLayoutSection = ({ formData, errors, dispatch, isEditMode = false, onSeatingImagesChange }) => {
  console.log('🪑 SeatingLayoutSection rendered with formData.seatingLayoutImage:', formData.seatingLayoutImage);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seatInputValues, setSeatInputValues] = useState({});
  const capacityWarning = useSelector((state) => state.events.capacityWarning);
  const [reservedSeatsError, setReservedSeatsError] = useState('');

  // Draft state for modal editing
  const [draftSeatingLayout, setDraftSeatingLayout] = useState([]);
  const [draftReservedSeats, setDraftReservedSeats] = useState('');
  
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

  // Generate summary of configured seats
  const getSeatsSummary = (layout = formData.seatingLayout) => {
    if (!layout || layout.length === 0) return null;

    return layout.map(row => {
      const label = row.rowLabel || 'A';
      const count = row.seats?.length || 0;
      return `${label}1-${label}${count}`;
    }).join('  ·  ');
  };

  // Modal handlers
  const openModal = () => {
    // Snapshot current state into draft
    setDraftSeatingLayout(JSON.parse(JSON.stringify(formData.seatingLayout || [])));
    setDraftReservedSeats(formData.organizerReservedSeats || '');
    setSeatInputValues({});
    setReservedSeatsError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSeatInputValues({});
    setReservedSeatsError('');
  };

  const handleSave = () => {
    // Validate before saving
    if (reservedSeatsError) return;

    // Commit draft to Redux
    dispatch(setSeatingLayout(draftSeatingLayout));
    dispatch(updateField({ field: 'organizerReservedSeats', value: draftReservedSeats }));
    closeModal();
  };

  const handleCancel = () => {
    // Discard draft, close modal
    closeModal();
  };

  // Draft state handlers (for modal editing)
  const updateDraftRowLabel = (rowIndex, value) => {
    setDraftSeatingLayout(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], rowLabel: value };
      return updated;
    });
  };

  const updateDraftSeatCount = (rowIndex, count) => {
    setDraftSeatingLayout(prev => {
      const updated = [...prev];
      const seats = Array.from({ length: count }, (_, i) => ({
        seatNumber: i + 1,
        status: 'available'
      }));
      updated[rowIndex] = { ...updated[rowIndex], seats };
      return updated;
    });
  };

  const addDraftRow = () => {
    setDraftSeatingLayout(prev => {
      // Generate next label
      let nextLabel = 'A';
      let seatCount = 10;

      if (prev.length > 0) {
        const lastRow = prev[prev.length - 1];
        const lastLabel = lastRow?.rowLabel || 'A';
        seatCount = lastRow?.seats?.length || 10;

        if (lastLabel.length === 1 && lastLabel >= 'A' && lastLabel < 'Z') {
          nextLabel = String.fromCharCode(lastLabel.charCodeAt(0) + 1);
        } else {
          nextLabel = lastLabel;
        }
      }
      return [...prev, { rowLabel: nextLabel, seats: Array.from({ length: seatCount }, (_, i) => ({ seatNumber: i + 1, status: 'available' })) }];
    });
  };

  const removeDraftRow = (rowIndex) => {
    setDraftSeatingLayout(prev => prev.filter((_, i) => i !== rowIndex));
  };

  // Calculate draft totals
  const getDraftTotalSeats = () => {
    return draftSeatingLayout.reduce((total, row) => total + (row.seats?.length || 0), 0);
  };

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold sm:font-bold text-base sm:text-lg text-slate-700">
            Seating Configuration
          </h3>
          {formData.capacity > 0 && formData.seatingLayout?.length > 0 && (
            <p className="text-xs mt-1 font-medium">
              Seats/Capacity: {(() => {
                const totalSeats = formData.seatingLayout.reduce((total, row) => total + (row.seats?.length || 0), 0);
                const isMatching = totalSeats === Number(formData.capacity);
                const seatColor = isMatching ? 'text-green-600' : 'text-red-600';
                return (
                  <>
                    <span className={seatColor}>{totalSeats}</span>
                    <span className="text-slate-600">/</span>
                    <span className={isMatching ? 'text-green-600' : 'text-slate-600'}>{formData.capacity}</span>
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
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Row naming instructions"
        >
          <FaInfoCircle className="text-lg" />
        </button>
      </div>

      {/* Validation Errors */}
      {errors?.seatingLayout && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-xs sm:text-sm">
            {Array.isArray(errors.seatingLayout)
              ? errors.seatingLayout.map((err, i) => <p key={i} className="mb-1">• {err}</p>)
              : <p>• {errors.seatingLayout}</p>
            }
          </div>
        </div>
      )}

      {/* Summary Box - Always visible */}
      {(formData.seatingLayout || []).length > 0 ? (
        <button
          type="button"
          onClick={openModal}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100 hover:border-slate-300 transition-colors text-left group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm text-slate-700">
                <span className="font-medium">Configured:</span> {getSeatsSummary()}
              </div>
              {formData.organizerReservedSeats && (
                <div className="text-sm text-slate-700 mt-1">
                  <span className="font-medium">Reserved:</span> {formData.organizerReservedSeats}
                </div>
              )}
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            // Initialize with one row and open modal
            setDraftSeatingLayout([{ rowLabel: 'A', seats: Array.from({ length: 10 }, (_, i) => ({ seatNumber: i + 1, status: 'available' })) }]);
            setDraftReservedSeats('');
            setIsModalOpen(true);
          }}
          className="w-full py-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors group"
        >
          <div className="flex items-center justify-center text-slate-500 group-hover:text-slate-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium">Configure Seating</span>
          </div>
        </button>
      )}

      {/* Capacity Warning */}
      {capacityWarning && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-xs flex items-center">
            <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {capacityWarning}
          </p>
        </div>
      )}

      {/* Venue Layout - Always visible outside modal */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Venue Layout <span className="text-xs text-slate-400 font-normal">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">Upload images of venue seating</p>
        <ImageUploader
          images={formData.seatingLayoutImage || []}
          onImagesChange={onSeatingImagesChange}
          maxImages={4}
          disabled={false}
          mode={isEditMode ? 'edit' : 'add'}
          showLabel={false}
        />
      </div>

      {/* Configure Seating Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-md rounded-lg max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-800">Configure Seating</h3>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Seats/Capacity indicator in modal */}
              {formData.capacity > 0 && (
                <div className="mb-4 p-2 bg-slate-50 rounded-lg">
                  <p className="text-xs font-medium">
                    Seats/Capacity: {(() => {
                      const totalSeats = getDraftTotalSeats();
                      const isMatching = totalSeats === Number(formData.capacity);
                      const seatColor = isMatching ? 'text-green-600' : 'text-red-600';
                      return (
                        <>
                          <span className={seatColor}>{totalSeats}</span>
                          <span className="text-slate-600">/</span>
                          <span className={isMatching ? 'text-green-600' : 'text-slate-600'}>{formData.capacity}</span>
                          {!isMatching && <span className="text-red-600 ml-1">(must match)</span>}
                        </>
                      );
                    })()}
                  </p>
                </div>
              )}

              {/* Edit Mode Warning */}
              {isEditMode && originalRowCount > 0 && (
                <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  <strong>Edit Mode:</strong> Existing rows cannot be modified to preserve sold tickets.
                </div>
              )}

              {/* Configure Rows */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-2">Configure Rows</label>
                <div className="space-y-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {draftSeatingLayout.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-2">
                      {/* Row label input */}
                      <input
                        type="text"
                        value={row?.rowLabel || ''}
                        disabled={isEditMode && rowIndex < originalRowCount}
                        onChange={(e) => {
                          if (isEditMode && rowIndex < originalRowCount) return;
                          const value = e.target.value.toUpperCase();
                          if (value === '' || /^[A-Z]+$/.test(value)) {
                            const isDuplicate = draftSeatingLayout.some(
                              (r, i) => i !== rowIndex && r.rowLabel === value && value !== ''
                            );
                            if (!isDuplicate) {
                              updateDraftRowLabel(rowIndex, value);
                            }
                          }
                        }}
                        className={`w-14 p-2 border border-slate-300 rounded-lg text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                          isEditMode && rowIndex < originalRowCount ? 'bg-slate-100 cursor-not-allowed' : ''
                        }`}
                        maxLength="3"
                        placeholder="A"
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
                          if (value === '' || /^\d+$/.test(value)) {
                            setSeatInputValues(prev => ({ ...prev, [rowIndex]: value }));
                            if (value !== '') {
                              const numValue = parseInt(value);
                              if (numValue >= 1 && numValue <= 100) {
                                updateDraftSeatCount(rowIndex, numValue);
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
                          setSeatInputValues(prev => {
                            const newState = { ...prev };
                            delete newState[rowIndex];
                            return newState;
                          });
                          updateDraftSeatCount(rowIndex, finalValue);
                        }}
                        className={`w-16 p-2 border border-slate-300 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                          isEditMode && rowIndex < originalRowCount ? 'bg-slate-100 cursor-not-allowed' : ''
                        }`}
                        placeholder="10"
                      />

                      <span className="text-xs text-slate-600">seats</span>

                      {/* Delete Button */}
                      {!(isEditMode && rowIndex < originalRowCount) && (
                        <button
                          type="button"
                          onClick={() => removeDraftRow(rowIndex)}
                          className="ml-auto p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove row"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Row Button */}
                <button
                  type="button"
                  onClick={addDraftRow}
                  disabled={(() => {
                    const totalSeats = getDraftTotalSeats();
                    const capacity = Number(formData.capacity) || 0;
                    return capacity > 0 && totalSeats >= capacity;
                  })()}
                  className={`mt-2 inline-flex items-center px-3 py-1.5 text-sm font-medium transition-colors ${
                    (() => {
                      const totalSeats = getDraftTotalSeats();
                      const capacity = Number(formData.capacity) || 0;
                      return capacity > 0 && totalSeats >= capacity;
                    })()
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-teal-700 hover:text-teal-800'
                  }`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Row
                </button>
              </div>

              {/* Reserve Seats */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Reserve Seats</label>
                <input
                  type="text"
                  value={draftReservedSeats}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setDraftReservedSeats(value);
                    validateReservedSeats(value);
                  }}
                  className={`w-full p-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                    reservedSeatsError ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g. A1, A4-A6, B1"
                />
                {reservedSeatsError && (
                  <p className="text-red-500 text-xs mt-1">{reservedSeatsError}</p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={reservedSeatsError}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row Name Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full mx-2">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-slate-800">Row Name Instructions</h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                  <p className="font-semibold text-slate-700 mb-1">Row Labels</p>
                  <p className="text-slate-600">Letters only (A-Z), max 3 chars. e.g. A, AA, VIP</p>
                </div>

                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                  <p className="font-semibold text-slate-700 mb-1">Seats per Row</p>
                  <p className="text-slate-600">1-100 seats. Total must equal event capacity.</p>
                </div>

                <div className="border border-teal-200 rounded-lg p-2 bg-teal-50">
                  <p className="font-semibold text-teal-700 mb-1">Reserved Seats Format</p>
                  <div className="text-slate-600 space-y-0.5">
                    <p>Single: A1, B5, VIP2</p>
                    <p>Range: A1-A5, AA1-AA3</p>
                    <p>Multiple: A1,A5-A7,B2</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="mt-4 w-full py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors text-sm font-medium"
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