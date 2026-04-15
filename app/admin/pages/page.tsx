"use client";

import { useState, useEffect } from "react";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import ImageUpload from "@/components/admin/ImageUpload";

interface Page {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  coverImage: string;
  showInNav: boolean;
  navOrder: number;
}

type FormState = {
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  coverImage: string;
  showInNav: boolean;
  navOrder: number;
};

const EMPTY_FORM: FormState = {
  slug: "",
  title: "",
  subtitle: "",
  content: "",
  coverImage: "",
  showInNav: false,
  navOrder: 0,
};

const INPUT_CLS =
  "w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors";
const LABEL_CLS =
  "block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2";

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  // "new" | slug string | null
  const [mode, setMode] = useState<"new" | string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPages(data.data);
        setLoading(false);
      });
  }, []);

  function openEdit(page: Page) {
    setMode(page.slug);
    setForm({
      slug: page.slug,
      title: page.title,
      subtitle: page.subtitle,
      content: page.content,
      coverImage: page.coverImage,
      showInNav: page.showInNav,
      navOrder: page.navOrder,
    });
    setSaved(false);
    setError("");
  }

  function openNew() {
    setMode("new");
    setForm(EMPTY_FORM);
    setSaved(false);
    setError("");
  }

  function upd<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      if (mode === "new") {
        // Create
        const res = await fetch("/api/admin/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success) {
          setPages((ps) => [...ps, data.data].sort((a, b) => a.navOrder - b.navOrder || a.slug.localeCompare(b.slug)));
          setMode(data.data.slug);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        } else {
          setError(data.error || "Save failed");
        }
      } else {
        // Update
        const res = await fetch(`/api/admin/pages/${mode}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success) {
          setPages((ps) =>
            ps
              .map((p) => (p.slug === mode ? data.data : p))
              .sort((a, b) => a.navOrder - b.navOrder || a.slug.localeCompare(b.slug))
          );
          setMode(data.data.slug); // slug may have changed
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        } else {
          setError(data.error || "Save failed");
        }
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!mode || mode === "new") return;
    if (!confirm(`Delete page "/${mode}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/pages/${mode}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPages((ps) => ps.filter((p) => p.slug !== mode));
        setMode(null);
        setForm(EMPTY_FORM);
      } else {
        setError(data.error || "Delete failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setDeleting(false);
    }
  }

  const editingPage = mode && mode !== "new" ? pages.find((p) => p.slug === mode) : null;

  return (
    <div className="p-8 md:p-12">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-black mb-2">Pages</h1>
          <p className="text-sm text-[#5e5e5e]">Manage static content pages</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Page
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        {/* Page list */}
        <div className="md:col-span-1">
          <h2 className="text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-4">All Pages</h2>
          {loading ? (
            <p className="text-[10px] text-[#c6c6c6] animate-pulse">Loading...</p>
          ) : (
            <div className="space-y-1">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => openEdit(page)}
                  className={`w-full text-left px-4 py-3 transition-all ${
                    mode === page.slug ? "bg-black text-white" : "hover:bg-[#f3f3f4] text-black"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{page.title || page.slug}</span>
                    {page.showInNav && (
                      <span className={`text-[8px] tracking-widest uppercase flex-shrink-0 ${mode === page.slug ? "text-white/50" : "text-[#5e5e5e]"}`}>
                        nav
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] tracking-wide ${mode === page.slug ? "text-white/50" : "text-[#c6c6c6]"}`}>
                    /pages/{page.slug}
                  </span>
                </button>
              ))}

              {pages.length === 0 && (
                <p className="text-[10px] text-[#c6c6c6] tracking-widest uppercase py-4">
                  No pages yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="md:col-span-2">
          {!mode ? (
            <div className="flex items-center justify-center h-64 border border-dashed border-[#c6c6c6]">
              <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6]">
                Select a page or create a new one
              </p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Slug */}
              <div>
                <label className={LABEL_CLS}>URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#c6c6c6] flex-shrink-0">/pages/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => upd("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className={INPUT_CLS}
                    placeholder="my-page"
                    required
                  />
                </div>
                <p className="text-[9px] text-[#c6c6c6] mt-1">
                  只能使用小写字母、数字和连字符
                  {mode !== "new" && <span className="text-amber-500">（修改 slug 会导致旧链接失效）</span>}
                </p>
              </div>

              {/* Title */}
              <div>
                <label className={LABEL_CLS}>Page Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => upd("title", e.target.value)}
                  className={INPUT_CLS}
                  placeholder="About CHAOS LAB"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className={LABEL_CLS}>副标题 <span className="text-[#c6c6c6] normal-case tracking-normal">（可为空）</span></label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => upd("subtitle", e.target.value)}
                  className={INPUT_CLS}
                  placeholder="一句话介绍本文的核心内容"
                />
              </div>

              {/* Cover image */}
              <div>
                <ImageUpload
                  label="封面大图（页面顶部横幅，建议 1600×700 或更宽）"
                  value={form.coverImage}
                  onChange={(url) => upd("coverImage", url)}
                  type="bg"
                />
                {form.coverImage && (
                  <div className="mt-3 relative">
                    <img
                      src={form.coverImage}
                      alt="cover preview"
                      className="w-full h-28 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => upd("coverImage", "")}
                      className="absolute top-2 right-2 bg-black/60 text-white text-[9px] px-2 py-1 hover:bg-black transition-colors"
                    >
                      移除
                    </button>
                  </div>
                )}
                <p className="text-[9px] text-[#c6c6c6] mt-1">
                  留空则不显示封面图，直接从标题开始
                </p>
              </div>

              {/* Show in nav */}
              <div className="flex items-start gap-4 py-4 border-t border-b border-[rgba(198,198,198,0.3)]">
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-1">
                    显示在顶部导航栏
                  </div>
                  <p className="text-[9px] text-[#c6c6c6]">
                    开启后，此页面链接会出现在网站顶部 bar
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={form.showInNav}
                    onChange={(e) => upd("showInNav", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-[10px] uppercase tracking-widest text-[#5e5e5e]">
                    {form.showInNav ? "ON" : "OFF"}
                  </span>
                </label>
              </div>

              {/* Nav order */}
              {form.showInNav && (
                <div>
                  <label className={LABEL_CLS}>导航排序（数字越小越靠前）</label>
                  <input
                    type="number"
                    value={form.navOrder}
                    onChange={(e) => upd("navOrder", parseInt(e.target.value) || 0)}
                    className={INPUT_CLS}
                    min="0"
                    step="1"
                  />
                </div>
              )}

              {/* Content */}
              <div>
                <label className={LABEL_CLS}>Content (Markdown)</label>
                <MarkdownEditor
                  value={form.content}
                  onChange={(v) => upd("content", v)}
                />
              </div>

              {error && (
                <p className="text-[#ba1a1a] text-[10px] tracking-widest uppercase">{error}</p>
              )}
              {saved && (
                <p className="text-green-600 text-[10px] tracking-widest uppercase">✓ Saved</p>
              )}

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-black text-white px-8 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : mode === "new" ? "Create Page" : "Save Page"}
                </button>

                {mode !== "new" && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-8 py-3 text-[10px] font-bold tracking-widest uppercase text-[#ba1a1a] border border-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white disabled:opacity-50 transition-colors"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                )}

                {editingPage && (
                  <a
                    href={`/pages/${editingPage.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-[#5e5e5e] hover:text-black transition-colors ml-auto"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Preview
                  </a>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
