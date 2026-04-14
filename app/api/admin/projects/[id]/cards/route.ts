import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET all cards for a project
export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: projectId } = await params;

  const cards = await prisma.projectCard.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ success: true, data: cards });
}

// POST create card
export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: projectId } = await params;
  const { type, order, title, imageUrl, imageAlt, content, panoramaUrl, panoramaPreviewUrl } = await req.json();

  if (!type || !["image", "text", "panorama"].includes(type)) {
    return NextResponse.json(
      { error: "type must be image | text | panorama" },
      { status: 400 }
    );
  }

  const card = await prisma.projectCard.create({
    data: {
      projectId,
      type,
      order: order ?? 0,
      title: title ?? null,
      imageUrl: imageUrl ?? null,
      imageAlt: imageAlt ?? "",
      content: content ?? null,
      panoramaUrl: panoramaUrl ?? null,
      panoramaPreviewUrl: panoramaPreviewUrl ?? null,
    },
  });

  return NextResponse.json({ success: true, data: card }, { status: 201 });
}

// PUT bulk reorder cards
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: projectId } = await params;
  const { orders } = await req.json(); // [{ id, order }]

  if (!Array.isArray(orders)) {
    return NextResponse.json({ error: "orders must be an array" }, { status: 400 });
  }

  await prisma.$transaction(
    orders.map(({ id, order }: { id: string; order: number }) =>
      prisma.projectCard.update({
        where: { id, projectId },
        data: { order },
      })
    )
  );

  return NextResponse.json({ success: true });
}
