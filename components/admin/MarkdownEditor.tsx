"use client";

import { useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TOOLBAR = [
  { icon: "format_bold",           label: "Bold",           wrap: ["**", "**"],        placeholder: "bold text" },
  { icon: "format_italic",         label: "Italic",         wrap: ["_", "_"],           placeholder: "italic text" },
  { icon: "format_strikethrough",  label: "Strikethrough",  wrap: ["~~", "~~"],         placeholder: "strikethrough" },
  { icon: "title",                 label: "Heading 2",      wrap: ["\n## ", ""],        placeholder: "Heading" },
  { icon: "format_h3",             label: "Heading 3",      wrap: ["\n### ", ""],       placeholder: "Heading" },
  null, // divider
  { icon: "format_list_bulleted",  label: "Bullet list",    wrap: ["\n- ", ""],         placeholder: "item" },
  { icon: "format_list_numbered",  label: "Numbered list",  wrap: ["\n1. ", ""],        placeholder: "item" },
  { icon: "format_quote",          label: "Blockquote",     wrap: ["\n> ", ""],         placeholder: "quote" },
  null, // divider
  { icon: "code",                  label: "Inline code",    wrap: ["`", "`"],           placeholder: "code" },
  { icon: "data_object",           label: "Code block",     wrap: ["\n```\n", "\n```"], placeholder: "code" },
  { icon: "link",                  label: "Link",           wrap: ["[", "](url)"],      placeholder: "link text" },
  { icon: "horizontal_rule",       label: "Divider",        wrap: ["\n\n---\n\n", ""], placeholder: "" },
];

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  /* ── Insert text at cursor ─────────────────────────────────────── */
  const insertAtCursor = useCallback(
    (before: string, after: string, placeholder: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.slice(start, end) || placeholder;
      const newVal =
        value.slice(0, start) + before + selected + after + value.slice(end);
      const newStart = start + before.length;
      const newEnd = newStart + selected.length;
      pendingSelection.current = { start: newStart, end: newEnd };
      onChange(newVal);
      requestAnimationFrame(() => {
        if (!ta || !pendingSelection.current) return;
        ta.focus();
        ta.selectionStart = pendingSelection.current.start;
        ta.selectionEnd = pendingSelection.current.end;
        pendingSelection.current = null;
      });
    },
    [value, onChange]
  );

  /* ── Upload image and insert markdown ──────────────────────────── */
  const uploadImage = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", "image");
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.success) {
          const url = data.data.url;
          const name = file.name.replace(/\.[^.]+$/, "");
          insertAtCursor(`![${name}](${url})`, "", "");
        }
      } finally {
        setUploading(false);
      }
    },
    [insertAtCursor]
  );

  /* ── Paste image ───────────────────────────────────────────────── */
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const imageItem = Array.from(e.clipboardData.items).find((i) =>
        i.type.startsWith("image/")
      );
      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) await uploadImage(file);
      }
    },
    [uploadImage]
  );

  /* ── Drag-and-drop image ───────────────────────────────────────── */
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) await uploadImage(file);
    },
    [uploadImage]
  );

  return (
    <div className="border border-[#c6c6c6] focus-within:border-black transition-colors">

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#c6c6c6] bg-[#f9f9f9] flex-wrap">
        {TOOLBAR.map((btn, i) =>
          btn === null ? (
            <span key={`d${i}`} className="w-px h-4 bg-[#d8d8d8] mx-1 flex-shrink-0" />
          ) : (
            <button
              key={btn.icon}
              type="button"
              title={btn.label}
              onClick={() => {
                setTab("edit");
                insertAtCursor(btn.wrap[0], btn.wrap[1], btn.placeholder);
              }}
              className="p-1.5 rounded hover:bg-[#e8e8e8] text-[#5e5e5e] hover:text-black transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                {btn.icon}
              </span>
            </button>
          )
        )}

        {/* Image upload */}
        <span className="w-px h-4 bg-[#d8d8d8] mx-1 flex-shrink-0" />
        <button
          type="button"
          title="Upload image (or paste / drag-drop)"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded hover:bg-[#e8e8e8] text-[#5e5e5e] hover:text-black transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>image</span>
        </button>
        {uploading && (
          <span className="text-[9px] tracking-widest uppercase text-[#5e5e5e] animate-pulse ml-1">
            Uploading…
          </span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadImage(f);
            e.target.value = "";
          }}
        />

        {/* Edit / Preview toggle */}
        <div className="ml-auto flex border border-[#c6c6c6] overflow-hidden">
          {(["edit", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-[9px] tracking-widest uppercase transition-colors ${
                tab === t ? "bg-black text-white" : "text-[#5e5e5e] hover:text-black"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Editor / Preview ─────────────────────────────────────── */}
      {tab === "preview" ? (
        <div className="min-h-[460px] p-6 bg-white overflow-auto">
          {value.trim() ? (
            <div className="prose-md-editor">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-[#c6c6c6] text-sm italic">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          rows={24}
          spellCheck={false}
          className="w-full p-4 text-sm font-mono leading-relaxed focus:outline-none resize-y bg-white"
          placeholder={"# Page Title\n\nWrite your content in **Markdown**.\n\nPaste or drag-drop images directly into this editor."}
        />
      )}

      <div className="px-4 py-2 border-t border-[#c6c6c6] bg-[#f9f9f9] flex items-center justify-between">
        <span className="text-[9px] text-[#c6c6c6] tracking-widest">
          Markdown · 粘贴 / 拖拽图片可直接上传
        </span>
        <span className="text-[9px] text-[#c6c6c6]">{value.length} chars</span>
      </div>
    </div>
  );
}
