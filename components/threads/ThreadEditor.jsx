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
  FaLink, FaMapMarkerAlt, FaImage,
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

export default function ThreadEditor({ value, onChange, error }) {
  const fileRef = useRef(null);
  const pendingAddRef = useRef(null); // set when "Add to set" asked for more pictures
  const addToSetRef = useRef(null);
  const [busy, setBusy] = useState(''); // "Uploading 1 of 3..."
  const [linkPanel, setLinkPanel] = useState(null); // { mode: 'link'|'map', value, error }

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
      Link.configure({
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
        class:
          'thread-rich thread-editor-content min-h-[12rem] sm:min-h-[10rem] w-full px-3 py-2 text-base sm:text-sm text-slate-700 focus:outline-none',
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
    try {
      for (let i = 0; i < files.length; i++) {
        setBusy(`Uploading picture ${i + 1} of ${files.length}...`);
        uploaded.push(await uploadThreadPicture(files[i]));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Picture upload failed. Please try again.');
    } finally {
      setBusy('');
    }
    if (!uploaded.length) return;

    if (apply) apply(uploaded);
    else editor.chain().focus().insertContent({ type: 'pictureSet', attrs: { pictures: uploaded } }).run();
  };

  /* ---------------------------------- Links ---------------------------------- */

  const openLinkPanel = (mode) => {
    if (!editor) return;
    const onLink = editor.isActive('link');
    if (editor.state.selection.empty && !onLink) {
      toast.info('Select the words you want to link first.');
      return;
    }
    const current = onLink ? editor.getAttributes('link').href || '' : '';
    const keep = mode === 'map' ? (isGoogleMapsUrl(current) ? current : '') : current;
    setLinkPanel({ mode, value: keep, error: '' });
  };

  const applyLink = () => {
    if (!editor || !linkPanel) return;
    const { href, error: problem } = normaliseLinkInput(linkPanel.value, { mapsOnly: linkPanel.mode === 'map' });
    if (problem) {
      setLinkPanel((p) => ({ ...p, error: problem }));
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
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
      <div className={`w-full rounded-lg border focus-within:ring-2 ${shell}`}>
        {/* Toolbar: compact tap-sized buttons that wrap on narrow screens. */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 p-1.5">
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

        {/* Link / Map box: shown under the toolbar after pressing Link or Map. */}
        {linkPanel && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
            <label htmlFor="thread-link-input" className="w-full text-xs font-semibold text-slate-700">
              {linkPanel.mode === 'map' ? 'Google Maps link for the selected words' : 'Web address for the selected words'}
            </label>
            <input
              id="thread-link-input"
              autoFocus
              value={linkPanel.value}
              onChange={(e) => setLinkPanel((p) => ({ ...p, value: e.target.value, error: '' }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') { e.preventDefault(); setLinkPanel(null); editor?.commands.focus(); }
              }}
              placeholder={linkPanel.mode === 'map' ? 'https://maps.app.goo.gl/...' : 'example.com'}
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-2 text-base sm:text-sm"
            />
            <button type="button" onClick={applyLink} className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">Save</button>
            {onLink && (
              <button type="button" onClick={removeLink} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">Remove link</button>
            )}
            <button type="button" onClick={() => { setLinkPanel(null); editor?.commands.focus(); }} className="h-10 rounded-md px-3 text-sm text-slate-600">Cancel</button>
            {linkPanel.error ? (
              <p role="alert" className="w-full text-xs text-red-600">{linkPanel.error}</p>
            ) : (
              <p className="w-full text-xs text-slate-500">
                {linkPanel.mode === 'map'
                  ? 'Only Google Maps links. The words will show with a map pin.'
                  : 'We add https:// for you. http:// addresses are not allowed.'}
              </p>
            )}
          </div>
        )}

        {busy && (
          <div role="status" className="border-b border-slate-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800">
            {busy}
          </div>
        )}

        <EditorContent editor={editor} />
      </div>

      <div className="mt-1 flex items-start justify-between gap-2">
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
