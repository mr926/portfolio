"use client";

import { useState, useEffect } from "react";

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPage, setEditPage] = useState<Page | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPages(data.data);
        setLoading(false);
      });
  }, []);

  function openEdit(page: Page) {
    setEditPage(page);
    setForm({ title: page.title, content: page.content });
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editPage) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/pages/${editPage.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setPages((ps) =>
          ps.map((p) => (p.slug === editPage.slug ? data.data : p))
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 md:p-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tighter text-black mb-2">
          Pages
        </h1>
        <p className="text-sm text-[#5e5e5e]">
          Edit static content pages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        {/* Page list */}
        <div className="md:col-span-1">
          <h2 className="text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-4">
            Pages
          </h2>
          {loading ? (
            <p className="text-[10px] text-[#c6c6c6] animate-pulse">Loading...</p>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => openEdit(page)}
                  className={`w-full text-left px-4 py-3 text-sm transition-all ${
                    editPage?.slug === page.slug
                      ? "bg-black text-white"
                      : "hover:bg-[#f3f3f4] text-black"
                  }`}
                >
                  <span className="font-medium capitalize">{page.slug}</span>
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
          {!editPage ? (
            <div className="flex items-center justify-center h-64 border border-dashed border-[#c6c6c6]">
              <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6]">
                Select a page to edit
              </p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                  Page Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="About CHAOS LAB"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                  Content (HTML)
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={20}
                  className="w-full bg-transparent border border-[#c6c6c6] p-4 text-sm font-mono focus:outline-none focus:border-black transition-colors resize-y"
                  placeholder="<h2>Title</h2><p>Content...</p>"
                />
              </div>

              {saved && (
                <p className="text-green-600 text-[10px] tracking-widest uppercase">
                  ✓ Page saved
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="bg-black text-white px-8 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Page"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
