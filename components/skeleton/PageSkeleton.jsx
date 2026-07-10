// PageSkeleton — see designGuides/02-Frontend-GUI/ProfileUnification.md (T3).
// One component, four layout presets. A page picks the variant that matches its shape
// and how many rows to draw; it does NOT hand-roll its own skeleton.
//
//   <PageSkeleton variant="list" rows={6} />       // avatar + text rows
//   <PageSkeleton variant="card" rows={6} />       // image-card grid
//   <PageSkeleton variant="mediaRow" rows={6} />   // text column + right thumbnail (e.g. /threads)
//   <PageSkeleton variant="form" rows={4} />       // label + input field groups

import {
  Skeleton,
  SkeletonLine,
  SkeletonBlock,
  SkeletonCircle,
  SkeletonText,
} from './Skeleton';

const DEFAULT_ROWS = { list: 6, card: 6, mediaRow: 6, form: 4 };

// A list row: avatar + two lines.
function ListRow() {
  return (
    <div className="flex items-center gap-3">
      <SkeletonCircle size={40} />
      <div className="flex-1 space-y-2">
        <SkeletonLine width="40%" />
        <SkeletonLine width="70%" />
      </div>
    </div>
  );
}

// A card: image block + title + two lines. Card chrome matches the design system (T5).
function Card() {
  return (
    <div className="border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
      <SkeletonBlock aspectRatio="16 / 9" />
      <SkeletonLine width="80%" />
      <SkeletonText lines={2} />
    </div>
  );
}

// A media row: bordered card with a text column (title + 2 lines + meta) and a right
// thumbnail. Mirrors the thread list item on /threads (image sizes match that card).
function MediaRow() {
  return (
    <div className="border border-slate-200 rounded-xl shadow-sm">
      <div className="flex gap-3 p-3">
        <div className="flex-1 min-w-0 space-y-2">
          <SkeletonLine width="70%" />
          <SkeletonText lines={2} />
          <SkeletonLine width="45%" />
        </div>
        <Skeleton className="w-20 h-20 sm:w-32 sm:h-24 md:w-40 md:h-28 rounded shrink-0" />
      </div>
    </div>
  );
}

// A form field group: label + input.
function Field() {
  return (
    <div className="space-y-2">
      <SkeletonLine width="30%" />
      <SkeletonBlock height="2.5rem" />
    </div>
  );
}

export default function PageSkeleton({ variant = 'list', rows, className = '' }) {
  const count = rows ?? DEFAULT_ROWS[variant] ?? 6;
  const items = Array.from({ length: count });

  let body;
  if (variant === 'card') {
    body = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((_, i) => (
          <Card key={i} />
        ))}
      </div>
    );
  } else if (variant === 'mediaRow') {
    body = (
      <div className="space-y-3">
        {items.map((_, i) => (
          <MediaRow key={i} />
        ))}
      </div>
    );
  } else if (variant === 'form') {
    body = (
      <div className="space-y-5">
        {items.map((_, i) => (
          <Field key={i} />
        ))}
      </div>
    );
  } else {
    body = (
      <div className="space-y-4">
        {items.map((_, i) => (
          <ListRow key={i} />
        ))}
      </div>
    );
  }

  // role="status" announces once; the shapes themselves are aria-hidden.
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {body}
    </div>
  );
}
