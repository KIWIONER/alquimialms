import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { Markdown } from 'tiptap-markdown';

const RichCardEditor = ({ content, onChange, onFocus, placeholder = 'Escribe aquí...' }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [3] } }),
            Highlight.configure({ multicolor: false }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder }),
            Markdown.configure({
                html: true,
                tightLists: true,
                tightListItems: true,
                transformPastedText: true,
                transformCopiedText: true,
                breaks: true,
            }),
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            const md = editor.storage.markdown.getMarkdown();
            onChange(md);
        },
        onFocus: ({ editor }) => {
            if (onFocus) onFocus(editor);
        }
    });

    // Sincronizar contenido si cambia externamente (ej: cambio de doc)
    useEffect(() => {
        if (editor && content !== editor.storage.markdown.getMarkdown()) {
            editor.commands.setContent(content || '');
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className="flex-1 cursor-text overflow-visible">
            <style>{`
                .tiptap { outline: none; min-height: 100px; }
                .tiptap p { margin-bottom: 1.25rem; font-size: 1rem; color: #334155; line-height: 1.7; }
                .tiptap h3 { font-size: 1.5rem; font-weight: 800; margin: 2rem 0 1rem; color: #0f172a; }
                .tiptap strong { color: #0f172a; font-weight: 800; }
                .tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
                .tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
                .tiptap li { font-size: 0.95rem; color: #475569; margin-bottom: 0.4rem; }
                .tiptap mark { background-color: #fef08a; border-radius: 2px; padding: 0 2px; }
                .tableWrapper { overflow-x: auto; margin: 1.5rem 0; }
                .tiptap table { border-collapse: collapse; width: 100%; overflow: hidden; border-radius: 8px; border: 1px solid #e2e8f0; }
                .tiptap thead { background-color: #f1f5f9; }
                .tiptap td, .tiptap th { border: 1px solid #e2e8f0; padding: 10px 14px; vertical-align: top; font-size: 0.85rem; text-align: left; position: relative; }
                .tiptap th { font-weight: 700; color: #1e293b; background-color: #f1f5f9; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
                .tiptap td { color: #475569; }
                .tiptap tr:hover td { background-color: #f8fafc; }
                .tiptap .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(16, 185, 129, 0.08); pointer-events: none; }
                .tiptap .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #10b981; pointer-events: none; }
                .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #94a3b8; pointer-events: none; height: 0; }
            `}</style>
            <EditorContent editor={editor} />
        </div>
    );
};

export default RichCardEditor;
