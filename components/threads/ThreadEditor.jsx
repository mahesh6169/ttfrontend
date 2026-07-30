'use client';

// Thread description rich-text editor (featureplans/threads-rich-editor.md).
// Tiptap v3: StarterKit already bundles Link + Underline, so we DISABLE them there and register the
// dedicated extensions with our locked config (autolink-only Link, no link button). Emits sanitisable
// HTML; the server is the real wall. The visible-text counter mirrors the 15,000 cap (server re-checks).
import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough, FaListUl, FaListOl, FaUndo, FaRedo,
} from 'react-icons/fa';
import { tidyUrl } from '@/utils/helpers/threads/richText';

// Keeps every link's visible text equal to the tidied display of its href, live as the author types
// or pastes (featureplans/threads-url-display.md). The href itself is never touched.
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
            if (!mark) return;
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
function ToolButton({ onClick, active, disabled, label, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection while clicking the toolbar
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'border-teal-600 bg-teal-50 text-teal-700'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

export default function ThreadEditor({ value, onChange, error }) {
  const editor = useEditor({
    immediatelyRender: false, // required for Next.js SSR to avoid hydration mismatch
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
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
    ],
    content: value || '',
    editorProps: {
      attributes: {
        // Reuse the old textarea's body sizing; the shell (border/focus/error) lives on the wrapper.
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
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const textLength = editor ? editor.getText().length : (value || '').length;
  const overLimit = textLength > TEXT_LIMIT;

  const shell = error
    ? 'border-red-500 focus-within:ring-red-300'
    : 'border-slate-300 focus-within:ring-teal-300';

  return (
    <div>
      <div className={`w-full rounded-lg border focus-within:ring-2 ${shell}`}>
        {/* Toolbar: one row of compact icon buttons, wraps on narrow screens. */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 p-1.5">
          <ToolButton label="Bold" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}><FaBold /></ToolButton>
          <ToolButton label="Italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><FaItalic /></ToolButton>
          <ToolButton label="Underline" active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()}><FaUnderline /></ToolButton>
          <ToolButton label="Strikethrough" active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()}><FaStrikethrough /></ToolButton>
          <span className="mx-0.5 h-6 w-px bg-slate-200" aria-hidden="true" />
          <ToolButton label="Bullet list" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}><FaListUl /></ToolButton>
          <ToolButton label="Numbered list" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><FaListOl /></ToolButton>
          <span className="mx-0.5 h-6 w-px bg-slate-200" aria-hidden="true" />
          <ToolButton label="Undo" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}><FaUndo /></ToolButton>
          <ToolButton label="Redo" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}><FaRedo /></ToolButton>
        </div>

        <EditorContent editor={editor} />
      </div>

      <div className="mt-1 flex items-start justify-between gap-2">
        <div className="flex-1">
          {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
        </div>
        <span className={`whitespace-nowrap text-xs ${overLimit ? 'text-red-500' : 'text-slate-500'}`}>
          {textLength}/{TEXT_LIMIT}
        </span>
      </div>
    </div>
  );
}
