import { prisma } from "@/lib/prisma";
import SiteNav from "@/components/layout/SiteNav";
import SiteFooter from "@/components/layout/SiteFooter";
import type { Metadata } from "next";

async function getAboutData() {
  const [page, settings, footerColumns] = await Promise.all([
    prisma.page.findUnique({ where: { slug: "about" } }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.footerColumn.findMany({
      include: { links: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
  ]);
  return { page, settings, footerColumns };
}

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getAboutData();
  return {
    title: page?.title || "About",
  };
}

export default async function AboutPage() {
  const { page, settings, footerColumns } = await getAboutData();

  const siteName = settings?.siteName || "CHAOS LAB";
  const navItems = [
    { label: "Works", href: "/" },
    { label: "About", href: "/about" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav
        siteName={siteName}
        navItems={navItems}
        theme="light"
        logoUrl={settings?.logoUrl || ""}
        logoMode={(settings?.logoMode as "name" | "logo" | "both") || "name"}
      />

      <main className="pt-32 pb-20 flex-1 px-8 md:px-16">
        {/* ── Title + Content ── */}
        <section className="max-w-3xl mb-32">
          {page?.title && (
            <h1 className="text-[3rem] md:text-[3.5rem] font-extrabold leading-[1.1] tracking-tighter mb-12 text-black">
              {page.title}
            </h1>
          )}

          {page?.content && (
            <div
              className="prose-editorial max-w-xl"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          )}
        </section>

      </main>

      <SiteFooter siteName={siteName} columns={footerColumns} />
    </div>
  );
}
