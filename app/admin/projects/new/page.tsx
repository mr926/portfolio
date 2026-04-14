"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    slug: "",
    categoryId: "",
    coverImage: "",
    status: "draft",
    isPinned: false,
    order: "0",
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data);
          if (data.data.length > 0) {
            setForm((f) => ({ ...f, categoryId: data.data[0].id }));
          }
        }
      });
  }, []);

  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setForm((f) => ({ ...f, name, slug }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          order: parseInt(form.order) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/admin/projects/${data.data.id}`);
      } else {
        setError(data.error || "Save failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 md:p-12 max-w-2xl">
      {/* Header */}
      <div className="mb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-[#5e5e5e] hover:text-black transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <h1 className="text-3xl font-bold tracking-tighter text-black">
          New Project
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
            Project Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
            placeholder="The Silent Refuge"
            required
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
            Subtitle (English)
          </label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
            placeholder="e.g. Kyoto Residence"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
            URL Slug *
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm text-black font-mono focus:outline-none focus:border-black transition-colors"
            placeholder="the-silent-refuge"
            required
          />
          <p className="text-[9px] text-[#5e5e5e] mt-1">
            Will be used as: /projects/{form.slug || "..."}
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
            Category *
          </label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
            required
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        {/* Options */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPinned"
            checked={form.isPinned}
            onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
            className="w-4 h-4"
          />
          <label htmlFor="isPinned" className="text-[10px] uppercase tracking-widest text-[#5e5e5e]">
            Pin to top
          </label>
        </div>

        {/* Cover Image */}
        <ImageUpload
          label="Cover Image"
          value={form.coverImage}
          onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
          type="cover"
        />

        {error && (
          <p className="text-[#ba1a1a] text-[10px] tracking-widest uppercase">{error}</p>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-black text-white py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating..." : "Create Project"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-[#c6c6c6] px-8 py-4 text-[10px] font-bold tracking-widest uppercase hover:border-black transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
