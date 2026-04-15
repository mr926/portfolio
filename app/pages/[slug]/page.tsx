"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SiteNav from "@/components/layout/SiteNav";
import SiteFooter from "@/components/layout/SiteFooter";

interface PageData {
  slug: string;
  title: string;
  content: string;
  coverImage: string;
}
interface NavPage { slug: string; title: string; }
interface SiteSettings {
  siteName: string;
  logoUrl: string;
  logoMode: "name" | "logo" | "both";
}

/* ── Font constants (unchanged from previous) ──────────────────────── */
const FONT = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/* ── TOC entry ─────────────────────────────────────────────────────── */
interface TocEntry { id: string; text: string; level: 1 | 2; }

/** Extract h1/h2 headings from raw markdown */
function extractToc(markdown: string): TocEntry[] {
  const lines = markdown.split("\n");
  const entries: TocEntry[] = [];
  for (const line of lines) {
    const m1 = line.match(/^#\s+(.+)/);
    const m2 = line.match(/^##\s+(.+)/);
    if (m1) {
      const text = m1[1].trim();
      entries.push({ id: slugify(text), text, level: 1 });
    } else if (m2) {
      const text = m2[1].trim();
      entries.push({ id: slugify(text), text, level: 2 });
    }
  }
  return entries;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/* ── Markdown component map ────────────────────────────────────────── */
function makeMd(addId: boolean) {
  const withId = (level: 1 | 2, children: React.ReactNode) => {
    const text = typeof children === "string" ? children
      : Array.isArray(children) ? children.map((c) => (typeof c === "string" ? c : "")).join("") : "";
    return addId ? slugify(text) : undefined;
  };

  return {
    h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 id={withId(1, children)}
        style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, lineHeight: 1.25,
          letterSpacing: "-0.02em", color: "#111", marginTop: "2.4em", marginBottom: "0.5em",
          scrollMarginTop: "96px" }}>
        {children}
      </h1>
    ),
    h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 id={withId(2, children)}
        style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, lineHeight: 1.35,
          letterSpacing: "-0.012em", color: "#111", marginTop: "2em", marginBottom: "0.45em",
          scrollMarginTop: "96px" }}>
        {children}
      </h2>
    ),
    h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, lineHeight: 1.4,
        color: "#111", marginTop: "1.6em", marginBottom: "0.4em", scrollMarginTop: "96px" }}>
        {children}
      </h3>
    ),
    p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p style={{ fontFamily: FONT, fontSize: 18, lineHeight: 1.8,
        letterSpacing: "0.02em", color: "#2b2b2b", marginBottom: "1.6em" }}>
        {children}
      </p>
    ),
    a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href}
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
        style={{ color: "#111", textDecoration: "underline",
          textDecorationColor: "#ccc", textUnderlineOffset: "3px" }}>
        {children}
      </a>
    ),
    blockquote: ({ children }: React.HTMLAttributes<HTMLElement>) => (
      <blockquote style={{ borderLeft: "3px solid #111", paddingLeft: "1.4em",
        margin: "2.2em 0", color: "#666", fontStyle: "italic",
        fontSize: 18, lineHeight: 1.8, letterSpacing: "0.02em", fontFamily: FONT }}>
        {children}
      </blockquote>
    ),
    ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul style={{ fontFamily: FONT, fontSize: 18, lineHeight: 1.8, letterSpacing: "0.02em",
        color: "#2b2b2b", paddingLeft: "1.5em", marginBottom: "1.6em", listStyleType: "disc" }}>
        {children}
      </ul>
    ),
    ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol style={{ fontFamily: FONT, fontSize: 18, lineHeight: 1.8, letterSpacing: "0.02em",
        color: "#2b2b2b", paddingLeft: "1.5em", marginBottom: "1.6em", listStyleType: "decimal" }}>
        {children}
      </ol>
    ),
    li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
      <li style={{ marginBottom: "0.4em" }}>{children}</li>
    ),
    code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
      inline ? (
        <code style={{ fontFamily: MONO, fontSize: "0.875em", background: "#f3f3f4",
          color: "#c7254e", padding: "0.15em 0.4em", borderRadius: 3 }}>
          {children}
        </code>
      ) : (
        <code style={{ display: "block", fontFamily: MONO, fontSize: 14, lineHeight: 1.7,
          background: "#f7f7f8", border: "1px solid #e8e8e8", borderRadius: 4,
          padding: "1.2em 1.4em", overflowX: "auto", whiteSpace: "pre",
          marginBottom: "1.6em", color: "#2b2b2b" }}>
          {children}
        </code>
      ),
    pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => (
      <pre style={{ marginBottom: "1.6em" }}>{children}</pre>
    ),
    img: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <span style={{ display: "block", margin: "2.5em 0", textAlign: "center" }}>
        <img src={src} alt={alt || ""} loading="lazy"
          style={{ maxWidth: "100%", height: "auto", borderRadius: 6, display: "inline-block" }} />
        {alt && (
          <span style={{ display: "block", fontFamily: FONT, fontSize: 13, color: "#999",
            marginTop: "0.75em", fontStyle: "italic", lineHeight: 1.5 }}>
            {alt}
          </span>
        )}
      </span>
    ),
    hr: () => (
      <div style={{ textAlign: "center", margin: "3.5em 0", color: "#ccc",
        fontSize: 22, letterSpacing: "0.5em", userSelect: "none" }}>···</div>
    ),
    strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
      <strong style={{ fontWeight: 700, color: "#111" }}>{children}</strong>
    ),
    em: ({ children }: React.HTMLAttributes<HTMLElement>) => (
      <em style={{ fontStyle: "italic" }}>{children}</em>
    ),
  };
}

const mdComponents = makeMd(true);

/* ── TOC sidebar component ─────────────────────────────────────────── */
function TableOfContents({ entries, activeId }: { entries: TocEntry[]; activeId: string }) {
  if (entries.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav aria-label="目录" style={{ width: "100%" }}>
      <p style={{
        fontFamily: FONT,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "#999",
        marginBottom: "16px",
      }}>
        目录
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {entries.map((entry) => {
          const isActive = activeId === entry.id;
          return (
            <li key={entry.id} style={{ marginBottom: "2px" }}>
              <a
                href={`#${entry.id}`}
                onClick={(e) => handleClick(e, entry.id)}
                style={{
                  display: "block",
                  fontFamily: FONT,
                  fontSize: entry.level === 1 ? 13 : 12,
                  fontWeight: entry.level === 1 ? 600 : 400,
                  lineHeight: 1.5,
                  color: isActive ? "#111" : "#999",
                  textDecoration: "none",
                  paddingLeft: entry.level === 2 ? "12px" : "0",
                  paddingTop: "5px",
                  paddingBottom: "5px",
                  borderLeft: isActive
                    ? "2px solid #111"
                    : "2px solid transparent",
                  paddingInlineStart: entry.level === 2 ? "14px" : "2px",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ── Main page component ───────────────────────────────────────────── */
export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();

  const [pageData, setPageData]   = useState<PageData | null>(null);
  const [settings, setSettings]   = useState<SiteSettings | null>(null);
  const [navPages, setNavPages]   = useState<NavPage[]>([]);
  const [notFound, setNotFound]   = useState(false);
  const [activeId, setActiveId]   = useState("");
  const articleRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/public/pages/${slug}`).then((r) => r.json()),
      fetch("/api/public/settings").then((r) => r.json()),
      fetch("/api/public/pages").then((r) => r.json()),
    ]).then(([pageRes, settingsRes, navRes]) => {
      if (pageRes.success) setPageData(pageRes.data);
      else setNotFound(true);
      if (settingsRes.success) setSettings(settingsRes.data);
      if (navRes.success) setNavPages(navRes.data);
    });
  }, [slug]);

  /* Intersection observer — track active heading */
  useEffect(() => {
    const headings = articleRef.current?.querySelectorAll("h1[id], h2[id]");
    if (!headings || headings.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [pageData]);

  const siteName = settings?.siteName || "CHAOS LAB";
  const navItems = [
    { label: "Works", href: "/" },
    ...navPages.map((p) => ({ label: p.title, href: `/pages/${p.slug}` })),
  ];

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6]">Page not found</p>
      </div>
    );
  }

  const hasCover  = !!pageData?.coverImage;
  const tocItems  = pageData ? extractToc(pageData.content) : [];
  const hasToc    = tocItems.length >= 2;

  /* NAV_H: py-6 (24×2) + logo h-7 (28) = 76px, add 4px buffer */
  const NAV_H = 80;

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── SiteNav: untouched ──────────────────────────────────────── */}
      <SiteNav
        siteName={siteName}
        navItems={navItems}
        logoUrl={settings?.logoUrl}
        logoMode={settings?.logoMode}
        theme="light"
      />

      {pageData ? (
        <main className="flex-1" style={{ paddingTop: NAV_H }}>

          {/* ══════════════════════════════════════════════════════════
              HERO — image LEFT + title RIGHT, same height
              No banner. The coverImage (if set) is the left column.
              On mobile: stacked.
          ══════════════════════════════════════════════════════════ */}
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 40px",
            }}
            className="md:flex md:items-stretch"
          >
            {/* Left: cover image */}
            {hasCover && (
              <div
                style={{ flex: "0 0 45%", maxWidth: "45%" }}
                className="hidden md:block"
              >
                <img
                  src={pageData.coverImage}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block",
                    borderRadius: 4,
                  }}
                />
              </div>
            )}

            {/* Mobile: cover image (stacked, above title) */}
            {hasCover && (
              <div className="md:hidden w-full mb-8">
                <img
                  src={pageData.coverImage}
                  alt=""
                  style={{
                    width: "100%",
                    height: "280px",
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block",
                    borderRadius: 4,
                  }}
                />
              </div>
            )}

            {/* Right (or full-width if no cover): title block */}
            <div
              style={{
                flex: hasCover ? "0 0 55%" : "1",
                maxWidth: hasCover ? "55%" : "100%",
                padding: hasCover ? "40px 0 40px 56px" : "56px 0 40px 0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              className="w-full"
            >
              {pageData.title && (
                <h1
                  style={{
                    fontFamily: FONT,
                    fontSize: "clamp(28px, 3.5vw, 44px)",
                    fontWeight: 700,
                    lineHeight: 1.18,
                    letterSpacing: "-0.025em",
                    color: "#111",
                    marginBottom: 0,
                  }}
                >
                  {pageData.title}
                </h1>
              )}
            </div>
          </div>

          {/* Full-width hairline under hero */}
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 40px",
            }}
          >
            <div style={{ height: 1, background: "#e8e8e8", marginBottom: 0 }} />
          </div>

          {/* ══════════════════════════════════════════════════════════
              BODY — TOC left sidebar + article right
              TOC is sticky; only shown when ≥2 headings exist.
              On mobile: TOC hidden, article full-width.
          ══════════════════════════════════════════════════════════ */}
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "56px 40px 100px",
              display: "flex",
              gap: "64px",
              alignItems: "flex-start",
            }}
          >
            {/* TOC sidebar — 200px, sticky */}
            {hasToc && (
              <aside
                style={{
                  flex: "0 0 200px",
                  width: 200,
                  position: "sticky",
                  top: NAV_H + 24,
                  alignSelf: "flex-start",
                  maxHeight: `calc(100vh - ${NAV_H + 48}px)`,
                  overflowY: "auto",
                }}
                className="hidden md:block"
              >
                <TableOfContents entries={tocItems} activeId={activeId} />
              </aside>
            )}

            {/* Article body */}
            <div
              ref={articleRef}
              style={{
                flex: 1,
                minWidth: 0,
                /* cap line length for comfortable reading */
                maxWidth: hasToc ? 680 : 680,
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={mdComponents as never}
              >
                {pageData.content}
              </ReactMarkdown>
            </div>
          </div>

        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center" style={{ paddingTop: NAV_H }}>
          <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6] animate-pulse">
            Loading…
          </p>
        </div>
      )}

      {/* ── SiteFooter: untouched ───────────────────────────────────── */}
      <SiteFooter siteName={siteName} />
    </div>
  );
}
