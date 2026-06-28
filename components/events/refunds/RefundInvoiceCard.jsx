'use client';

import React, { useState } from 'react';
import { IoChevronDown, IoTicket, IoCheckmarkCircle } from 'react-icons/io5';

const RefundInvoiceCard = ({ 
  invoiceNumber, 
  tickets, 
  isExpanded, 
  onToggleExpand,
  selectedTickets,
  onTicketSelect,
  onAmountChange,
  localAmounts,
  amountWarnings,
  formatCurrency
}) => {
  const [activeTab, setActiveTab] = useState('tickets');
  
  // Calculate invoice totals
  const invoiceTotal = tickets.reduce((sum, t) => sum + t.priceDetails.totalPrice, 0);
  const invoiceRefunded = tickets.reduce((sum, t) => sum + (t.totalRefundedAmount || 0), 0);
  const refundedCount = tickets.filter(t => t.totalRefundedAmount > 0).length;
  
  // Check if any tickets are selected in this invoice
  const hasSelectedTickets = tickets.some(t => 
    selectedTickets.some(st => st.ticketNumber === t.ticketNumber)
  );
  
  // Check if all tickets are fully refunded
  const allTicketsRefunded = tickets.every(t => {
    const maxRefundable = t.priceDetails.totalPrice - (t.totalRefundedAmount || 0);
    return maxRefundable <= 0;
  });
  
  // Check if invoice has partial refunds
  const hasPartialRefunds = invoiceRefunded > 0 && !allTicketsRefunded;
  
  // Get buyer info from first ticket
  const buyer = tickets[0]?.buyer || {};

  const handleToggleExpand = () => {
    onToggleExpand(invoiceNumber);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Invoice Header */}
      <div 
        className="p-3 sm:p-4 cursor-pointer transition-colors hover:bg-slate-50"
        onClick={handleToggleExpand}
      >
        {/* Desktop Layout */}
        <div className="hidden sm:block">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IoChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                <h3 className="font-semibold text-slate-800">{invoiceNumber}</h3>
                {allTicketsRefunded && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Fully Refunded
                  </span>
                )}
                {hasPartialRefunds && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    Partially Refunded
                  </span>
                )}
                {hasSelectedTickets && (
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-600 ml-6">
                <div>Tickets: {tickets.length} &nbsp;&nbsp; Refunded: {refundedCount} / {tickets.length}</div>
                <div className="mt-1">
                  {buyer.firstName} {buyer.lastName} • {buyer.email} • {buyer.phone}
                </div>
              </div>
            </div>
          </div>
          
          {/* View Tickets Button */}
          <div className="mt-3 ml-6">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand();
              }}
              className="px-4 py-1.5 border rounded-md text-sm font-medium transition-colors bg-teal-700 text-white border-teal-700 hover:bg-teal-800"
            >
              {isExpanded ? 'Hide Tickets' : 'View Tickets'}
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <IoChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                <h3 className="font-semibold text-slate-800 text-sm">{invoiceNumber}</h3>
                {allTicketsRefunded && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Fully Refunded
                  </span>
                )}
                {hasPartialRefunds && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    Partially Refunded
                  </span>
                )}
              </div>
              <div className="ml-6 text-xs text-slate-600 space-y-1">
                <div>{buyer.firstName} {buyer.lastName}</div>
                <div>{buyer.email}</div>
                <div>{buyer.phone}</div>
                <div className="pt-1 font-medium">
                  <div>Total: {formatCurrency(invoiceTotal)}</div>
                  <div>Refunded: {formatCurrency(invoiceRefunded)}</div>
                </div>
                <div>Tickets: {tickets.length} &nbsp; Refunded: {refundedCount}/{tickets.length}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 ml-6">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand();
              }}
              className="w-full px-4 py-2 border rounded-md text-sm font-medium transition-colors bg-teal-700 text-white border-teal-700 hover:bg-teal-800"
            >
              {isExpanded ? 'Hide Tickets' : 'View Tickets'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content - Tickets */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="p-3 sm:p-4 space-y-3">
            {tickets.map((ticket) => {
              const isSelected = selectedTickets.some(t => t.ticketNumber === ticket.ticketNumber);
              const maxRefundable = ticket.priceDetails.totalPrice - (ticket.totalRefundedAmount || 0);
              const isFullyRefunded = maxRefundable <= 0;
              const customAmount = localAmounts[ticket.ticketNumber];
              
              return (
                <div 
                  key={ticket.ticketNumber} 
                  className={`bg-white p-3 rounded-lg border ${
                    isFullyRefunded 
                      ? 'border-red-200 bg-red-50' 
                      : isSelected 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => !isFullyRefunded && onTicketSelect(ticket)}
                      disabled={isFullyRefunded}
                      className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center ${
                        isFullyRefunded
                          ? 'bg-red-100 border-red-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {isFullyRefunded ? (
                        <span className="text-red-600 text-xs">✕</span>
                      ) : isSelected ? (
                        <IoCheckmarkCircle className="w-3 h-3" />
                      ) : null}
                    </button>

                    {/* Ticket Content */}
                    <div className="flex-1">
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {/* Desktop: All in one line, Mobile: Stacked */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <span className="font-mono text-sm font-medium">{ticket.ticketNumber}</span>
                            <span className="text-xs text-slate-500">
                              {ticket.ticketType.name}
                              {ticket.seats?.length > 0 && ` • Seat ${ticket.seats[0].row}${ticket.seats[0].seatNumber}`}
                              {!ticket.seats?.length && ' • GA'}
                            </span>
                          </div>
                          
                          {/* Refund Status - Responsive */}
                          {isFullyRefunded ? (
                            <div className="text-xs text-red-600 font-medium mt-1">
                              ✓ Fully refunded ({formatCurrency(ticket.priceDetails.totalPrice)}) on {new Date(ticket.refundedAt).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="text-xs mt-1">
                              {ticket.totalRefundedAmount > 0 ? (
                                <span className="flex flex-col sm:flex-row sm:items-center">
                                  <span className="text-amber-600">Partially Refunded: {formatCurrency(ticket.totalRefundedAmount)}</span>
                                  <span className="hidden sm:inline mx-2 text-slate-400">•</span>
                                  <span className="text-teal-600">Available: {formatCurrency(maxRefundable)}</span>
                                </span>
                              ) : (
                                <span className="text-teal-600">Available: {formatCurrency(maxRefundable)}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-sm font-medium ml-2">
                          {formatCurrency(ticket.priceDetails.totalPrice)}
                        </div>
                      </div>

                      {/* Refund Amount Input */}
                      {isSelected && !isFullyRefunded && (
                        <div className="mt-3 pt-3 border-t border-slate-200 -mx-3 px-3">
                          <div className="flex items-center gap-1">
                            <label className="text-xs text-slate-700 whitespace-nowrap">Amount:</label>
                            <input
                              type="number"
                              min="0.01"
                              max={maxRefundable}
                              step="0.01"
                              value={customAmount !== undefined ? customAmount : ''}
                              onInput={(e) => {
                                // Detect when browser blocks invalid input (e, E, +, -, letters)
                                if (e.target.validity.badInput) {
                                  onAmountChange(ticket.ticketNumber, 'INVALID', maxRefundable);
                                }
                              }}
                              onChange={(e) => onAmountChange(ticket.ticketNumber, e.target.value, maxRefundable)}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value > 0) {
                                  const rounded = Math.round(value * 100) / 100;
                                  e.target.value = rounded.toFixed(2);
                                  onAmountChange(ticket.ticketNumber, rounded.toFixed(2), maxRefundable);
                                }
                              }}
                              onWheel={(e) => e.target.blur()}
                              placeholder="Leave empty for full refund"
                              className="flex-1 sm:flex-none sm:w-48 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 placeholder:text-xs"
                            />
                            <span className="text-xs text-slate-500 whitespace-nowrap">Max: {formatCurrency(maxRefundable)}</span>
                          </div>
                          {amountWarnings[ticket.ticketNumber] && (
                            <div className="mt-1 text-xs text-amber-600">{amountWarnings[ticket.ticketNumber]}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundInvoiceCard;