'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';

const PlatformFeeManagement = () => {
  const router = useRouter();
  
  // State management
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [currentFeeInfo, setCurrentFeeInfo] = useState(null);
  const [newFee, setNewFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch all paid events on component mount
  useEffect(() => {
    fetchPaidEvents();
  }, []);

  // Fetch paid events for dropdown
  const fetchPaidEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/events/paid-events-list`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
        console.log(`✅ Loaded ${data.count} paid events`);
      } else {
        throw new Error(data.message || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setMessage({
        type: 'error',
        text: `Failed to load events: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch platform fee when event is selected
  useEffect(() => {
    if (selectedEventId) {
      fetchEventPlatformFee();
    } else {
      setCurrentFeeInfo(null);
      setNewFee('');
    }
  }, [selectedEventId]);

  // Fetch current platform fee for selected event
  const fetchEventPlatformFee = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/events/${selectedEventId}/platform-fee`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCurrentFeeInfo(data);
        // Pre-fill the input with current effective fee
        setNewFee(data.platformFee !== null ? data.platformFee.toString() : '');
        console.log('✅ Loaded platform fee info:', data);
      } else {
        throw new Error(data.message || 'Failed to fetch platform fee');
      }
    } catch (error) {
      console.error('❌ Error fetching platform fee:', error);
      setMessage({
        type: 'error',
        text: `Failed to load platform fee: ${error.message}`
      });
    }
  };

  // Update platform fee
  const handleUpdateFee = async (e) => {
    e.preventDefault();
    
    if (!selectedEventId) {
      setMessage({
        type: 'error',
        text: 'Please select an event first'
      });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Determine the fee value to send
      let feeValue = newFee.trim() === '' ? null : parseFloat(newFee);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/events/${selectedEventId}/platform-fee`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ platformFee: feeValue }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message
        });
        
        // Update the current fee info
        setCurrentFeeInfo(prev => ({
          ...prev,
          platformFee: data.platformFee,
          effectiveFee: data.effectiveFee
        }));

        // Update the event in the dropdown list
        setEvents(prev => prev.map(event => 
          event._id === selectedEventId 
            ? { ...event, platformFee: data.platformFee }
            : event
        ));

        console.log('✅ Platform fee updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update platform fee');
      }
    } catch (error) {
      console.error('❌ Error updating platform fee:', error);
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset fee to default
  const handleResetToDefault = () => {
    setNewFee('');
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <ProtectedAdminRoute>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Platform Fee Management
          </h1>
          <p className="text-gray-600">
            Configure custom platform fees for individual events. Default fee is $1.00 per ticket.
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Event Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label htmlFor="eventSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Select Event
          </label>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading events...</span>
            </div>
          ) : (
            <select
              id="eventSelect"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Choose an event --</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title} - {event.eventCode} ({formatDate(event.dateTime)})
                  {event.platformFee !== null && event.platformFee !== undefined && ` - Custom Fee: $${event.platformFee.toFixed(2)}`}
                </option>
              ))}
            </select>
          )}
          
          <p className="mt-2 text-sm text-gray-500">
            {events.length} paid event{events.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Fee Configuration */}
        {selectedEventId && currentFeeInfo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Platform Fee Configuration
            </h2>

            {/* Event Details */}
            <div className="bg-gray-50 rounded p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">{currentFeeInfo.title}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Event Code:</span>
                  <span className="ml-2 font-mono">{currentFeeInfo.eventCode}</span>
                </div>
                <div>
                  <span className="text-gray-600">Organizer:</span>
                  <span className="ml-2">{currentFeeInfo.organizerName}</span>
                </div>
              </div>
            </div>

            {/* Current Fee Display */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Current Platform Fee</h4>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                {currentFeeInfo.platformFee !== null ? (
                  <div>
                    <p className="text-lg font-semibold text-blue-900">
                      ${currentFeeInfo.platformFee.toFixed(2)} per ticket
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Custom fee is set for this event
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-blue-900">
                      ${currentFeeInfo.defaultFee.toFixed(2)} per ticket
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Using platform default fee
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Update Form */}
            <form onSubmit={handleUpdateFee}>
              <div className="mb-4">
                <label htmlFor="newFee" className="block text-sm font-medium text-gray-700 mb-2">
                  Set New Platform Fee (per ticket)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      id="newFee"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      min="0"
                      max="20"
                      step="0.01"
                      placeholder="Leave empty for default"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter a value between $0.00 and $20.00, or leave empty to use the default fee
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-2 font-medium text-white rounded-md transition-colors ${
                    saving 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {saving ? 'Saving...' : 'Update Platform Fee'}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push('/admin/profile')}
                  className="px-6 py-2 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-900 mb-2">Important Notes:</h3>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>Platform fees are charged per ticket, not per order</li>
            <li>The fee is deducted from the ticket price (not added on top)</li>
            <li>Changes only affect new purchases, not existing tickets</li>
            <li>Setting fee to $0 waives platform fees for that event</li>
          </ul>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
};

export default PlatformFeeManagement;