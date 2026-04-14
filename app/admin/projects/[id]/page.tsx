"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";

interface Category {
  id: string;
  name: string;
}

interface ProjectMeta {
  id: string;
  key: string;
  value: string;
  order: number;
}

interface Project {
  id: string;
  name: string;
  subtitle: string;
  slug: string;
  categoryId: string;
  category: Category;
  coverImage: string;
  status: string;
  isPinned: boolean;
  order: number;
  metas: ProjectMeta[];
}

const DEFAULT_META_KEYS = ["Year", "Client", "Typology", "Size", "Status", "Location"];

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [metas, setMetas] = useState<ProjectMeta[]>([]);
  const [metaSaving, setMetaSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/projects/${projectId}`).then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(async ([projData, catData]) => {
      if (projData.success) {
        const p = projData.data;
        setProject(p);
        setForm({
          name: p.name,
          subtitle: p.subtitle,
          slug: p.slug,
          categoryId: p.categoryId,
          coverImage: p.coverImage,
          status: p.status,
          isPinned: p.isPinned,
          order: String(p.order),
        });

        // Ensure all default meta keys exist (backfill for older projects)
        let currentMetas: ProjectMeta[] = p.metas || [];
        const existingKeys = new Set(currentMetas.map((m: ProjectMeta) => m.key));
        const missing = DEFAULT_META_KEYS.filter((k) => !existingKeys.has(k));
        if (missing.length > 0) {
          const created = await Promise.all(
            missing.map((key, i) =>
              fetch(`/api/admin/projects/${projectId}/metas`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value: "", order: currentMetas.length + i }),
              }).then((r) => r.json()).then((d) => d.data)
            )
          );
          currentMetas = [...currentMetas, ...created.filter(Boolean)];
        }

        // Sort: defaults first (in order), then custom
        currentMetas.sort((a, b) => {
          const ai = DEFAULT_META_KEYS.indexOf(a.key);
          const bi = DEFAULT_META_KEYS.indexOf(b.key);
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1;
          if (bi !== -1) return 1;
          return a.order - b.order;
        });
        setMetas(currentMetas);
      }
      if (catData.success) setCategories(catData.data);
      setLoading(false);
    });
  }, [projectId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, order: parseInt(form.order) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setError("");
        // Show success briefly
        setSaving(false);
        router.refresh();
      } else {
        setError(data.error || "Save failed");
        setSaving(false);
      }
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  // Meta management
  function addMeta() {
    setMetas((m) => [
      ...m,
      { id: `new_${Date.now()}`, key: "", value: "", order: m.length },
    ]);
  }

  function updateMeta(id: string, field: "key" | "value", val: string) {
    setMetas((m) => m.map((meta) => (meta.id === id ? { ...meta, [field]: val } : meta)));
  }

  function removeMeta(id: string) {
    setMetas((m) => m.filter((meta) => meta.id !== id));
  }

  async function saveMetas() {
    setMetaSaving(true);
    try {
      // Delete existing and recreate (simpler)
      // First: delete all existing metas
      for (const meta of metas.filter((m) => !m.id.startsWith("new_"))) {
        await fetch(`/api/admin/projects/${projectId}/metas/${meta.id}`, {
          method: "DELETE",
        });
      }
      // Then: create all metas
      for (let i = 0; i < metas.length; i++) {
        const meta = metas[i];
        if (meta.key.trim()) {
          const res = await fetch(`/api/admin/projects/${projectId}/metas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: meta.key, value: meta.value, order: i }),
          });
          const data = await res.json();
          if (data.success) {
            setMetas((m) => m.map((mm) => mm.id === meta.id ? data.data : mm));
          }
        }
      }
    } finally {
      setMetaSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6] animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <p className="text-[#ba1a1a]">Project not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <button
          onClick={() => router.push("/admin/projects")}
          className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-[#5e5e5e] hover:text-black transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          All Projects
        </button>
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-bold tracking-tighter text-black">
            {project.name}
          </h1>
          <Link
            href={`/admin/projects/${projectId}/cards`}
            className="flex items-center gap-2 border border-[#c6c6c6] px-4 py-2 text-[10px] font-bold tracking-widest uppercase hover:border-black transition-colors"
          >
            <span className="material-symbols-outlined text-sm">view_carousel</span>
            Manage Cards
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Left: Project form */}
        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-8">
            Project Details
          </h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm font-mono focus:outline-none focus:border-black transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                Category *
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

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

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                Order
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors"
                min="0"
              />
            </div>

            <ImageUpload
              label="Cover Image"
              value={form.coverImage}
              onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
              type="cover"
            />

            {error && (
              <p className="text-[#ba1a1a] text-[10px] tracking-widest uppercase">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Right: Metadata (key-value) */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] uppercase tracking-widest text-[#5e5e5e]">
              Project Info Fields
            </h2>
            <button
              onClick={addMeta}
              className="text-[10px] tracking-widest uppercase text-black underline hover:opacity-60 transition-opacity"
            >
              + Add Field
            </button>
          </div>

          <div className="space-y-3">
            {metas.map((meta) => {
              const isDefault = DEFAULT_META_KEYS.includes(meta.key);
              return (
                <div key={meta.id} className="flex gap-3 items-center">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    {/* Key */}
                    {isDefault ? (
                      <div className="flex items-center gap-1.5 pb-1 border-b border-[#e8e8e8]">
                        <span className="material-symbols-outlined text-[11px] text-[#c6c6c6]" style={{ fontSize: 12 }}>lock</span>
                        <span className="text-[11px] text-[#5e5e5e] select-none">{meta.key}</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={meta.key}
                        onChange={(e) => updateMeta(meta.id, "key", e.target.value)}
                        placeholder="Key"
                        className="bg-transparent border-b border-[#c6c6c6] pb-1 text-[11px] focus:outline-none focus:border-black transition-colors"
                      />
                    )}
                    {/* Value */}
                    <input
                      type="text"
                      value={meta.value}
                      onChange={(e) => updateMeta(meta.id, "value", e.target.value)}
                      placeholder={isDefault ? `${meta.key}…` : "Value"}
                      className="bg-transparent border-b border-[#c6c6c6] pb-1 text-[11px] focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  {/* Delete — only for custom fields */}
                  {isDefault ? (
                    <div className="w-5" />
                  ) : (
                    <button
                      onClick={() => removeMeta(meta.id)}
                      className="text-[#c6c6c6] hover:text-[#ba1a1a] transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {metas.filter((m) => !DEFAULT_META_KEYS.includes(m.key)).length === 0 && metas.length === 0 && (
            <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6] py-8">
              No fields yet.
            </p>
          )}

          <p className="text-[9px] text-[#c6c6c6] mt-4">
            留空的字段在前台不显示。
          </p>

          <button
            onClick={saveMetas}
            disabled={metaSaving}
            className="mt-6 w-full border border-black text-black py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-black hover:text-white disabled:opacity-50 transition-all"
          >
            {metaSaving ? "Saving..." : "Save Info Fields"}
          </button>

          {/* Quick link to cards */}
          <div className="mt-12 p-6 bg-[#f3f3f4] border border-[rgba(198,198,198,0.3)]">
            <p className="text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-4">
              Content Cards
            </p>
            <p className="text-sm text-black mb-4">
              Add images, text, and panoramas to this project&apos;s detail view.
            </p>
            <Link
              href={`/admin/projects/${projectId}/cards`}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">view_carousel</span>
              Manage Cards
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
