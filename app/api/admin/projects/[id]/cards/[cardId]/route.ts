import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string; cardId: string }> };

// PUT update a single card
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: projectId, cardId } = await params;
  const data = await req.json();

  const allowedFields = ["type", "order", "title", "imageUrl", "imageAlt", "content", "panoramaUrl", "panoramaPreviewUrl"];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in data) updateData[field] = data[field];
  }

  try {
    const card = await prisma.projectCard.update({
      where: { id: cardId, projectId },
      data: updateData,
    });
    return NextResponse.json({ success: true, data: card });
  } catch {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
}

// DELETE a card
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: projectId, cardId } = await params;

  await prisma.projectCard.delete({ where: { id: cardId, projectId } });
  return NextResponse.json({ success: true });
}
