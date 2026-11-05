// Shown with a real 404 status when the deal does not exist (deleted, or a bad link).
// Same look as the old inline not-found view (feature 1013).
export default function DealNotFound() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-9rem)]">
      <div className="text-center">
        <p className="text-slate-700">Deal not found</p>
        <a href="/deals" className="text-sm text-teal-700 hover:text-teal-800 mt-2 inline-block">
          Browse deals
        </a>
      </div>
    </div>
  );
}
