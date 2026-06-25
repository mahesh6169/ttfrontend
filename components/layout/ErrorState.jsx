// Shared error state — see designGuides/02-Frontend-GUI/ProfileUnification.md (T6).
// Sibling of EmptyState: vertically centered, RED headline, grey generic subtext, slim
// "Try again" retry button. Use for failed loads (not for "no data yet" — that's EmptyState).
//
//   <ErrorState onRetry={fetchInvoices} />
//   <ErrorState onRetry={() => window.location.reload()} />
export default function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this. Please try again.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-16rem)] px-4">
      <h2 className="text-base sm:text-lg font-bold text-red-600">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
