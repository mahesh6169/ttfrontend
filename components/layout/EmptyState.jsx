import Link from 'next/link';

// Shared empty state — see designGuides/02-Frontend-GUI/ProfileUnification.md (T6).
// Vertically centered block: teal main text, grey sub text, optional slim CTA. No icon.
// CTA is optional; pass either actionHref (Link) or actionOnClick (button — for CTAs that
// run logic first, e.g. set a localStorage redirect before navigating).
//
//   <EmptyState title="No tickets yet" description="You haven't purchased any tickets yet."
//               actionLabel="Browse Events" actionHref="/events" />
const CTA_CLASS =
  'mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors';

export default function EmptyState({ title, description, actionLabel, actionHref, actionOnClick }) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-16rem)] px-4">
      <h2 className="text-base sm:text-lg font-bold text-teal-700">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={CTA_CLASS}>{actionLabel}</Link>
      )}
      {actionLabel && !actionHref && actionOnClick && (
        <button type="button" onClick={actionOnClick} className={CTA_CLASS}>{actionLabel}</button>
      )}
    </div>
  );
}
