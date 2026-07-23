import { redirect } from 'next/navigation';

// RETIRED: the listing detail now lives on the server-rendered /listings/[slug]
// page. This stub forwards any straggler /listings/views/<id> links there — the
// slug page resolves a bare id via backward-compat. Delete once nothing links here.
export default async function ListingViewsRedirect({ params }) {
  const { id } = await params;
  redirect(`/listings/${id}`);
}
