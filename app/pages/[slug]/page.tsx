"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
    { label: "About", href: "/about" },
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
    <div className="min-h-screen flex flex-col">
      <SiteNav
        siteName={siteName}
        navItems={navItems}
        logoUrl={settings?.logoUrl}
        logoMode={settings?.logoMode}
      />

      <main className="flex-1 pt-32 pb-24 px-8 md:px-16 max-w-4xl mx-auto w-full">
        {pageData ? (
          <>
            {pageData.title && (
              <h1 className="text-4xl font-bold tracking-tighter text-black mb-12 uppercase">
                {pageData.title}
              </h1>
            )}
            <div
              className="prose prose-sm max-w-none text-[#3b3b3b] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: pageData.content }}
            />
          </>
        ) : (
          <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6] animate-pulse">
            Loading...
          </p>
        )}
      </main>

      <SiteFooter siteName={siteName} />
    </div>
  );
}
