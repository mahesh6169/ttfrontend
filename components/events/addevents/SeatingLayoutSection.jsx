// components/events/addevents/SeatingLayoutSection.jsx

import React from 'react';
import {
  updateField,
  addSeatingRow,
  updateRowLabel,
  updateSeatCount,
  removeSeatingRow,
} from '@/store/slices/events/eventSlice';

const SeatingLayoutSection = ({ formData, errors, dispatch }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
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
        <div>
          <h4 className="text-lg font-medium text-gray-900">Seating Layout</h4>
          <p className="text-sm text-gray-500">
            Optional seating arrangement for your venue
          </p>
        </div>
      </div>

      {(formData.seatingLayout || []).length > 0 ? (
        <>
          <div className="mb-4">
            {/* Fixed container with proper overflow handling */}
            <div className="border border-gray-200 rounded-lg bg-gray-50">
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {(formData.seatingLayout || []).map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm"
                  >
                    {/* Full-width container for each row */}
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Row Label - Fixed Width */}
                        <div className="flex-shrink-0 w-20">
                          <label className="block text-xs font-medium text-gray-500 mb-2">
                            Row
                          </label>
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
                            className="w-full p-2 border border-gray-300 rounded text-center font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            maxLength="3"
                            placeholder="A"
                          />
                        </div>

                        {/* Seats Container - Flexible Width */}
                        <div className="flex-1 min-w-0">
                          <label className="block text-xs font-medium text-gray-500 mb-2">
                            Seats ({(row?.seats || []).length} total)
                          </label>
                          
                          {/* Horizontal scrollable seats container */}
                          <div className="overflow-x-auto border border-gray-200 rounded-md bg-gray-50 p-2">
                            <div className="flex gap-1 pb-1" style={{ minWidth: 'max-content' }}>
                              {(row?.seats || []).map((seat, seatIndex) => {
                                // Add visual separator every 10 seats
                                const showSeparator = seatIndex > 0 && (seatIndex) % 10 === 0;
                                
                                return (
                                  <div key={seatIndex} className="flex items-center">
                                    {showSeparator && (
                                      <div className="w-px h-6 bg-gray-300 mx-2 flex-shrink-0"></div>
                                    )}
                                    <div
                                      className="w-6 h-6 bg-teal-100 border border-teal-300 flex items-center justify-center rounded text-xs font-medium text-teal-700 flex-shrink-0 hover:bg-teal-200 transition-colors"
                                      title={`Row ${row.rowLabel || 'A'}, Seat ${
                                        seat?.seatNumber || seatIndex + 1
                                      }`}
                                    >
                                      {seat?.seatNumber || seatIndex + 1}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Seat count indicators */}
                          {(row?.seats || []).length > 20 && (
                            <div className="mt-1 text-xs text-gray-500 flex gap-4">
                              <span>1-10</span>
                              {(row?.seats || []).length > 10 && <span>11-20</span>}
                              {(row?.seats || []).length > 20 && (
                                <span>21-{(row?.seats || []).length}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Controls - Fixed Width */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-3">
                          {/* Seat Count Input */}
                          <div className="text-right">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Count
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={(row?.seats || []).length}
                              onChange={(e) =>
                                dispatch(
                                  updateSeatCount({
                                    rowIndex,
                                    count: Math.max(
                                      1,
                                      Math.min(100, parseInt(e.target.value) || 1)
                                    ),
                                  })
                                )
                              }
                              className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => dispatch(removeSeatingRow(rowIndex))}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between mt-4 px-2">
              <button
                type="button"
                onClick={() => dispatch(addSeatingRow())}
                className="inline-flex items-center px-4 py-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
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

              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
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
            <div className="border-t border-gray-200 pt-6 mb-6">
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., A-2,A-4:A-6,B-1,C-3:C-5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify seats to reserve for the organizer. Use format: A-2,A-4:A-6,B-1 
                (individual seats or ranges with dashes and colons for sequences)
              </p>
            </div>
          )}

          {/* Seating Layout Image Upload */}
          <div className="border-t border-gray-200 pt-6">
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
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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
          <button
            type="button"
            onClick={() => dispatch(addSeatingRow())}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
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
    </div>
  );
};

export default SeatingLayoutSection;