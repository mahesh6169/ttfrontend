'use client';

import { useState } from 'react';
import { platformFeeFor, platformFeeLabel } from '@/utils/platformFee';

// Marketing "what you keep" calculator for the /tickets promo page.
// Reuses the single source of truth for the marketed fee (utils/platformFee.js),
// the same helper the refund step uses — enter a ticket price, see the fee + payout.
export default function TicketPayoutCalculator() {
  const [price, setPrice] = useState('20');

  const p = Number(price) || 0;
  const fee = platformFeeFor(p);
  const payout = Math.max(0, p - fee);

  return (
    <div className="mt-8 md:mt-10 max-w-sm mx-auto border-t border-slate-200 pt-6">
      <div className="flex items-center justify-center gap-3 mb-4">
        <label htmlFor="ticket-price" className="text-sm text-slate-600">
          If a ticket costs
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input
            id="ticket-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onWheel={(e) => e.target.blur()}
            className="w-28 pl-6 pr-3 py-2 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>
      </div>

      <dl className="space-y-2 text-left">
        <div className="flex justify-between text-sm">
          <dt className="text-slate-500">Platform fee ({platformFeeLabel()})</dt>
          <dd className="font-medium text-slate-700">${fee.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between items-baseline border-t border-slate-200 pt-2">
          <dt className="text-base font-semibold text-slate-900">You keep</dt>
          <dd className="text-lg font-bold text-teal-700">${payout.toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}
