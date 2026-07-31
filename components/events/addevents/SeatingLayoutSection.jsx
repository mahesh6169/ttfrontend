// components/events/addevents/SeatingLayoutSection.jsx
// Hosts the seating summary + the full-screen one-canvas builder overlay (SeatBuilderOverlay).
// See featureplans/events-seatbuilder-redesign.md.

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { updateField, setSeatingLayout } from '@/store/slices/events/eventSlice';
import ImageUploader from './ImageUploader';
import SeatBuilderOverlay from './SeatBuilderOverlay';

const SeatingLayoutSection = ({ formData, errors, dispatch, isEditMode = false, onSeatingImagesChange }) => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const capacityWarning = useSelector((state) => state.events.capacityWarning);

  // The builder self-locks on the event's first sale (a booked seat); "existing event" is not a lock
  // reason (featureplans/fix-events-seatmap-salelock.md).
  const layout = formData.seatingLayout || [];
  const totalSeats = layout.reduce((t, r) => t + (r.seats?.length || 0), 0);
  const capacity = Number(formData.capacity) || 0;
  const isMatching = capacity > 0 && totalSeats === capacity;

  const handleSave = (newLayout, newReserved) => {
    dispatch(setSeatingLayout(newLayout));
    dispatch(updateField({ field: 'organizerReservedSeats', value: newReserved }));
    setIsBuilderOpen(false);
  };

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <div className="mb-3">
        <h3 className="font-medium text-sm sm:text-base text-slate-600">Seating Configuration</h3>
      </div>

      {errors?.seatingLayout && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-xs sm:text-sm">
            {Array.isArray(errors.seatingLayout)
              ? errors.seatingLayout.map((err, i) => <p key={i} className="mb-1">- {err}</p>)
              : <p>- {errors.seatingLayout}</p>}
          </div>
        </div>
      )}

      {/* Summary card (opens the builder) */}
      {layout.length > 0 ? (
        <button
          type="button"
          onClick={() => setIsBuilderOpen(true)}
          className="w-full bg-white border border-slate-200 rounded-lg p-3 hover:bg-slate-50 hover:border-slate-300 transition-colors text-left group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-700">
              <span className="font-semibold">{totalSeats}</span> seat{totalSeats === 1 ? '' : 's'}
              <span className="text-slate-400"> - </span>
              <span className="font-semibold">{layout.length}</span> row{layout.length === 1 ? '' : 's'}
            </span>
            {capacity > 0 && (isMatching ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5">Matches capacity</span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 text-xs font-medium px-2 py-0.5">
                {totalSeats > capacity ? `${totalSeats - capacity} over capacity` : `${capacity - totalSeats} short`}
              </span>
            ))}
          </div>
          {formData.organizerReservedSeats && (
            <div className="mt-1.5 flex items-start gap-2">
              <span className="w-16 shrink-0 text-xs text-slate-500">Reserved</span>
              <span className="text-xs text-slate-600">{formData.organizerReservedSeats}</span>
            </div>
          )}
          <span className="mt-1 inline-block text-xs font-medium text-teal-700 group-hover:text-teal-800">Open seat builder</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsBuilderOpen(true)}
          className="inline-flex items-center text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Configure Seating
        </button>
      )}

      {capacityWarning && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-xs">{capacityWarning}</p>
        </div>
      )}

      {/* Venue layout images (outside the builder) */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-600 mb-2">Venue Layout</label>
        <p className="text-xs text-slate-500 mb-2">Upload seating / venue layout images</p>
        <ImageUploader
          images={formData.seatingLayoutImage || []}
          onImagesChange={onSeatingImagesChange}
          maxImages={4}
          disabled={false}
          mode={isEditMode ? 'edit' : 'add'}
          showLabel={false}
        />
      </div>

      {/* Full-screen one-canvas builder overlay */}
      {isBuilderOpen && (
        <SeatBuilderOverlay
          initialLayout={layout}
          initialReserved={formData.organizerReservedSeats || ''}
          capacity={capacity}
          onSave={handleSave}
          onClose={() => setIsBuilderOpen(false)}
        />
      )}
    </div>
  );
};

export default SeatingLayoutSection;
