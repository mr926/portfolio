import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string; metaId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: projectId, metaId } = await params;
  const { key, value, order } = await req.json();

  try {
    const meta = await prisma.projectMeta.update({
      where: { id: metaId, projectId },
      data: { ...(key && { key }), ...(value !== undefined && { value }), ...(order !== undefined && { order }) },
    });
    return NextResponse.json({ success: true, data: meta });
  } catch {
    return NextResponse.json({ error: "Meta not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: projectId, metaId } = await params;
  await prisma.projectMeta.delete({ where: { id: metaId, projectId } });
  return NextResponse.json({ success: true });
}
