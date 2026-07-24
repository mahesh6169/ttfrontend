import { redirect } from 'next/navigation';

// RETIRED: the thread detail now lives on the server-rendered /threads/[slug] page
// (shared component components/threads/ThreadDetailContent.jsx). This stub forwards
// any straggler /threads/views/<id> links there — the slug page resolves a bare id
// via backward-compat. Delete once nothing links here.
export default async function ThreadViewsRedirect({ params }) {
  const { id } = await params;
  redirect(`/threads/${id}`);
}
