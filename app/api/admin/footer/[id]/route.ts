import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT update column title / order
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const { title, order } = await req.json();
  const col = await prisma.footerColumn.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(order !== undefined && { order }),
    },
    include: { links: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ success: true, data: col });
}

// DELETE column (cascades links)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  await prisma.footerColumn.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
