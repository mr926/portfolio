import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

// Public: GET single project by slug (published only)
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, status: "published" },
    include: {
      category: true,
      cards: { orderBy: { order: "asc" } },
      metas: { orderBy: { order: "asc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: project });
}
