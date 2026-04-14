import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["100", "300", "400", "500", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
      select: { siteName: true, siteTagline: true, faviconUrl: true },
    });
    const siteName = settings?.siteName || "CHAOS LAB";
    const tagline = settings?.siteTagline || "Architecture & Interior Design";
    const icons: Metadata["icons"] = settings?.faviconUrl
      ? { icon: settings.faviconUrl, shortcut: settings.faviconUrl }
      : undefined;
    return {
      title: { default: siteName, template: `%s | ${siteName}` },
      description: tagline,
      ...(icons ? { icons } : {}),
    };
  } catch {
    return {
      title: { default: "CHAOS LAB", template: "%s | CHAOS LAB" },
      description: "Architecture & Interior Design",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
