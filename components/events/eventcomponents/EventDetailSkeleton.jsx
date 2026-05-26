const EventDetailSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 px-2 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="mt-4 flex justify-between items-center">
        <div className="h-7 w-16 bg-slate-200 rounded-full"></div>
        <div className="h-5 w-20 bg-slate-200 rounded"></div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-[7] bg-white w-full space-y-4 p-2">
          <div className="aspect-[16/9] bg-slate-200 rounded"></div>

          <div className="h-7 w-3/4 bg-slate-200 rounded"></div>

          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-28 bg-slate-200 rounded-full"></div>
            <div className="h-6 w-36 bg-slate-200 rounded-full"></div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-3 w-full bg-slate-200 rounded"></div>
            <div className="h-3 w-full bg-slate-200 rounded"></div>
            <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
            <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
          </div>

          <div className="pt-2">
            <div className="h-10 w-40 bg-slate-200 rounded"></div>
          </div>
        </div>

        <div className="hidden lg:block flex-[3] sticky top-20 self-start space-y-4">
          <div className="border border-slate-200 p-3 rounded shadow-md w-full space-y-3">
            <div className="h-5 w-32 bg-slate-200 rounded"></div>
            <div className="h-24 w-full bg-slate-200 rounded"></div>
            <div className="flex justify-end">
              <div className="h-9 w-24 bg-slate-200 rounded"></div>
            </div>
          </div>

          <div className="flex justify-center py-3 px-4">
            <div className="h-8 w-24 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading event details...</span>
    </div>
  );
};

export default EventDetailSkeleton;
