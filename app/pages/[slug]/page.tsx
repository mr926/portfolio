"use client";

import { useEffect, useState } from "react";
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

/* ─────────────────────────────────────────────────────────────────────────
   Font stack — system, Apple-first
───────────────────────────────────────────────────────────────────────── */
const FONT = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/* ─────────────────────────────────────────────────────────────────────────
   Markdown component map
   Body column: max 680px
   Body: 18px / 1.8 / letter-spacing 0.02em / mb 1.6em
───────────────────────────────────────────────────────────────────────── */
const md = {
  h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 style={{ fontFamily: FONT, fontSize: 40, fontWeight: 700, lineHeight: 1.22,
      letterSpacing: "-0.02em", color: "#111", marginTop: "2.6em", marginBottom: "0.55em" }}>
      {children}
    </h1>
  ),
  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, lineHeight: 1.3,
      letterSpacing: "-0.015em", color: "#111", marginTop: "2.2em", marginBottom: "0.5em" }}>
      {children}
    </h2>
  ),
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 600, lineHeight: 1.4,
      letterSpacing: "-0.01em", color: "#111", marginTop: "1.8em", marginBottom: "0.4em" }}>
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

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();

  const [pageData, setPageData] = useState<PageData | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [navPages, setNavPages] = useState<NavPage[]>([]);
  const [notFound, setNotFound] = useState(false);

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

  const hasCover = !!pageData?.coverImage;

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Nav — always floats above cover, switches theme ─────────── */}
      <SiteNav
        siteName={siteName}
        navItems={navItems}
        logoUrl={settings?.logoUrl}
        logoMode={settings?.logoMode}
        theme={hasCover ? "dark" : "light"}
      />

      {pageData ? (
        <main className="flex-1">

          {/* ════════════════════════════════════════════════════════════
              COVER IMAGE
              Full bleed, ~55–60 vh, image below nav (nav is fixed/absolute)
              Reference: fancy.pinathemes.com — wide cinematic crop
          ════════════════════════════════════════════════════════════ */}
          {hasCover && (
            <div
              style={{
                width: "100%",
                height: "clamp(320px, 58vh, 680px)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src={pageData.coverImage}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 35%",
                  display: "block",
                }}
              />
              {/* bottom fade — smooth transition to white article area */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 45%, rgba(255,255,255,0.12) 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              TITLE BLOCK
              Wider than body (max 800px), generous padding
              Matches reference: title sits clearly below image
          ════════════════════════════════════════════════════════════ */}
          <div
            style={{
              maxWidth: 800,
              margin: "0 auto",
              padding: hasCover
                ? "56px 32px 0"          // below cover image
                : "128px 32px 0",         // no cover — clear the fixed nav
            }}
          >
            {/* Eyebrow: site name as category-style label */}
            <p
              style={{
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#999",
                marginBottom: "18px",
              }}
            >
              {siteName}
            </p>

            {/* Page title */}
            {pageData.title && (
              <h1
                style={{
                  fontFamily: FONT,
                  fontSize: "clamp(32px, 4.5vw, 48px)",
                  fontWeight: 700,
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                  color: "#111",
                  marginBottom: "0",
                }}
              >
                {pageData.title}
              </h1>
            )}

            {/* Thin rule separator — clean break between title and body */}
            <div
              style={{
                width: "100%",
                height: "1px",
                background: "#e8e8e8",
                margin: "40px 0 0",
              }}
            />
          </div>

          {/* ════════════════════════════════════════════════════════════
              ARTICLE BODY
              Narrower column: max 680px, generous vertical breathing room
          ════════════════════════════════════════════════════════════ */}
          <article
            style={{
              maxWidth: 680,
              margin: "0 auto",
              padding: "52px 32px 112px",
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={md as never}
            >
              {pageData.content}
            </ReactMarkdown>
          </article>

        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6] animate-pulse">
            Loading…
          </p>
        </div>
      )}

      <SiteFooter siteName={siteName} />
    </div>
  );
}
