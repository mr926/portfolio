"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  _count?: { projects: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", order: "0" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchCategories() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data);
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  function openNew() {
    setEditId(null);
    setForm({ name: "", slug: "", order: String(categories.length) });
    setError("");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, order: String(cat.order) });
    setError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editId
        ? `/api/admin/categories/${editId}`
        : "/api/admin/categories";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          order: parseInt(form.order) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        fetchCategories();
      } else {
        setError(data.error || "Save failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      fetchCategories();
    } else {
      alert(data.error || "Delete failed");
    }
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setForm((f) => ({ ...f, name, ...(!editId && { slug }) }));
  }

  return (
    <div className="p-8 md:p-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-black mb-1">
            Categories
          </h1>
          <p className="text-sm text-[#5e5e5e]">{categories.length} categories</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Category
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tighter">
                {editId ? "Edit Category" : "New Category"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[#5e5e5e] hover:text-black"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black"
                  placeholder="Architecture"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black font-mono"
                  placeholder="architecture"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                  Order
                </label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                  className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black"
                  min="0"
                />
              </div>

              {error && (
                <p className="text-[#ba1a1a] text-[10px] tracking-widest uppercase">
                  {error}
                </p>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-black text-white py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-[#c6c6c6] py-3 text-[10px] font-bold tracking-widest uppercase hover:border-black transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories table */}
      {loading ? (
        <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6] animate-pulse">
          Loading...
        </p>
      ) : categories.length === 0 ? (
        <div className="py-32 text-center border border-dashed border-[#c6c6c6]">
          <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6]">
            No categories yet
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[rgba(198,198,198,0.3)]">
          <div className="grid grid-cols-12 px-6 py-3 border-b border-[rgba(198,198,198,0.15)] bg-[#f9f9f9]">
            <span className="col-span-1 text-[9px] uppercase tracking-widest text-[#5e5e5e]">#</span>
            <span className="col-span-4 text-[9px] uppercase tracking-widest text-[#5e5e5e]">Name</span>
            <span className="col-span-4 text-[9px] uppercase tracking-widest text-[#5e5e5e]">Slug</span>
            <span className="col-span-2 text-[9px] uppercase tracking-widest text-[#5e5e5e]">Projects</span>
            <span className="col-span-1" />
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="grid grid-cols-12 px-6 py-4 border-b border-[rgba(198,198,198,0.1)] hover:bg-[#f9f9f9] transition-colors items-center"
            >
              <span className="col-span-1 text-[11px] text-[#5e5e5e]">{cat.order}</span>
              <span className="col-span-4 text-sm font-medium text-black">{cat.name}</span>
              <span className="col-span-4 text-[11px] font-mono text-[#5e5e5e]">{cat.slug}</span>
              <span className="col-span-2 text-[11px] text-[#5e5e5e]">
                {cat._count?.projects ?? 0}
              </span>
              <div className="col-span-1 flex gap-2 justify-end">
                <button
                  onClick={() => openEdit(cat)}
                  className="text-[#5e5e5e] hover:text-black transition-colors"
                  title="Edit"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="text-[#5e5e5e] hover:text-[#ba1a1a] transition-colors"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
