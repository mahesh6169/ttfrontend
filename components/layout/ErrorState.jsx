import { FaSync } from 'react-icons/fa';

// Shared error state — see designGuides/02-Frontend-GUI/style.md §8.
// ONE simple red line + a teal "Try again" (refresh icon). Use for failed loads
// (not for "no data yet" — that's EmptyState). Pass `message` to override the line.
//
//   <ErrorState onRetry={() => window.location.reload()} />
//   <ErrorState message="Custom line" onRetry={refetch} />
export default function ErrorState({ message, title, onRetry }) {
  const line = message || title || "We're having trouble right now";
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-16rem)] px-4">
      <p className="text-sm text-red-600">{line}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors"
        >
          <FaSync className="text-xs" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
