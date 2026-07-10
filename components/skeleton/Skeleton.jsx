// Skeleton primitives — see designGuides/02-Frontend-GUI/ProfileUnification.md (T3).
// Four building blocks (line, block, circle, text). Each is decorative, so it is
// hidden from screen readers (aria-hidden). The `.skeleton` class (globals.css) owns
// the base colour + shimmer; here we only set shape and size.

// Base block — a single shimmering shape. Size/shape comes from className/style.
export function Skeleton({ className = '', style }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} style={style} />;
}

// Text row.
export function SkeletonLine({ width = '100%', className = '' }) {
  return <Skeleton className={`h-4 rounded ${className}`} style={{ width }} />;
}

// Rectangle / image. Pass `aspectRatio` (e.g. '16 / 9') or `height` to reserve space (CLS).
export function SkeletonBlock({ width = '100%', height, aspectRatio, className = '' }) {
  const style = { width };
  if (height) style.height = height;
  if (aspectRatio) style.aspectRatio = aspectRatio;
  return <Skeleton className={`rounded-lg ${className}`} style={style} />;
}

// Avatar.
export function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <Skeleton
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// Paragraph — N lines, last one shorter (the recognisable ragged-text look).
export function SkeletonText({ lines = 3, lastWidth = '60%', className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? lastWidth : '100%'} />
      ))}
    </div>
  );
}
