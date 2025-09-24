'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import axios from '@/utils/axiosConfig';

const PlatformFeeManagement = () => {
  const router = useRouter();
  
  // State management
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [currentFeeInfo, setCurrentFeeInfo] = useState(null);
  const [newFee, setNewFee] = useState('');
  const [newPercentage, setNewPercentage] = useState('');
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
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/events/paid-events-list`,
        {
          withCredentials: true,
        }
      );

      const data = response.data;
      
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
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/events/${selectedEventId}/platform-fee`,
        {
          withCredentials: true,
        }
      );

      const data = response.data;
      
      if (data.success) {
        setCurrentFeeInfo(data);
        // Pre-fill the inputs with current fees (with proper formatting)
        setNewFee(data.platformFee !== null ? data.platformFee.toFixed(2) : '');
        setNewPercentage(data.platformFeePercentage !== null ? data.platformFeePercentage.toFixed(2) : '');
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

      // Determine the fee values to send
      let feeValue = newFee.trim() === '' ? null : parseFloat(newFee);
      let percentageValue = newPercentage.trim() === '' ? null : parseFloat(newPercentage);

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/events/${selectedEventId}/platform-fee`,
        { platformFee: feeValue, platformFeePercentage: percentageValue },
        {
          withCredentials: true,
        }
      );

      const data = response.data;

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message
        });
        
        // Update the current fee info
        setCurrentFeeInfo(prev => ({
          ...prev,
          platformFee: data.platformFee,
          platformFeePercentage: data.platformFeePercentage,
          effectiveFlatFee: data.effectiveFlatFee,
          effectivePercentage: data.effectivePercentage,
          effectiveFeeBreakdown: data.effectiveFeeBreakdown
        }));

        // Update the event in the dropdown list
        setEvents(prev => prev.map(event => 
          event._id === selectedEventId 
            ? { ...event, platformFee: data.platformFee, platformFeePercentage: data.platformFeePercentage }
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
    setNewPercentage('');
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
            Configure custom platform fees for individual events. Default fee is 0.30% Total cost + $0.80C per ticket.
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
                  {(event.platformFee !== null || event.platformFeePercentage !== null) && ` - Custom Fee: ${(event.platformFeePercentage || 0).toFixed(2)}% + $${(event.platformFee || 0.70).toFixed(2)}C`}
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
                {(currentFeeInfo.platformFee !== null || currentFeeInfo.platformFeePercentage !== null) ? (
                  <div>
                    <p className="text-lg font-semibold text-blue-900">
                      {(currentFeeInfo.platformFeePercentage || currentFeeInfo.defaultPercentage).toFixed(2)}% Total cost + ${(currentFeeInfo.platformFee || currentFeeInfo.defaultFee).toFixed(2)}C per ticket
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Effective fee: {currentFeeInfo.effectiveFeeBreakdown}
                    </p>
                    <p className="text-sm text-blue-700">
                      Custom fee is set for this event
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-blue-900">
                      {currentFeeInfo.defaultPercentage.toFixed(2)}% Total cost + ${currentFeeInfo.defaultFee.toFixed(2)}C per ticket
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Using platform default fees
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Update Form */}
            <form onSubmit={handleUpdateFee}>
              <div className="space-y-4">
                {/* Flat Fee Input */}
                <div>
                  <label htmlFor="newFee" className="block text-sm font-medium text-gray-700 mb-2">
                    Flat Fee (per ticket)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      id="newFee"
                      value={newFee}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && value.includes('.')) {
                          const decimals = value.split('.')[1];
                          if (decimals && decimals.length > 2) {
                            setNewFee(parseFloat(value).toFixed(2));
                            return;
                          }
                        }
                        setNewFee(value);
                      }}
                      onWheel={(e) => e.target.blur()}
                      min="0"
                      max="20"
                      step="0.01"
                      placeholder="0.80 (default)"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter $0.00 to $20.00, or leave empty for default
                  </p>
                </div>

                {/* Percentage Fee Input */}
                <div>
                  <label htmlFor="newPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                    Percentage Fee (of total amount)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="newPercentage"
                      value={newPercentage}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && value.includes('.')) {
                          const decimals = value.split('.')[1];
                          if (decimals && decimals.length > 2) {
                            setNewPercentage(parseFloat(value).toFixed(2));
                            return;
                          }
                        }
                        setNewPercentage(value);
                      }}
                      onWheel={(e) => e.target.blur()}
                      min="0"
                      max="10"
                      step="0.01"
                      placeholder="0.30 (default)"
                      className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter 0% to 10%, supports decimals (e.g., 0.30%)
                  </p>
                </div>

                {/* Reset Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Reset Both to Default
                  </button>
                </div>
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
          <div className="text-sm text-amber-800 space-y-3">
            <div>
              <p className="font-semibold">Platform Fee Components:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside ml-2">
                <li>Default Fee: $0.80 flat fee + 0.30%</li>
                <li>Flat Fee: $0.80 per ticket (first ticket effectively $0.50 after absorption)</li>
                <li>Percentage Fee: 0.30% of order total</li>
                <li>Absorbed Fee: We absorb Stripe's $0.30 fixed fee once per order</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">💳 Stripe Fee (GST-Inclusive)</p>
              <ul className="mt-1 space-y-1 list-disc list-inside ml-2">
                <li>1.7% of order total + $0.30 per order</li>
                <li>GST is already included (Stripe just shows it separately for reporting)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">📢 Marketed / Default Fee</p>
              <ul className="mt-1 space-y-1 list-disc list-inside ml-2">
                <li>2.0% of order total + $0.80 per ticket (includes Stripe + platform fees)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
};

export default PlatformFeeManagement;