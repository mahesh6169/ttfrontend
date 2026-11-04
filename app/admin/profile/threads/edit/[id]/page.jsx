'use client';
// Admin moderation of one thread (feature 1012). On someone else's thread an admin can only change
// the category, turn the group chat on or off, or delete it - never the writer's words or pictures.
// The admin's own threads open in the normal edit page ("Edit full post").
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import LoadingSpinner from '@/components/LoadingSpinner';
import { threadCategoryOptions } from '@/components/threads/categories';
import { buildSlugUrl } from '@/utils/slugUtils';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ModerateThreadPage() {
  const { id: threadId } = useParams() || {};
  const router = useRouter();
  const currentUser = useSelector((state) => state.user.user);

  const [thread, setThread] = useState(null);
  const [category, setCategory] = useState('');
  const [allowChat, setAllowChat] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!threadId) return;
    (async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/threads/public/${threadId}`);
        const t = data.thread || data;
        setThread(t);
        setCategory(t.category || '');
        setAllowChat(t.allowChat !== false);
      } catch {
        toast.error('Could not load this thread.');
      } finally {
        setLoading(false);
      }
    })();
  }, [threadId]);

  const save = async () => {
    setSaving(true);
    try {
      const body = { allowChat };
      if (category && category !== thread.category) body.category = category;
      const { data } = await axios.patch(`${BASE_URL}/admin/threads/${threadId}/moderate`, body, {
        withCredentials: true,
      });
      setThread((t) => ({ ...t, ...data.thread }));
      toast.success('Saved.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete this thread and its chat? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await axios.delete(`${BASE_URL}/admin/threads/byid/${threadId}`, { withCredentials: true });
      toast.success('Thread deleted.');
      router.push('/admin/profile/threads/moderation');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete.');
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!thread) return <p className="p-4 text-slate-600">Thread not found.</p>;

  const ownerId = thread.owner?._id || thread.owner;
  const isMine = currentUser?._id && String(ownerId) === String(currentUser._id);
  const legacyCategory = thread.category && !threadCategoryOptions.includes(thread.category);
  const viewUrl = buildSlugUrl('thread', thread.title, thread._id);

  return (
    <div className="mx-auto max-w-xl space-y-5 p-4">
      <div>
        <Link href="/admin/profile/threads/moderation" className="text-sm text-teal-700 underline">
          Back to thread moderation
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Moderate thread</h1>
        <p className="mt-1 text-sm text-slate-600">
          You can change the category, turn the group chat on or off, or delete the thread. The
          writer&apos;s words and pictures can only be changed by the writer.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <p className="font-semibold text-slate-900" data-testid="moderate-title">{thread.title}</p>
        <p className="mt-1 text-slate-600">Account: {thread.owner?.name || 'Unknown'}</p>
        {thread.author?.name && <p className="text-slate-600">Author name shown: {thread.author.name}</p>}
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href={viewUrl} target="_blank" className="text-teal-700 underline">View thread</Link>
          {isMine && (
            <Link href={`/threads/edit/${thread._id}`} className="text-teal-700 underline">Edit full post</Link>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label htmlFor="moderate-category" className="mb-1 block text-sm font-medium text-slate-700">Category</label>
          <select
            id="moderate-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-300 px-2 text-base sm:text-sm"
          >
            {legacyCategory && <option value={thread.category}>{thread.category} (old category)</option>}
            {threadCategoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={allowChat}
            onChange={(e) => setAllowChat(e.target.checked)}
            className="mt-1 h-5 w-5 accent-teal-700"
          />
          <span>
            <span className="block text-sm font-medium text-slate-700">Allow group chat on this post</span>
            <span className="block text-xs text-slate-500">Off: readers see no chat box and nobody can send messages. Old messages are kept.</span>
          </span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-11 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="h-11 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete thread'}
          </button>
        </div>
      </div>
    </div>
  );
}
