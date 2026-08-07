'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaChevronLeft } from 'react-icons/fa';

// Shared "Back" control — the SECONDARY button standard: back is navigation, not an
// action, so it is never the primary teal. White surface, slate-300 outline, rounded-lg,
// slate-700 text, "< Back" with a left chevron. See 00-shared/design-system.md sections 4
// (buttons) and 8 (page toolbar). Default action is router.back(); pass `href` to link to a
// specific route, or `onClick` for custom behaviour. `label` overrides the "Back" text.
export default function BackButton({ href, label = 'Back', onClick, className = '' }) {
  const router = useRouter();
  const cls = `inline-flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1.5 sm:px-5 sm:py-2.5 text-sm font-semibold transition-colors ${className}`;
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
