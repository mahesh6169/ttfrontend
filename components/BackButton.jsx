'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaChevronLeft } from 'react-icons/fa';

// Standard "Back" pill — teal/white, compact chevron.
// See designGuides/02-Frontend-GUI/style.md §4.
// Default action is router.back(); pass `href` to link to a specific route,
// or `onClick` for custom behaviour. `label` overrides the "Back" text.
export default function BackButton({ href, label = 'Back', onClick, className = '' }) {
  const router = useRouter();
  const cls = `inline-flex items-center gap-1 bg-teal-700 text-white hover:bg-teal-800 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${className}`;
  const inner = (
    <>
      <FaChevronLeft className="text-[11px]" />
      {label}
    </>
  );

  if (href) {
    return <Link href={href} className={cls}>{inner}</Link>;
  }
  return (
    <button type="button" onClick={onClick || (() => router.back())} className={cls}>
      {inner}
    </button>
  );
}
