'use client';
// A picture block inside the thread editor (feature 1012): one picture, or several as a picture set.
// Stored in the post HTML as <div data-pictures=""><img src=... width=... height=...>...</div>,
// exactly the shape the server allows (ttbackendflyio utils/helpers/shared/sanitize.js).
import { useState } from 'react';
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { FaChevronLeft, FaChevronRight, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import { sizedPictureUrl } from '@/utils/helpers/threads/richText';

const toPicture = (img) => ({
  src: img.getAttribute('src') || '',
  alt: img.getAttribute('alt') || '',
  width: parseInt(img.getAttribute('width'), 10) || null,
  height: parseInt(img.getAttribute('height'), 10) || null,
});

function PictureSetView({ node, editor, getPos, updateAttributes, deleteNode, extension, selected }) {
  const pictures = node.attrs.pictures || [];
  // "Add to set" uploads in progress: { previews: [url], done } - shown as faded tiles in this set.
  const [pending, setPending] = useState(null);

  // Read the latest pictures from the document (an upload may finish after other edits).
  const latest = () => {
    const pos = typeof getPos === 'function' ? getPos() : null;
    const current = pos == null ? null : editor.state.doc.nodeAt(pos);
    return current?.attrs?.pictures || pictures;
  };

  // Removing a picture deletes it from storage straight away (owner's choice), so the removal is
  // kept out of Undo - Undo cannot bring back a picture that no longer exists.
  const removePictures = (gone, next) => {
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (pos == null) return;
    const { tr } = editor.state;
    if (next.length) tr.setNodeMarkup(pos, undefined, { ...node.attrs, pictures: next });
    else tr.delete(pos, pos + node.nodeSize);
    tr.setMeta('addToHistory', false);
    editor.view.dispatch(tr);
    extension.options.onPicturesRemoved?.(gone.map((p) => p.src));
  };

  const removeAt = (i) => {
    const list = latest();
    removePictures([list[i]], list.filter((_, k) => k !== i));
  };

  const removeAll = () => removePictures(latest(), []);

  const moveBy = (i, d) => {
    const list = [...latest()];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    updateAttributes({ pictures: list });
  };

  const addMore = () => {
    const apply = (added) => {
      if (added?.length) updateAttributes({ pictures: [...latest(), ...added] });
    };
    apply.progress = setPending; // the editor reports upload progress here
    extension.options.onAddToSet?.(apply);
  };

  const label = pictures.length === 1 ? '1 picture' : `Picture set - ${pictures.length} pictures`;

  return (
    <NodeViewWrapper
      className={`my-3 rounded-lg border p-2 ${selected ? 'border-slate-400' : 'border-slate-200'}`}
      data-testid="editor-picture-block"
      contentEditable={false}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-800" data-drag-handle="">{label}</span>
        <button
          type="button"
          onClick={removeAll}
          className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 hover:bg-slate-50"
        >
          <FaTrash aria-hidden="true" /> Remove all
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {pictures.map((p, i) => (
          <div key={`${p.src}-${i}`} className="min-w-0">
          <div className="relative">
            <img
              src={sizedPictureUrl(p.src, 300)}
              alt={p.alt || `Picture ${i + 1}`}
              className="h-20 w-full rounded object-cover sm:h-24"
              draggable={false}
            />
            <button
              type="button"
              aria-label={`Remove picture ${i + 1}`}
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/75 text-white"
            >
              <FaTimes size={12} aria-hidden="true" />
            </button>
            {pictures.length > 1 && (
              <div className="absolute bottom-1 left-1 flex gap-1">
                <button
                  type="button"
                  aria-label={`Move picture ${i + 1} left`}
                  disabled={i === 0}
                  onClick={() => moveBy(i, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-800 disabled:opacity-40"
                >
                  <FaChevronLeft size={11} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move picture ${i + 1} right`}
                  disabled={i === pictures.length - 1}
                  onClick={() => moveBy(i, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-800 disabled:opacity-40"
                >
                  <FaChevronRight size={11} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          {p.alt && (
            <p className="mt-0.5 truncate text-[11px] text-slate-500" title={p.alt} data-testid="picture-name">
              {p.alt}
            </p>
          )}
          </div>
        ))}
        {pending?.previews.map((src, i) => (
          <div key={src} className="relative h-20 overflow-hidden rounded sm:h-24" data-testid="picture-uploading-tile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className={`h-full w-full object-cover ${i < pending.done ? '' : 'opacity-50'}`} />
            {i >= pending.done && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </span>
            )}
          </div>
        ))}
        <button
          type="button"
          disabled={!!pending}
          onClick={addMore}
          className="flex h-20 flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:h-24"
        >
          <FaPlus aria-hidden="true" /> Add to set
        </button>
      </div>
    </NodeViewWrapper>
  );
}

const PictureSet = Node.create({
  name: 'pictureSet',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return { onAddToSet: null, onPicturesRemoved: null };
  },

  addAttributes() {
    return {
      pictures: {
        default: [],
        parseHTML: (el) => Array.from(el.querySelectorAll('img')).map(toPicture).filter((p) => p.src),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-pictures]' }];
  },

  renderHTML({ node }) {
    const imgs = (node.attrs.pictures || []).map((p) => {
      const a = { src: p.src, alt: p.alt || '' };
      if (p.width) a.width = String(p.width);
      if (p.height) a.height = String(p.height);
      return ['img', a];
    });
    return ['div', { 'data-pictures': '' }, ...imgs];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PictureSetView);
  },
});

export default PictureSet;
