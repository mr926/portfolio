"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SiteNav from "@/components/layout/SiteNav";
import SiteFooter from "@/components/layout/SiteFooter";
import LandingOverlay from "@/components/layout/LandingOverlay";
import ProjectDetailPanel from "@/components/project/ProjectDetailPanel";

interface Category {
  id: string;
  name: string;
  slug: string;
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
  isPinned: boolean;
  metas: { value: string }[];
}

interface SiteSettings {
  siteName: string;
  siteTagline: string;
  landingEnabled: boolean;
  landingBgDesktop: string;
  landingBgMobile: string;
  landingStayMs: number;
  landingAnimMs: number;
  landingHideMin: number;
  instagram: string;
  linkedin: string;
  email: string;
  logoUrl: string;
  logoMode: string;
  faviconUrl: string;
}

interface FooterLink { id: string; label: string; url: string; }
interface FooterColumn { id: string; title: string; links: FooterLink[]; }
interface NavPage { slug: string; title: string; }

const PAGE_SIZE = 12;

function HomeContent() {
  const searchParams = useSearchParams();

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([]);
  const [navPages, setNavPages] = useState<NavPage[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showLanding, setShowLanding] = useState(false);
  const [landingDone, setLandingDone] = useState(false);
  const [openProjectSlug, setOpenProjectSlug] = useState<string | null>(null);

  // Check URL for project slug
  useEffect(() => {
    const slug = searchParams.get("project");
    if (slug) {
      setOpenProjectSlug(slug);
      setLandingDone(true);
    }
  }, [searchParams]);

  // Fetch settings
  useEffect(() => {
    fetch("/api/public/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSettings(data.data);
          if (data.data.landingEnabled && !searchParams.get("project")) {
            setShowLanding(true);
          } else {
            setLandingDone(true);
          }
        }
      });
  }, []);

  // Fetch footer columns
  useEffect(() => {
    fetch("/api/public/footer")
      .then((r) => r.json())
      .then((d) => { if (d.success) setFooterColumns(d.data); });
  }, []);

  // Fetch nav pages
  useEffect(() => {
    fetch("/api/public/pages")
      .then((r) => r.json())
      .then((d) => { if (d.success) setNavPages(d.data); });
  }, []);

  // Fetch categories
  useEffect(() => {
    fetch("/api/public/categories")
      .then((r) => r.json())
      .then((data) => { if (data.success) setCategories(data.data); });
  }, []);

  // Fetch projects
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    params.set("limit", String(PAGE_SIZE));
    params.set("page", String(page));

    fetch(`/api/public/projects?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProjects(data.data.items);
          setTotal(data.data.total);
          setTotalPages(data.data.totalPages);
        }
      });
  }, [activeCategory, page]);

  const handleCategoryChange = useCallback((slug: string) => {
    setActiveCategory(slug);
    setPage(1);
  }, []);

  const handleLandingComplete = useCallback(() => {
    setShowLanding(false);
    setLandingDone(true);
  }, []);

  const handleOpenProject = useCallback((slug: string) => {
    setOpenProjectSlug(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("project", slug);
    window.history.pushState({}, "", url.toString());
  }, []);

  const handleCloseProject = useCallback(() => {
    setOpenProjectSlug(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    window.history.replaceState({}, "", url.toString());
  }, []);

  // 浏览器返回键关闭面板
  useEffect(() => {
    const handlePop = () => {
      const slug = new URLSearchParams(window.location.search).get("project");
      setOpenProjectSlug(slug);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const siteName = settings?.siteName || "CHAOS LAB";
  const navItems = [
    { label: "Works", href: "/" },
    ...navPages.map((p) => ({ label: p.title, href: `/pages/${p.slug}` })),
  ];

  return (
    <>
      {showLanding && settings && (
        <LandingOverlay
          bgDesktop={settings.landingBgDesktop}
          bgMobile={settings.landingBgMobile}
          siteName={siteName}
          tagline={settings.siteTagline}
          stayMs={settings.landingStayMs}
          animMs={settings.landingAnimMs}
          hideMin={settings.landingHideMin ?? 1440}
          onComplete={handleLandingComplete}
        />
      )}

      <div
        className={`min-h-screen flex flex-col transition-opacity duration-500 ${
          landingDone ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <SiteNav
          siteName={siteName}
          navItems={navItems}
          theme="light"
          logoUrl={settings?.logoUrl}
          logoMode={(settings?.logoMode as "name" | "logo" | "both") || "name"}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />

        <main className="pt-24 pb-20 flex-1">
          {/* ── Grid ── */}
          {projects.length === 0 ? (
            <div className="py-32 text-center">
              <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6]">
                No projects yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
              {projects.map((project) => {
                const year = project.metas?.[0]?.value || "";
                return (
                  <article
                    key={project.id}
                    className="group cursor-pointer overflow-hidden"
                    onClick={() => handleOpenProject(project.slug)}
                  >
                    <div className="aspect-square overflow-hidden">
                      {project.coverImage ? (
                        <img
                          src={project.coverImage}
                          alt={project.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#e8e8e8] flex items-center justify-center">
                          <span className="text-[#c6c6c6] text-[9px] tracking-widest uppercase">No Image</span>
                        </div>
                      )}
                    </div>
                    {/* Caption below image */}
                    <div className="px-2 pt-2 pb-2.5 bg-white">
                      <p className="text-black text-[13px] font-semibold tracking-tight leading-tight truncate">
                        {project.name}
                      </p>
                      {year && (
                        <p className="text-[#999] text-[11px] mt-0.5">{year}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-8 pt-12 pb-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-[10px] tracking-widest uppercase font-bold text-[#5e5e5e] hover:text-black disabled:opacity-25 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-[10px] tracking-widest uppercase text-[#c6c6c6]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-[10px] tracking-widest uppercase font-bold text-[#5e5e5e] hover:text-black disabled:opacity-25 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </main>

        <SiteFooter siteName={siteName} columns={footerColumns} />
      </div>

      {openProjectSlug && (
        <ProjectDetailPanel
          slug={openProjectSlug}
          siteName={siteName}
          onClose={handleCloseProject}
        />
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f9f9f9]" />}>
      <HomeContent />
    </Suspense>
  );
}
