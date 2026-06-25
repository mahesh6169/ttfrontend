// Shared profile page heading — see designGuides/02-Frontend-GUI/ProfileUnification.md (T2).
// Named "Heading" (not "Header") to avoid ambiguity with the app's global <Header> nav bar.
//
// Centered title + optional small description. Adds NO top spacing — the content shell's
// py-4 owns the gap from the app header, so the title sits at the same offset on every page.
// Render it as the first element of the page.
//
//   <ProfilePageHeading title="My Tickets" />
//   <ProfilePageHeading title="My Tickets" description="Tickets for paid events you've purchased" />
export default function ProfilePageHeading({ title, description }) {
  return (
    <div className="text-center mb-6">
      {/* Heading matched to /listings: text-sm sm:text-lg md:text-xl font-bold text-teal-900 */}
      <h1 className="text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-xs sm:text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}
