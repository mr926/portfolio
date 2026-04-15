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
   Typography system
   Target: Medium / Ghost Casper reading feel
   Font: system stack, Apple-first
   Column: max 680px, centered
   Body: 18px / 1.8 / letter-spacing 0.02em
───────────────────────────────────────────────────────────────────────── */

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif";

const mdComponents = {
  h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      style={{
        fontFamily: FONT_STACK,
        fontSize: "40px",
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: "-0.02em",
        color: "#111",
        marginTop: "2.8em",
        marginBottom: "0.6em",
      }}
    >
      {children}
    </h1>
  ),

  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      style={{
        fontFamily: FONT_STACK,
        fontSize: "28px",
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: "-0.015em",
        color: "#111",
        marginTop: "2.4em",
        marginBottom: "0.5em",
      }}
    >
      {children}
    </h2>
  ),

  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      style={{
        fontFamily: FONT_STACK,
        fontSize: "22px",
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: "-0.01em",
        color: "#111",
        marginTop: "2em",
        marginBottom: "0.45em",
      }}
    >
      {children}
    </h3>
  ),

  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      style={{
        fontFamily: FONT_STACK,
        fontSize: "18px",
        lineHeight: 1.8,
        letterSpacing: "0.02em",
        color: "#2b2b2b",
        marginBottom: "1.6em",
      }}
    >
      {children}
    </p>
  ),

  a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      style={{
        color: "#111",
        textDecoration: "underline",
        textDecorationColor: "#ccc",
        textUnderlineOffset: "3px",
        transition: "text-decoration-color 0.15s",
      }}
    >
      {children}
    </a>
  ),

  blockquote: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      style={{
        borderLeft: "3px solid #111",
        paddingLeft: "1.4em",
        paddingTop: "0.1em",
        paddingBottom: "0.1em",
        margin: "2.2em 0",
        color: "#666",
        fontStyle: "italic",
        fontSize: "18px",
        lineHeight: 1.8,
        letterSpacing: "0.02em",
        fontFamily: FONT_STACK,
      }}
    >
      {children}
    </blockquote>
  ),

  ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      style={{
        fontFamily: FONT_STACK,
        fontSize: "18px",
        lineHeight: 1.8,
        letterSpacing: "0.02em",
        color: "#2b2b2b",
        paddingLeft: "1.5em",
        marginBottom: "1.6em",
        listStyleType: "disc",
      }}
    >
      {children}
    </ul>
  ),

  ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      style={{
        fontFamily: FONT_STACK,
        fontSize: "18px",
        lineHeight: 1.8,
        letterSpacing: "0.02em",
        color: "#2b2b2b",
        paddingLeft: "1.5em",
        marginBottom: "1.6em",
        listStyleType: "decimal",
      }}
    >
      {children}
    </ol>
  ),

  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
    <li style={{ marginBottom: "0.4em" }}>{children}</li>
  ),

  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
    inline ? (
      <code
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: "0.875em",
          background: "#f3f3f4",
          color: "#c7254e",
          padding: "0.15em 0.4em",
          borderRadius: "3px",
        }}
      >
        {children}
      </code>
    ) : (
      <code
        style={{
          display: "block",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: "14px",
          lineHeight: 1.7,
          background: "#f7f7f8",
          border: "1px solid #e8e8e8",
          borderRadius: "4px",
          padding: "1.2em 1.4em",
          overflowX: "auto",
          whiteSpace: "pre",
          marginBottom: "1.6em",
          color: "#2b2b2b",
        }}
      >
        {children}
      </code>
    ),

  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre style={{ marginBottom: "1.6em" }}>{children}</pre>
  ),

  img: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <span style={{ display: "block", margin: "2.5em 0", textAlign: "center" }}>
      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        style={{
          maxWidth: "100%",
          height: "auto",
          borderRadius: "6px",
          display: "inline-block",
        }}
      />
      {alt && (
        <span
          style={{
            display: "block",
            fontFamily: FONT_STACK,
            fontSize: "13px",
            color: "#999",
            marginTop: "0.75em",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          {alt}
        </span>
      )}
    </span>
  ),

  hr: () => (
    <div
      style={{
        textAlign: "center",
        margin: "3.5em 0",
        color: "#ccc",
        fontSize: "22px",
        letterSpacing: "0.5em",
        userSelect: "none",
      }}
    >
      ···
    </div>
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
      <SiteNav
        siteName={siteName}
        navItems={navItems}
        logoUrl={settings?.logoUrl}
        logoMode={settings?.logoMode}
        /* transparent over cover image when present */
        theme={hasCover ? "dark" : "light"}
      />

      {pageData ? (
        <main className="flex-1">

          {/* ── Cover image — 40vh, full bleed ──────────────────────── */}
          {hasCover && (
            <div
              style={{ height: "40vh", minHeight: "280px", maxHeight: "520px" }}
              className="w-full relative overflow-hidden"
            >
              <img
                src={pageData.coverImage}
                alt=""
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 40%" }}
              />
              {/* subtle dark vignette at bottom */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.06) 100%)",
                }}
              />
            </div>
          )}

          {/* ── Article body ────────────────────────────────────────── */}
          <article
            style={{
              maxWidth: "680px",
              margin: "0 auto",
              padding: hasCover
                ? "56px 24px 96px"
                : "120px 24px 96px",   // extra top padding when no cover (nav height)
            }}
          >
            {/* Page title */}
            {pageData.title && (
              <h1
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: "clamp(32px, 5vw, 44px)",
                  fontWeight: 700,
                  lineHeight: 1.18,
                  letterSpacing: "-0.025em",
                  color: "#111",
                  marginBottom: "0.3em",
                }}
              >
                {pageData.title}
              </h1>
            )}

            {/* Accent line */}
            <div
              style={{
                width: "36px",
                height: "2px",
                background: "#111",
                margin: pageData.title ? "28px 0 44px" : "0 0 44px",
              }}
            />

            {/* Body content */}
            <div>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={mdComponents as never}
              >
                {pageData.content}
              </ReactMarkdown>
            </div>
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
