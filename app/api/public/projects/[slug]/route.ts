import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCdn } from "@/lib/cdn";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const [project, settings] = await Promise.all([
    prisma.project.findFirst({
      where: { slug, status: "published" },
      include: {
        category: true,
        cards: { orderBy: { order: "asc" } },
        metas: { orderBy: { order: "asc" } },
      },
    }),
    prisma.siteSettings.findUnique({
      where: { id: "singleton" },
      select: { cdnUrl: true },
    }),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const cdnBase = settings?.cdnUrl || "";

  // Apply CDN to all image fields in project and its cards
  const data = {
    ...project,
    coverImage: withCdn(project.coverImage, cdnBase),
    cards: project.cards.map((card) => ({
      ...card,
      imageUrl: card.imageUrl ? withCdn(card.imageUrl, cdnBase) : card.imageUrl,
      panoramaUrl: card.panoramaUrl ? withCdn(card.panoramaUrl, cdnBase) : card.panoramaUrl,
      panoramaPreviewUrl: card.panoramaPreviewUrl
        ? withCdn(card.panoramaPreviewUrl, cdnBase)
        : card.panoramaPreviewUrl,
    })),
  };

  return NextResponse.json({ success: true, data });
}
