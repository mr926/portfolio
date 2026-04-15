"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SiteNav from "@/components/layout/SiteNav";
import SiteFooter from "@/components/layout/SiteFooter";

interface PageData {
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  coverImage: string;
}
interface NavPage { slug: string; title: string; }
interface SiteSettings {
  siteName: string;
  logoUrl: string;
  logoMode: "name" | "logo" | "both";
}

/* ─── Font stacks ────────────────────────────────────────────────────
   Body / UI: system sans (unchanged)
   Article headings: serif for editorial feel (matching reference screenshot)
──────────────────────────────────────────────────────────────────── */
const SANS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif";
const SERIF = "Georgia, 'Times New Roman', 'Songti SC', serif";
const MONO  = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/* ─── TOC ────────────────────────────────────────────────────────── */
interface TocEntry { id: string; text: string; level: 1 | 2; }

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\u4e00-\u9fa5 -]/g, "").trim().replace(/\s+/g, "-");
}

function extractToc(md: string): TocEntry[] {
  return md.split("\n").reduce<TocEntry[]>((acc, line) => {
    const m2 = line.match(/^##\s+(.+)/);
    const m1 = !m2 && line.match(/^#\s+(.+)/);
    if (m2) acc.push({ id: slugify(m2[1].trim()), text: m2[1].trim(), level: 2 });
    else if (m1) acc.push({ id: slugify(m1[1].trim()), text: m1[1].trim(), level: 1 });
    return acc;
  }, []);
}

/* ─── TOC Sidebar ────────────────────────────────────────────────── */
function TocSidebar({ entries, activeId }: { entries: TocEntry[]; activeId: string }) {
  if (entries.length < 2) return null;

  return (
    <nav aria-label="On this page" style={{ width: "100%" }}>
      {/* Label */}
      <p style={{
        fontFamily: SANS,
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#000",
        marginBottom: "14px",
        marginTop: 0,
      }}>
        On this page
      </p>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {entries.map((e) => {
          const active = activeId === e.id;
          return (
            <li key={e.id}>
              <a
                href={`#${e.id}`}
                onClick={(ev) => {
                  ev.preventDefault();
                  document.getElementById(e.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  display: "block",
                  fontFamily: SANS,
                  fontSize: "13px",
                  fontWeight: e.level === 1 ? 600 : 400,
                  lineHeight: "1.45",
                  color: active ? "#111" : "#666",
                  textDecoration: "none",
                  paddingLeft: e.level === 2 ? "12px" : "0",
                  paddingTop: "4px",
                  paddingBottom: "4px",
                  /* truncate long headings with ellipsis */
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  transition: "color 0.12s",
                }}
                title={e.text}
              >
                {e.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ─── Markdown component map ─────────────────────────────────────── */
const mdComponents = {
  /* Headings use serif — matching reference site's large serif h2 */
  h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = extractTextContent(children);
    return (
      <h1 id={slugify(text)} style={{
        fontFamily: SERIF,
        fontSize: "26px",
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: "-0.005em",
        color: "#111",
        marginTop: "2em",
        marginBottom: "0.5em",
        scrollMarginTop: "90px",
      }}>
        {children}
      </h1>
    );
  },

  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = extractTextContent(children);
    return (
      <h2 id={slugify(text)} style={{
        fontFamily: SERIF,
        fontSize: "20px",
        fontWeight: 700,
        lineHeight: 1.35,
        letterSpacing: "0",
        color: "#111",
        marginTop: "1.8em",
        marginBottom: "0.4em",
        scrollMarginTop: "90px",
      }}>
        {children}
      </h2>
    );
  },

  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 style={{
      fontFamily: SANS,
      fontSize: "16px",
      fontWeight: 700,
      lineHeight: 1.45,
      color: "#111",
      marginTop: "1.6em",
      marginBottom: "0.35em",
      scrollMarginTop: "90px",
    }}>
      {children}
    </h3>
  ),

  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p style={{
      fontFamily: SANS,
      fontSize: "15px",
      lineHeight: "1.8",
      letterSpacing: "0.01em",
      color: "#333",
      marginTop: 0,
      marginBottom: "0.9em",
    }}>
      {children}
    </p>
  ),

  a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      style={{ color: "#111", textDecoration: "underline", textDecorationColor: "#bbb", textUnderlineOffset: "3px" }}>
      {children}
    </a>
  ),

  blockquote: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote style={{
      borderLeft: "3px solid #ddd",
      paddingLeft: "1.2em",
      margin: "1.6em 0",
      color: "#666",
      fontStyle: "italic",
      fontFamily: SERIF,
      fontSize: "16px",
      lineHeight: 1.75,
    }}>
      {children}
    </blockquote>
  ),

  ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul style={{ fontFamily: SANS, fontSize: "15px", lineHeight: "1.8", color: "#333",
      paddingLeft: "1.4em", marginBottom: "0.9em", listStyleType: "disc" }}>
      {children}
    </ul>
  ),

  ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol style={{ fontFamily: SANS, fontSize: "15px", lineHeight: "1.8", color: "#333",
      paddingLeft: "1.4em", marginBottom: "0.9em", listStyleType: "decimal" }}>
      {children}
    </ol>
  ),

  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
    <li style={{ marginBottom: "0.35em" }}>{children}</li>
  ),

  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
    inline ? (
      <code style={{ fontFamily: MONO, fontSize: "0.875em", background: "#f3f3f4",
        color: "#c7254e", padding: "0.15em 0.4em", borderRadius: "3px" }}>
        {children}
      </code>
    ) : (
      <code style={{ display: "block", fontFamily: MONO, fontSize: "13px", lineHeight: 1.7,
        background: "#f7f7f8", border: "1px solid #e8e8e8", borderRadius: "4px",
        padding: "1.2em 1.4em", overflowX: "auto", whiteSpace: "pre",
        marginBottom: "1.5em", color: "#333" }}>
        {children}
      </code>
    ),

  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre style={{ marginBottom: "1.5em" }}>{children}</pre>
  ),

  img: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <span style={{ display: "block", margin: "2.4em 0" }}>
      <img src={src} alt={alt || ""} loading="lazy"
        style={{ maxWidth: "100%", height: "auto", borderRadius: "4px", display: "block" }} />
      {alt && (
        <span style={{ display: "block", fontFamily: SANS, fontSize: "13px", color: "#999",
          marginTop: "8px", fontStyle: "italic", lineHeight: 1.5 }}>
          {alt}
        </span>
      )}
    </span>
  ),

  hr: () => (
    <div style={{ textAlign: "center", margin: "3em 0", color: "#ccc",
      fontSize: "20px", letterSpacing: "0.5em", userSelect: "none" }}>···</div>
  ),

  strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <strong style={{ fontWeight: 700, color: "#111" }}>{children}</strong>
  ),

  em: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <em style={{ fontStyle: "italic" }}>{children}</em>
  ),
};

/* Helper: flatten React children to plain text for id generation */
function extractTextContent(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractTextContent).join("");
  if (children && typeof children === "object" && "props" in (children as object)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractTextContent((children as any).props?.children);
  }
  return "";
}

/* ─── Page component ─────────────────────────────────────────────── */
export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();

  const [pageData,  setPageData]  = useState<PageData | null>(null);
  const [settings,  setSettings]  = useState<SiteSettings | null>(null);
  const [navPages,  setNavPages]  = useState<NavPage[]>([]);
  const [notFound,  setNotFound]  = useState(false);
  const [activeId,  setActiveId]  = useState("");
  const articleRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/public/pages/${slug}`).then(r => r.json()),
      fetch("/api/public/settings").then(r => r.json()),
      fetch("/api/public/pages").then(r => r.json()),
    ]).then(([pr, sr, nr]) => {
      if (pr.success) setPageData(pr.data); else setNotFound(true);
      if (sr.success) setSettings(sr.data);
      if (nr.success) setNavPages(nr.data);
    });
  }, [slug]);

  /* Track active heading */
  useEffect(() => {
    const headings = articleRef.current?.querySelectorAll("h1[id], h2[id]");
    if (!headings?.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActiveId(e.target.id);
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 }
    );
    headings.forEach(h => obs.observe(h));
    return () => obs.disconnect();
  }, [pageData]);

  const siteName = settings?.siteName || "CHAOS LAB";
  const navItems = [
    { label: "Works", href: "/" },
    ...navPages.map(p => ({ label: p.title, href: `/pages/${p.slug}` })),
  ];

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6]">Page not found</p>
    </div>
  );

  const toc        = pageData ? extractToc(pageData.content) : [];
  const hasToc     = toc.length >= 2;
  const hasCover   = !!pageData?.coverImage;

  /* Nav is fixed, py-6 + logo h-7 ≈ 76px */
  const NAV_H = 76;
  /* TOC column width */
  const TOC_W = 200;
  /* Gap between TOC and content */
  const GAP   = 64;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Nav: untouched ─────────────────────────────────────────── */}
      <SiteNav
        siteName={siteName}
        navItems={navItems}
        logoUrl={settings?.logoUrl}
        logoMode={settings?.logoMode}
        theme="light"
      />

      {pageData ? (
        <main style={{ paddingTop: NAV_H }}>

          {/* ══════════════════════════════════════════════════════════
              HERO — exactly matching reference screenshot:
              · Image: fixed 300px wide, fills height of right col,
                borderRadius 10px, no forced aspect-ratio
              · Right col: vertically centered, title → subtitle
              · Container: max 900px, padding 60px sides
              · Whole row: alignItems stretch so image fills height
          ══════════════════════════════════════════════════════════ */}
          {/* ── Full-width banner ── outside the content container ── */}
          {hasCover && (
            <div style={{ width: "100%", overflow: "hidden" }}>
              {/* Responsive aspect ratio: 3/4 mobile → 16/9 tablet → 21/9 desktop */}
              <img
                src={pageData.coverImage}
                alt=""
                className="
                  w-full object-cover object-center block
                  aspect-[3/4]
                  sm:aspect-[16/9]
                  xl:aspect-[21/9]
                "
                style={{ display: "block" }}
              />
            </div>
          )}

          {/* ── Title + subtitle ── inside the content container ── */}
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 48px" }}>
            <div style={{
              paddingTop: hasCover ? "32px" : "48px",
              paddingBottom: "40px",
              borderBottom: "1px solid #e8e8e8",
            }}>
              {pageData.title && (
                <h1 style={{
                  fontFamily: SERIF,
                  fontSize: "34px",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  letterSpacing: "-0.01em",
                  color: "#111",
                  margin: "0 0 12px 0",
                }}>
                  {pageData.title}
                </h1>
              )}
              {pageData.subtitle && (
                <p style={{
                  fontFamily: SANS,
                  fontSize: "15px",
                  lineHeight: 1.7,
                  color: "#666",
                  margin: 0,
                  letterSpacing: "0.01em",
                }}>
                  {pageData.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              BODY: TOC sidebar (left) + article (right)
              Exactly matching screenshot: TOC ~200px, content fills rest.
              TOC is sticky. Only shown when ≥2 headings exist.
          ══════════════════════════════════════════════════════════ */}
          <div style={{
            maxWidth: "1160px",
            margin: "0 auto",
            padding: "0 40px",
            display: "flex",
            alignItems: "flex-start",
            gap: `${GAP}px`,
            paddingTop: "52px",
            paddingBottom: "100px",
          }}>

            {/* TOC */}
            {hasToc && (
              <aside
                style={{
                  flexShrink: 0,
                  width: TOC_W,
                  position: "sticky",
                  top: NAV_H + 32,
                  maxHeight: `calc(100vh - ${NAV_H + 64}px)`,
                  overflowY: "auto",
                }}
                className="hidden md:block"
              >
                <TocSidebar entries={toc} activeId={activeId} />
              </aside>
            )}

            {/* Article */}
            <div
              ref={articleRef}
              style={{
                flex: 1,
                minWidth: 0,
                /* comfortable line length — matches reference ~65ch */
                maxWidth: "680px",
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as never}>
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

      {/* ── Footer: untouched ──────────────────────────────────────── */}
      <SiteFooter siteName={siteName} />
    </div>
  );
}
