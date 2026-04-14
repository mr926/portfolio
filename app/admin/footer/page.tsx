"use client";

import { useState, useEffect } from "react";

interface FooterLink {
  id: string;
  label: string;
  url: string;
  order: number;
}

interface FooterColumn {
  id: string;
  title: string;
  order: number;
  links: FooterLink[];
}

const INPUT_CLS =
  "w-full bg-transparent border-b border-[#c6c6c6] pb-1.5 text-sm focus:outline-none focus:border-black transition-colors";
const LABEL_CLS = "block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-1.5";

export default function AdminFooterPage() {
  const [columns, setColumns] = useState<FooterColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/footer", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setColumns(d.data); setLoading(false); });
  }, []);

  // ── Column ops ─────────────────────────────────────────────────────────────

  async function addColumn() {
    const res = await fetch("/api/admin/footer", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    const d = await res.json();
    if (d.success) setColumns((prev) => [...prev, d.data]);
  }

  async function saveAll() {
    setSaving(true);
    setSaved(false);
    await Promise.all(
      columns.map(async (col) => {
        await fetch(`/api/admin/footer/${col.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: col.title }),
        });
        await Promise.all(
          col.links.map((link) =>
            fetch(`/api/admin/footer/links/${link.id}`, {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label: link.label, url: link.url }),
            })
          )
        );
      })
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function saveColumn(col: FooterColumn) {
    await fetch(`/api/admin/footer/${col.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: col.title }),
    });
  }

  async function deleteColumn(id: string) {
    if (!confirm("确定删除这个栏目？")) return;
    await fetch(`/api/admin/footer/${id}`, { method: "DELETE", credentials: "include" });
    setColumns((prev) => prev.filter((c) => c.id !== id));
  }

  function updateColumnTitle(id: string, title: string) {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }

  // ── Link ops ────────────────────────────────────────────────────────────────

  async function addLink(columnId: string) {
    const res = await fetch(`/api/admin/footer/${columnId}/links`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "", url: "" }),
    });
    const d = await res.json();
    if (d.success) {
      setColumns((prev) =>
        prev.map((c) => (c.id === columnId ? { ...c, links: [...c.links, d.data] } : c))
      );
    }
  }

  async function saveLink(link: FooterLink) {
    await fetch(`/api/admin/footer/links/${link.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: link.label, url: link.url }),
    });
  }

  async function deleteLink(columnId: string, linkId: string) {
    await fetch(`/api/admin/footer/links/${linkId}`, { method: "DELETE", credentials: "include" });
    setColumns((prev) =>
      prev.map((c) =>
        c.id === columnId ? { ...c, links: c.links.filter((l) => l.id !== linkId) } : c
      )
    );
  }

  function updateLink(columnId: string, linkId: string, field: "label" | "url", value: string) {
    setColumns((prev) =>
      prev.map((c) =>
        c.id === columnId
          ? { ...c, links: c.links.map((l) => (l.id === linkId ? { ...l, [field]: value } : l)) }
          : c
      )
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6] animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tighter text-black mb-2">Footer</h1>
        <p className="text-sm text-[#5e5e5e]">Manage footer columns and links</p>
      </div>

      {/* Fixed copyright column preview */}
      <div className="mb-8 p-6 border border-dashed border-[#c6c6c6] bg-[#fafafa]">
        <p className="text-[10px] uppercase tracking-widest text-[#c6c6c6] mb-3">第一栏（固定，版权信息）</p>
        <p className="text-sm font-bold text-black uppercase tracking-tighter">网站名称</p>
        <p className="text-xs text-[#5e5e5e] mt-1">© {new Date().getFullYear()} 网站名称. ALL RIGHTS RESERVED.</p>
      </div>

      {/* Dynamic columns */}
      <div className="space-y-6 mb-8">
        {columns.map((col) => (
          <div key={col.id} className="border border-[rgba(198,198,198,0.4)] p-6 space-y-5">
            {/* Column header */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className={LABEL_CLS}>栏目名称</label>
                <input
                  type="text"
                  value={col.title}
                  onChange={(e) => updateColumnTitle(col.id, e.target.value)}
                  onBlur={() => saveColumn(col)}
                  className={INPUT_CLS}
                  placeholder="例：INQUIRIES"
                />
              </div>
              <button
                onClick={() => deleteColumn(col.id)}
                className="text-[#ba1a1a] text-[10px] tracking-widest uppercase hover:opacity-70 transition-opacity flex-shrink-0 pb-2"
              >
                删除栏目
              </button>
            </div>

            {/* Links */}
            <div className="space-y-3 pl-4 border-l-2 border-[#e8e8e8]">
              {col.links.map((link) => (
                <div key={link.id} className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className={LABEL_CLS}>显示文字</label>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(col.id, link.id, "label", e.target.value)}
                      onBlur={() => saveLink(link)}
                      className={INPUT_CLS}
                      placeholder="Email"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className={LABEL_CLS}>链接（可空）</label>
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateLink(col.id, link.id, "url", e.target.value)}
                        onBlur={() => saveLink(link)}
                        className={INPUT_CLS}
                        placeholder="https://... 或 mailto:..."
                      />
                    </div>
                    <button
                      onClick={() => deleteLink(col.id, link.id)}
                      className="material-symbols-outlined text-[#ba1a1a] text-base pb-1.5 hover:opacity-70 transition-opacity"
                    >
                      delete
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => addLink(col.id)}
                className="text-[10px] uppercase tracking-widest text-[#5e5e5e] hover:text-black transition-colors flex items-center gap-1 mt-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                添加链接
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={addColumn}
          className="flex items-center gap-2 border border-[#c6c6c6] px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:border-black transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          添加栏目
        </button>

        <button
          onClick={saveAll}
          disabled={saving}
          className="bg-black text-white px-8 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save All"}
        </button>

        {saved && (
          <span className="text-green-600 text-[10px] tracking-widest uppercase">✓ Saved</span>
        )}
      </div>
    </div>
  );
}
