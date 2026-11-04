'use client';

// Feature 1012: step 1 of creating or editing a thread - a WordPress-like writing page. Big headline
// title, sticky editor toolbar, the post in a ~720px column. Next checks the title and post before
// moving to step 2 (details).
import ThreadEditor from '@/components/threads/ThreadEditor';

export default function ThreadWriteStep({
  title, onTitleChange, question, onQuestionChange, errors = {}, onNext, onCancel, heading, onPictureUploaded,
}) {
  const bar = 'inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors';
  return (
    <div data-testid="thread-step-write">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" onClick={onCancel} className={`${bar} border border-slate-300 text-slate-700 hover:bg-slate-50`}>
          ✕ Cancel
        </button>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {heading} <span className="text-slate-400">- Step 1 of 2: Write</span>
        </p>
        <button type="button" onClick={onNext} className={`${bar} bg-teal-700 text-white hover:bg-teal-800`}>
          Next
        </button>
      </div>

      <div className="rounded-lg bg-white pb-6 shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto max-w-[720px] px-3 pt-6 sm:px-1">
          <label htmlFor="thread-title" className="sr-only">Title</label>
          <textarea
            id="thread-title"
            name="title"
            rows={1}
            value={title}
            maxLength={200}
            placeholder="Add a title"
            onChange={(e) => onTitleChange(e.target.value.replace(/\n/g, ' '))}
            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            className="w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-2xl font-bold leading-tight text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0 sm:text-4xl"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>
        <div className="mt-4 px-2 sm:px-4">
          <ThreadEditor variant="page" value={question} onChange={onQuestionChange} error={errors.question} onPictureUploaded={onPictureUploaded} />
        </div>
      </div>

    </div>
  );
}
