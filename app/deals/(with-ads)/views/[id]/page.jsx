import { redirect } from 'next/navigation';

// RETIRED: the deal detail now lives on the server-rendered /deals/[slugId] page
// (component components/dailydeals/dealcomponents/DealDetailContent.jsx). This stub
// forwards any straggler /deals/views/<id> links there — the slug page resolves a
// bare id via backward-compat. Delete once nothing links here.
export default async function DealViewsRedirect({ params }) {
  const { id } = await params;
  redirect(`/deals/${id}`);
}
