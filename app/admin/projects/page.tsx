"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Project {
  id: string;
  name: string;
  subtitle: string;
  slug: string;
  category: Category;
  coverImage: string;
  status: string;
  isPinned: boolean;
  order: number;
  _count?: { cards: number };
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  published: { label: "Published", color: "bg-green-100 text-green-800" },
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-800" },
  hidden: { label: "Hidden", color: "bg-gray-100 text-gray-600" },
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  async function fetchProjects() {
    const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
    const res = await fetch(`/api/admin/projects${params}`);
    const data = await res.json();
    if (data.success) setProjects(data.data);
    setLoading(false);
  }

  async function fetchCategories() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [filterStatus]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      fetchProjects();
    } else {
      alert(data.error || "Delete failed");
    }
  }

  async function togglePin(project: Project) {
    await fetch(`/api/admin/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !project.isPinned }),
    });
    fetchProjects();
  }

  async function changeStatus(project: Project, status: string) {
    await fetch(`/api/admin/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchProjects();
  }

  return (
    <div className="p-8 md:p-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-black mb-1">
            Projects
          </h1>
          <p className="text-sm text-[#5e5e5e]">{projects.length} projects</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 bg-black text-white px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Project
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-6 mb-8 border-b border-[rgba(198,198,198,0.15)] pb-4">
        {["all", "published", "draft", "hidden"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-[10px] font-bold tracking-widest uppercase transition-all pb-1 ${
              filterStatus === s
                ? "text-black border-b border-black"
                : "text-[#5e5e5e] hover:text-black"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Projects list */}
      {loading ? (
        <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6] animate-pulse">
          Loading...
        </p>
      ) : projects.length === 0 ? (
        <div className="py-32 text-center border border-dashed border-[#c6c6c6]">
          <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6]">
            No projects yet
          </p>
          <Link
            href="/admin/projects/new"
            className="mt-6 inline-block text-[10px] tracking-widest uppercase text-black underline"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[rgba(198,198,198,0.3)]">
          {/* Table header */}
          <div className="grid grid-cols-12 px-6 py-3 border-b border-[rgba(198,198,198,0.15)] bg-[#f9f9f9]">
            <span className="col-span-1 text-[9px] uppercase tracking-widest text-[#5e5e5e]">Cover</span>
            <span className="col-span-4 text-[9px] uppercase tracking-widest text-[#5e5e5e]">Name</span>
            <span className="col-span-2 text-[9px] uppercase tracking-widest text-[#5e5e5e]">Category</span>
            <span className="col-span-2 text-[9px] uppercase tracking-widest text-[#5e5e5e]">Status</span>
            <span className="col-span-1 text-[9px] uppercase tracking-widest text-[#5e5e5e]">Cards</span>
            <span className="col-span-2" />
          </div>

          {projects.map((project) => {
            const statusInfo = STATUS_LABELS[project.status] || { label: project.status, color: "" };
            return (
              <div
                key={project.id}
                className="grid grid-cols-12 px-6 py-4 border-b border-[rgba(198,198,198,0.1)] hover:bg-[#f9f9f9] transition-colors items-center"
              >
                {/* Cover thumbnail */}
                <div className="col-span-1">
                  {project.coverImage ? (
                    <img
                      src={project.coverImage}
                      alt=""
                      className="w-10 h-12 object-cover bg-[#e8e8e8]"
                    />
                  ) : (
                    <div className="w-10 h-12 bg-[#e8e8e8] flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-[#c6c6c6]">image</span>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="col-span-4">
                  <div className="flex items-center gap-2">
                    {project.isPinned && (
                      <span className="material-symbols-outlined text-sm text-black" title="Pinned">
                        push_pin
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-medium text-black">{project.name}</p>
                      <p className="text-[10px] font-mono text-[#5e5e5e]">/{project.slug}</p>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <span className="col-span-2 text-[11px] text-[#5e5e5e]">
                  {project.category?.name || "—"}
                </span>

                {/* Status badge + quick change */}
                <div className="col-span-2">
                  <select
                    value={project.status}
                    onChange={(e) => changeStatus(project, e.target.value)}
                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 ${statusInfo.color} border-none focus:outline-none cursor-pointer`}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>

                {/* Card count */}
                <span className="col-span-1 text-[11px] text-[#5e5e5e]">
                  {project._count?.cards ?? 0}
                </span>

                {/* Actions */}
                <div className="col-span-2 flex gap-2 justify-end">
                  <button
                    onClick={() => togglePin(project)}
                    className={`transition-colors ${
                      project.isPinned ? "text-black" : "text-[#c6c6c6] hover:text-black"
                    }`}
                    title={project.isPinned ? "Unpin" : "Pin"}
                  >
                    <span className="material-symbols-outlined text-sm">push_pin</span>
                  </button>
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="text-[#5e5e5e] hover:text-black transition-colors"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </Link>
                  <Link
                    href={`/admin/projects/${project.id}/cards`}
                    className="text-[#5e5e5e] hover:text-black transition-colors"
                    title="Manage cards"
                  >
                    <span className="material-symbols-outlined text-sm">view_carousel</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className="text-[#5e5e5e] hover:text-[#ba1a1a] transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
