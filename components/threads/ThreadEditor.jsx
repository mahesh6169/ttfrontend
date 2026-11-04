'use client';

// Thread post editor (featureplans/threads-rich-editor.md, blog-style posts in feature 1012).
// Tiptap v3: StarterKit already bundles Link + Underline, so we DISABLE them there and register the
// dedicated extensions with our config. Toolbar: text style (Normal / Heading / Subheading), bold,
// italic, underline, strike, lists, Link, Map, Picture, undo, redo. Pictures go in picture blocks
// (one picture or a set). Emits sanitisable HTML; the server is the real wall. The visible-text
// counter mirrors the 15,000 cap (server re-checks).
import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { toast } from 'react-toastify';
import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough, FaListUl, FaListOl, FaUndo, FaRedo,
  FaLink, FaMapMarkerAlt, FaImage, FaCheck, FaUnlink,
} from 'react-icons/fa';
import PictureSet from '@/components/threads/editor/PictureSetNode';
import {
  tidyUrl, looksLikeUrl, normaliseLinkInput, isGoogleMapsUrl, THREAD_PICTURE_LIMIT,
} from '@/utils/helpers/threads/richText';
import { pictureProblem, uploadThreadPicture } from '@/utils/helpers/threads/threadPictures';

// Keeps a link's visible text equal to the tidied display of its href while the author types or
// pastes a web address (featureplans/threads-url-display.md). Links on the writer's own words
// ("click here") are left exactly as written. The href itself is never touched.
const TidyLinkText = Extension.create({
  name: 'tidyLinkText',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tidyLinkText'),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((t) => t.docChanged)) return null;
          const linkType = newState.schema.marks.link;
          if (!linkType) return null;
          const edits = [];
          newState.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const mark = node.marks.find((m) => m.type === linkType);
            if (!mark || !looksLikeUrl(node.text)) return;
            const desired = tidyUrl(mark.attrs.href || '');
            if (desired && node.text !== desired) {
              edits.push({ from: pos, to: pos + node.nodeSize, text: desired, mark });
            }
          });
          if (edits.length === 0) return null;
          const tr = newState.tr;
          // Apply from the end so earlier positions stay valid.
          for (let i = edits.length - 1; i >= 0; i--) {
            const e = edits[i];
            tr.insertText(e.text, e.from, e.to);
            tr.addMark(e.from, e.from + e.text.length, e.mark);
          }
          return tr;
        },
      }),
    ];
  },
});

const isHttps = (url) => /^https:\/\//i.test((url || '').trim());

const TEXT_LIMIT = 15000;

// One compact, tap-sized toolbar button. Wraps rather than shrinks on narrow phones.
function ToolButton({ onClick, active, disabled, label, children, wide }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection while clicking the toolbar
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active ? 'true' : undefined}
      title={label}
      className={`flex h-9 ${wide ? 'px-2.5 gap-1.5' : 'w-9'} shrink-0 items-center justify-center rounded-md border text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'border-teal-600 bg-teal-50 text-teal-700'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-0.5 h-6 w-px bg-slate-200" aria-hidden="true" />;

const countPictures = (editor) => {
  let n = 0;
  editor?.state.doc.descendants((node) => {
    if (node.type.name === 'pictureSet') n += (node.attrs.pictures || []).length;
  });
  return n;
};

// variant 'page': the full-page writing view (step 1 of creating/editing a thread) - no box around
// it, the toolbar sticks under the site header while scrolling, and the text sits in a ~720px column
// (about the width readers see on the thread page).
// onPictureUploaded(src): every picture uploaded in this session (the page sends the list on save /
// cancel so pictures removed before saving are deleted from storage).
export default function ThreadEditor({ value, onChange, error, variant = 'box', onPictureUploaded }) {
  const isPage = variant === 'page';
  const fileRef = useRef(null);
  const pendingAddRef = useRef(null); // set when "Add to set" asked for more pictures
  const addToSetRef = useRef(null);
  const [busy, setBusy] = useState(''); // "Uploading 1 of 3..."
  // While pictures upload: small previews of the picked files shown at the cursor right away.
  const [uploading, setUploading] = useState(null); // { previews: [url], done, top, left }
  // Small link box that pops up at the cursor: { mode: 'link'|'map', value, error, top, left }
  const [linkPanel, setLinkPanel] = useState(null);
  const wrapRef = useRef(null);
  const openLinkRef = useRef(null); // lets a click on a link inside the editor open the box

  const editor = useEditor({
    immediatelyRender: false, // required for Next.js SSR to avoid hydration mismatch
    shouldRerenderOnTransaction: true, // toolbar active states follow the cursor
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      // Links never "stretch": text typed right after a link (e.g. after linking "click here") is
      // plain text. Tiptap ties inclusive to autolink by default; autolink still works without it.
      Link.extend({ inclusive: () => false }).configure({
        autolink: true,        // typed URLs auto-convert as you type
        linkOnPaste: true,     // pasted URLs become links
        openOnClick: false,    // clicking a link in the editor edits, does not navigate
        protocols: ['https'],
        defaultProtocol: 'https',
        // https ONLY: an http:// (or other) URL stays plain text, matching the server wall.
        shouldAutoLink: (url) => isHttps(url),
        isAllowedUri: (url, { defaultValidate }) => isHttps(url) && defaultValidate(url),
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer', class: 'text-teal-700 underline' },
      }),
      TidyLinkText,
      PictureSet.configure({ onAddToSet: (apply) => addToSetRef.current?.(apply) }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: isPage
          ? 'thread-rich thread-editor-content mx-auto min-h-[55vh] w-full max-w-[720px] px-1 py-5 text-base leading-relaxed text-slate-800 focus:outline-none sm:text-[17px]'
          : 'thread-rich thread-editor-content min-h-[12rem] sm:min-h-[10rem] w-full px-3 py-2 text-base sm:text-sm text-slate-700 focus:outline-none',
      },
      // Clicking a link while writing opens the small link box to change or remove it.
      handleClick: (_view, _pos, event) => {
        if (event.target?.closest?.('a')) setTimeout(() => openLinkRef.current?.(null), 0);
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Empty editor -> '' so the parent's required-field check still fires (getHTML would be <p></p>).
      onChange(editor.isEmpty ? '' : editor.getHTML());
    },
  });

  // Keep the editor in sync when the value arrives/changes from OUTSIDE (e.g. the edit page loading a
  // thread). The guard skips the editor's own updates, so typing never causes a cursor jump.
  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    if (incoming !== (editor.isEmpty ? '' : editor.getHTML())) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  // Where to show a small pop-up (link box, upload previews): just under the cursor, kept inside the
  // writing area.
  const cursorSpot = (boxWidth = 320) => {
    let top = 8;
    let left = 8;
    const wrap = wrapRef.current?.getBoundingClientRect();
    try {
      const c = editor.view.coordsAtPos(editor.state.selection.to);
      if (wrap) {
        const w = Math.min(boxWidth, wrap.width - 16);
        top = c.bottom - wrap.top + 6;
        left = Math.max(8, Math.min(c.left - wrap.left, wrap.width - w - 8));
      }
    } catch { /* keep the default spot */ }
    return { top, left };
  };

  /* ---------------------------------- Pictures ---------------------------------- */

  // "Add to set" inside a picture block: pick files, then hand the uploaded pictures back.
  addToSetRef.current = (apply) => {
    pendingAddRef.current = apply;
    fileRef.current?.click();
  };

  const openPicturePicker = () => {
    pendingAddRef.current = null;
    fileRef.current?.click();
  };

  const handleFiles = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    const apply = pendingAddRef.current;
    pendingAddRef.current = null;
    if (!picked.length || !editor) return;

    const problems = picked.map(pictureProblem).filter(Boolean);
    problems.forEach((p) => toast.error(p));
    const files = picked.filter((f) => !pictureProblem(f));
    if (!files.length) return;

    const room = THREAD_PICTURE_LIMIT - countPictures(editor);
    if (files.length > room) {
      toast.error(
        room > 0
          ? `A thread can have up to ${THREAD_PICTURE_LIMIT} pictures. You can add ${room} more.`
          : `A thread can have up to ${THREAD_PICTURE_LIMIT} pictures.`
      );
      return;
    }

    const uploaded = [];
    const previews = files.map((f) => URL.createObjectURL(f));
    // "Add to set": the set shows the uploading tiles itself; otherwise a card at the cursor.
    const report = apply?.progress || ((u) => setUploading(u ? { ...u, ...cursorSpot(360) } : null));
    let done = 0;
    report({ previews, done });
    try {
      for (let i = 0; i < files.length; i++) {
        setBusy(`Uploading picture ${i + 1} of ${files.length}...`);
        const pic = await uploadThreadPicture(files[i]);
        uploaded.push(pic);
        onPictureUploaded?.(pic.src);
        done = i + 1;
        if (apply?.progress) apply.progress({ previews, done });
        else setUploading((u) => (u ? { ...u, done } : u));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Picture upload failed. Please try again.');
    } finally {
      setBusy('');
      report(null);
      previews.forEach((u) => URL.revokeObjectURL(u));
    }
    if (!uploaded.length) return;

    if (apply) apply(uploaded);
    else editor.chain().focus().insertContent({ type: 'pictureSet', attrs: { pictures: uploaded } }).run();
  };

  /* ---------------------------------- Links ---------------------------------- */

  // Link / Map: a small one-line box pops up at the cursor. Highlighted words become the link;
  // with nothing highlighted the link is added at the cursor (the address itself, or "View on map").
  // mode null = opened by clicking an existing link (Link or Map chosen from its address).
  const openLinkPanel = (mode) => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    const onLink = editor.isActive('link');
    const current = onLink ? editor.getAttributes('link').href || '' : '';
    const useMode = mode || (isGoogleMapsUrl(current) ? 'map' : 'link');
    let keep = useMode === 'map' ? (isGoogleMapsUrl(current) ? current : '') : current;
    if (!keep && !empty) {
      // Highlighted text that is already a web address fills the box.
      const picked = editor.state.doc.textBetween(from, to, ' ').trim();
      if (looksLikeUrl(picked)) {
        const { href } = normaliseLinkInput(picked, { mapsOnly: useMode === 'map' });
        if (href) keep = href;
      }
    }
    const { top, left } = cursorSpot();
    setLinkPanel({ mode: useMode, value: keep, error: '', top, left, onLink });
  };
  openLinkRef.current = openLinkPanel;

  const closeLinkPanel = (refocus = true) => {
    setLinkPanel(null);
    if (refocus) editor?.commands.focus();
  };

  const applyLink = () => {
    if (!editor || !linkPanel) return;
    const { href, error: problem } = normaliseLinkInput(linkPanel.value, { mapsOnly: linkPanel.mode === 'map' });
    if (problem) {
      setLinkPanel((p) => ({ ...p, error: problem }));
      return;
    }
    if (editor.state.selection.empty && !editor.isActive('link')) {
      const text = linkPanel.mode === 'map' ? 'View on map' : tidyUrl(href) || href;
      editor.chain().focus()
        .insertContent({ type: 'text', text, marks: [{ type: 'link', attrs: { href } }] })
        .unsetMark('link')
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setLinkPanel(null);
  };

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkPanel(null);
  };

  /* ---------------------------------- Render ---------------------------------- */

  const textLength = editor ? editor.getText().length : (value || '').length;
  const overLimit = textLength > TEXT_LIMIT;
  const pictureCount = countPictures(editor);
  const textStyle = editor?.isActive('heading', { level: 2 })
    ? 'h2'
    : editor?.isActive('heading', { level: 3 })
      ? 'h3'
      : 'p';
  const onLink = editor?.isActive('link');
  const onMapLink = onLink && isGoogleMapsUrl(editor?.getAttributes('link').href);

  const setTextStyle = (v) => {
    if (!editor) return;
    if (v === 'h2') editor.chain().focus().setHeading({ level: 2 }).run();
    else if (v === 'h3') editor.chain().focus().setHeading({ level: 3 }).run();
    else editor.chain().focus().setParagraph().run();
  };

  const shell = error
    ? 'border-red-500 focus-within:ring-red-300'
    : 'border-slate-300 focus-within:ring-teal-300';

  return (
    <div>
      <div ref={wrapRef} className={isPage ? 'relative w-full' : `relative w-full rounded-lg border focus-within:ring-2 ${shell}`}>
        {/* Toolbar: compact tap-sized buttons that wrap on narrow screens. */}
        <div
          data-testid="editor-toolbar"
          className={isPage
            ? 'sticky top-[calc(68px+env(safe-area-inset-top))] z-30 flex flex-wrap items-center justify-center gap-1 border-y border-slate-200 bg-white/95 p-1.5 backdrop-blur'
            : 'flex flex-wrap items-center gap-1 border-b border-slate-200 p-1.5'}
        >
          <label htmlFor="thread-text-style" className="sr-only">Text style</label>
          <select
            id="thread-text-style"
            value={textStyle}
            onChange={(e) => setTextStyle(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
          >
            <option value="p">Normal text</option>
            <option value="h2">Heading</option>
            <option value="h3">Subheading</option>
          </select>
          <Divider />
          <ToolButton label="Bold" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}><FaBold /></ToolButton>
          <ToolButton label="Italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><FaItalic /></ToolButton>
          <ToolButton label="Underline" active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()}><FaUnderline /></ToolButton>
          <ToolButton label="Strikethrough" active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()}><FaStrikethrough /></ToolButton>
          <Divider />
          <ToolButton label="Bullet list" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}><FaListUl /></ToolButton>
          <ToolButton label="Numbered list" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><FaListOl /></ToolButton>
          <Divider />
          <ToolButton wide label="Link" active={onLink && !onMapLink} onClick={() => openLinkPanel('link')}><FaLink aria-hidden="true" /><span>Link</span></ToolButton>
          <ToolButton wide label="Map" active={onMapLink} onClick={() => openLinkPanel('map')}><FaMapMarkerAlt aria-hidden="true" /><span>Map</span></ToolButton>
          <ToolButton wide label="Picture" disabled={!!busy || pictureCount >= THREAD_PICTURE_LIMIT} onClick={openPicturePicker}><FaImage aria-hidden="true" /><span>Picture</span></ToolButton>
          <Divider />
          <ToolButton label="Undo" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}><FaUndo /></ToolButton>
          <ToolButton label="Redo" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}><FaRedo /></ToolButton>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFiles}
            className="hidden"
            data-testid="thread-picture-input"
          />
        </div>

        <EditorContent editor={editor} />

        {/* Uploading: previews of the picked pictures appear at the cursor straight away, each one
            dimmed with a spinner until it is uploaded. */}
        {uploading && (
          <div
            role="status"
            data-testid="picture-uploading"
            style={{ top: uploading.top, left: uploading.left }}
            className="absolute z-20 w-[min(22.5rem,calc(100%-1rem))] rounded-lg border border-slate-200 bg-white p-2 shadow-md"
          >
            <p className="mb-1.5 text-xs font-medium text-slate-600">{busy || 'Uploading...'}</p>
            <div className="flex flex-wrap gap-1.5">
              {uploading.previews.map((src, i) => (
                <div key={src} className="relative h-16 w-16 overflow-hidden rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className={`h-full w-full object-cover ${i < uploading.done ? '' : 'opacity-50'}`} />
                  {i >= uploading.done && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link / Map box: a small one-line box at the cursor. Enter or the tick saves; Esc or
            clicking away closes it. */}
        {linkPanel && (
          <div
            data-testid="link-box"
            style={{ top: linkPanel.top, left: linkPanel.left }}
            className="absolute z-20 w-[min(20rem,calc(100%-1rem))] rounded-md border border-slate-200 bg-white px-2 py-1 shadow-md"
          >
            <div className="flex items-center gap-1">
              <input
                autoFocus
                aria-label={linkPanel.mode === 'map' ? 'Google Maps link' : 'Link address'}
                value={linkPanel.value}
                onChange={(e) => setLinkPanel((p) => ({ ...p, value: e.target.value, error: '' }))}
                onBlur={() => closeLinkPanel(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                  if (e.key === 'Escape') { e.preventDefault(); closeLinkPanel(); }
                }}
                placeholder={linkPanel.mode === 'map' ? 'Paste a Google Maps link' : 'Paste or type a link'}
                className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-teal-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-sm"
              />
              {linkPanel.onLink && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={removeLink}
                  aria-label="Remove link"
                  title="Remove link"
                  className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
                >
                  <FaUnlink aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={applyLink}
                aria-label="Save link"
                title="Save link"
                className="flex h-8 w-8 items-center justify-center rounded text-teal-700 hover:bg-teal-50"
              >
                <FaCheck aria-hidden="true" />
              </button>
            </div>
            {linkPanel.error && (
              <p role="alert" className="px-1 pb-1 text-xs text-red-600">{linkPanel.error}</p>
            )}
          </div>
        )}
      </div>

      <div className={`mt-1 flex items-start justify-between gap-2 ${isPage ? 'mx-auto max-w-[720px] border-t border-slate-100 pt-2' : ''}`}>
        <div className="flex-1">
          {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
          <p className="text-xs text-slate-500">
            Pictures: {pictureCount}/{THREAD_PICTURE_LIMIT} - JPEG, PNG or WebP
          </p>
        </div>
        <span className={`whitespace-nowrap text-xs ${overLimit ? 'text-red-500' : 'text-slate-500'}`}>
          {textLength}/{TEXT_LIMIT}
        </span>
      </div>
    </div>
  );
}
