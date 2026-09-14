"use client";

import { useEditor, EditorContent, Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo 
} from "lucide-react";
import { useEffect } from "react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const MenuBar = ({ editor }: { editor: TiptapEditor | null }) => {
  if (!editor) {
    return null;
  }

  const btnClass = (active: boolean) => 
    `p-2 rounded-md touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center ${
      active ? "bg-slate-200 text-slate-900" : "bg-transparent text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="flex flex-wrap gap-1 border-b p-2 bg-slate-50 rounded-t-md">
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        className={btnClass(editor.isActive("bold"))}
        title="Bold"
      >
        <Bold className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        className={btnClass(editor.isActive("italic"))}
        title="Italic"
      >
        <Italic className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
        className={btnClass(editor.isActive("strike"))}
        title="Strikethrough"
      >
        <Strikethrough className="w-5 h-5" />
      </button>

      <div className="w-px h-8 bg-slate-300 mx-1 self-center" />

      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("left").run(); }}
        className={btnClass(editor.isActive({ textAlign: "left" }))}
        title="Align Left"
      >
        <AlignLeft className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("center").run(); }}
        className={btnClass(editor.isActive({ textAlign: "center" }))}
        title="Align Center"
      >
        <AlignCenter className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("right").run(); }}
        className={btnClass(editor.isActive({ textAlign: "right" }))}
        title="Align Right"
      >
        <AlignRight className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("justify").run(); }}
        className={btnClass(editor.isActive({ textAlign: "justify" }))}
        title="Justify"
      >
        <AlignJustify className="w-5 h-5" />
      </button>

      <div className="w-px h-8 bg-slate-300 mx-1 self-center" />

      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        className={btnClass(editor.isActive("bulletList"))}
        title="Bullet List"
      >
        <List className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
        className={btnClass(editor.isActive("orderedList"))}
        title="Ordered List"
      >
        <ListOrdered className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }}
        className={btnClass(editor.isActive("blockquote"))}
        title="Blockquote"
      >
        <Quote className="w-5 h-5" />
      </button>

      <div className="w-px h-8 bg-slate-300 mx-1 self-center" />

      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
        className={btnClass(false)}
        title="Undo"
        disabled={!editor.can().undo()}
      >
        <Undo className="w-5 h-5 opacity-75" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
        className={btnClass(false)}
        title="Redo"
        disabled={!editor.can().redo()}
      >
        <Redo className="w-5 h-5 opacity-75" />
      </button>
    </div>
  );
};

export default function Editor({ value, onChange, className = "" }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight,
      FontFamily,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className={`border border-slate-300 rounded-md overflow-hidden bg-white flex flex-col ${className}`}>
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-y-auto cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
