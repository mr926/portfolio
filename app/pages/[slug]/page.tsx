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
}

interface NavPage { slug: string; title: string; }

interface SiteSettings {
  siteName: string;
  logoUrl: string;
  logoMode: "name" | "logo" | "both";
}

/* ── Medium-style markdown component map ──────────────────────────── */
const mdComponents = {
  h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] mt-14 mb-5 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-[26px] font-bold tracking-tight text-[#1a1a1a] mt-12 mb-4 leading-snug">
      {children}
    </h2>
  ),
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl font-semibold text-[#1a1a1a] mt-10 mb-3 leading-snug">
      {children}
    </h3>
  ),
  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-[18px] leading-[1.85] text-[#292929] mb-6">
      {children}
    </p>
  ),
  a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="text-[#1a1a1a] underline underline-offset-3 decoration-[#c6c6c6] hover:decoration-black transition-colors"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote className="border-l-[3px] border-[#1a1a1a] pl-6 py-1 my-8 text-[#6b6b6b] italic text-[18px] leading-[1.8]">
      {children}
    </blockquote>
  ),
  ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside pl-6 mb-6 space-y-2 text-[18px] leading-[1.8] text-[#292929]">
      {children}
    </ul>
  ),
  ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-outside pl-6 mb-6 space-y-2 text-[18px] leading-[1.8] text-[#292929]">
      {children}
    </ol>
  ),
  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1">{children}</li>
  ),
  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
    inline ? (
      <code className="bg-[#f2f2f2] text-[#c7254e] text-[0.88em] px-1.5 py-0.5 rounded font-mono">
        {children}
      </code>
    ) : (
      <code className="block bg-[#f6f8fa] border border-[#e8e8e8] rounded p-4 text-sm font-mono leading-relaxed overflow-x-auto whitespace-pre mb-6 text-[#292929]">
        {children}
      </code>
    ),
  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="mb-6">{children}</pre>
  ),
  img: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <span className="block my-10">
      <img
        src={src}
        alt={alt || ""}
        className="w-full h-auto rounded-sm"
        loading="lazy"
      />
      {alt && (
        <span className="block text-center text-[13px] text-[#9b9b9b] mt-3 italic">
          {alt}
        </span>
      )}
    </span>
  ),
  hr: () => (
    <hr className="border-none text-center my-14 before:content-['···'] before:text-[#c6c6c6] before:text-2xl before:tracking-[0.5em]" />
  ),
  strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-[#1a1a1a]">{children}</strong>
  ),
  em: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic">{children}</em>
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteNav
        siteName={siteName}
        navItems={navItems}
        logoUrl={settings?.logoUrl}
        logoMode={settings?.logoMode}
      />

      {pageData ? (
        <main className="flex-1 w-full px-6">
          {/* Article container — Medium-style centered column */}
          <article className="max-w-[720px] mx-auto pt-32 pb-28">

            {/* Title */}
            {pageData.title && (
              <h1 className="text-[40px] md:text-[48px] font-bold tracking-tight text-[#1a1a1a] leading-[1.15] mb-10">
                {pageData.title}
              </h1>
            )}

            {/* Divider */}
            <div className="w-10 h-[2px] bg-[#1a1a1a] mb-12" />

            {/* Body */}
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
