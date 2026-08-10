// components/events/addevents/SeatingLayoutSection.jsx
// Hosts the seating summary card + the full-screen one-canvas builder overlay (SeatBuilderOverlay).
// The card is DISPLAY-ONLY: only the "Seat Builder" button opens the overlay. Capacity validation
// lives entirely in the builder, so the card shows no capacity badge. See
// featureplans/events-seating-card.md (design ref: /preview/seating-card).

import React, { useState } from 'react';
import { MdEventSeat } from 'react-icons/md';
import { updateField, setSeatingLayout } from '@/store/slices/events/eventSlice';
import ImageUploader from './ImageUploader';
import SeatBuilderOverlay from './SeatBuilderOverlay';

// A compact read-only mini seat map: a STAGE bar + rows of small seats. Reserved seats tint amber,
// the rest teal; an empty layout renders a faint dashed "imaginary" placeholder. Columns/rows are
// capped so a large hall never overflows the card (the mini map is an impression, not the real map).
const MAX_COLS = 20;
const MAX_ROWS = 12;

const MiniSeatPreview = ({ layout }) => {
  const empty = layout.length === 0;
  const displayRows = empty
    ? Array.from({ length: 6 }, () => Array.from({ length: 10 }, () => 'seat'))
    : layout.slice(0, MAX_ROWS).map((row) =>
        (row.seats || []).slice(0, MAX_COLS).map((s) =>
          s.status === 'reserved' ? 'reserved' : s.status === 'blocked' ? 'blocked' : 'seat')
      );
  const seatColor = (s) =>
    empty ? 'text-slate-300' : s === 'reserved' ? 'text-amber-500' : s === 'blocked' ? 'text-slate-400' : 'text-teal-600';

  return (
    <div
      data-testid="mini-seat-preview"
      className={`rounded-lg border ${empty ? 'border-dashed' : ''} border-slate-200 bg-slate-50 p-2 overflow-hidden`}
    >
      <div className={`mx-auto mb-2 w-2/3 rounded ${empty ? 'bg-slate-300' : 'bg-slate-700'} text-white text-[9px] text-center py-0.5 tracking-wide`}>STAGE</div>
      <div className={`flex flex-col items-center gap-1 ${empty ? 'opacity-60' : ''}`}>
        {displayRows.map((row, i) => (
          <div key={i} data-testid="mini-seat-row" className="flex gap-0.5">
            {row.map((s, j) => <MdEventSeat key={j} className={`w-3 h-3 ${seatColor(s)}`} />)}
          </div>
        ))}
      </div>
    </div>
  );
};

const SeatingLayoutSection = ({ formData, errors, dispatch, isEditMode = false, onSeatingImagesChange }) => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const layout = formData.seatingLayout || [];
  const totalSeats = layout.reduce((t, r) => t + (r.seats?.length || 0), 0);
  const capacity = Number(formData.capacity) || 0; // passed to the builder; not shown on the card

  // A paid event's seating NATURE locks at the first sale (events-edit-locking.md): a general-admission
  // event that has sold tickets can't become seated - its buyers have no seat. Only offer the builder
  // when the event is already seated OR has no activity yet.
  const isSeated = layout.length > 0 || !!formData.hasSeating;
  const seatingLockedOut = !isSeated && !!formData.hasActivity;

  const handleSave = (newLayout, newReserved, newBlocked) => {
    dispatch(setSeatingLayout(newLayout));
    dispatch(updateField({ field: 'organizerReservedSeats', value: newReserved }));
    dispatch(updateField({ field: 'organizerBlockedSeats', value: newBlocked }));
    setIsBuilderOpen(false);
  };

  const seatBuilderBtn = (
    <button
      type="button"
      onClick={() => setIsBuilderOpen(true)}
      className="inline-flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-lg px-3 py-1.5 shrink-0"
    >
      <MdEventSeat className="w-3.5 h-3.5" />
      Seat Builder
    </button>
  );

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <div className="mb-3">
        <h3 className="font-medium text-sm text-slate-900">Seating Configuration</h3>
      </div>

      {errors?.seatingLayout && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 text-xs">
            {Array.isArray(errors.seatingLayout)
              ? errors.seatingLayout.map((err, i) => <p key={i} className="mb-1">- {err}</p>)
              : <p>- {errors.seatingLayout}</p>}
          </div>
        </div>
      )}

      {/* General-admission event with sales: seating can't be introduced now (buyers have no seat). */}
      {seatingLockedOut ? (
        <p data-testid="seating-locked-out" className="text-xs text-amber-600">
          This event has sold tickets as general admission, so assigned seating can&apos;t be added now. To use a seat map, recreate the event.
        </p>
      ) : (
      /* Summary card - DISPLAY ONLY (a plain panel). Only the Seat Builder button opens the overlay;
          no capacity badge (the builder validates capacity). */
      <div data-testid="seating-card" className="border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          {layout.length > 0 ? (
            <span className="text-sm text-slate-700">
              <span className="font-semibold">{totalSeats}</span> seat{totalSeats === 1 ? '' : 's'}
              <span className="text-slate-400"> - </span>
              <span className="font-semibold">{layout.length}</span> row{layout.length === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="text-sm text-slate-500">No seating configured yet</span>
          )}
          {seatBuilderBtn}
        </div>

        {layout.length > 0 && formData.organizerReservedSeats && (
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs text-slate-500">Reserved</span>
            <span className="text-xs text-slate-600">{formData.organizerReservedSeats}</span>
          </div>
        )}

        {layout.length > 0 && formData.organizerBlockedSeats && (
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs text-slate-500">Not for sale</span>
            <span className="text-xs text-slate-600">{formData.organizerBlockedSeats}</span>
          </div>
        )}

        <MiniSeatPreview layout={layout} />
      </div>
      )}

      {/* Venue layout images (outside the builder) */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Venue Layout</label>
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
          initialBlocked={formData.organizerBlockedSeats || ''}
          capacity={capacity}
          onSave={handleSave}
          onClose={() => setIsBuilderOpen(false)}
        />
      )}
    </div>
  );
};

export default SeatingLayoutSection;
