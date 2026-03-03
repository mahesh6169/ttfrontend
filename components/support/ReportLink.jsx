'use client';

import Link from 'next/link';
import { MdReport } from 'react-icons/md';

// Map type to display label
const TYPE_LABELS = {
  listing: 'listing',
  advert: 'listing',
  event: 'event',
  thread: 'thread',
  topic: 'thread', // alias for backward compatibility
  deal: 'deal',
  discount: 'discount code',
};

const ReportLink = ({ type, id, title, returnUrl }) => {
  const label = TYPE_LABELS[type] || 'content';

  return (
    <Link
      href={`/support/report?type=${type}&id=${id}&title=${encodeURIComponent(title || '')}`}
      onClick={() => {
        if (returnUrl) {
          localStorage.setItem('reportReturnUrl', returnUrl);
        }
      }}
      className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
    >
      <MdReport className="text-lg" />
      <span className="hidden sm:inline">Report this {label}</span>
      <span className="sm:hidden">Report</span>
    </Link>
  );
};

export default ReportLink;
