import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET metas
export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: projectId } = await params;
  const metas = await prisma.projectMeta.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ success: true, data: metas });
}

// POST create meta
export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: projectId } = await params;
  const { key, value, order } = await req.json();

  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  const meta = await prisma.projectMeta.create({
    data: { projectId, key, value: value ?? "", order: order ?? 0 },
  });

  return NextResponse.json({ success: true, data: meta }, { status: 201 });
}

// PUT bulk update/reorder metas
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: projectId } = await params;
  const { metas } = await req.json(); // [{id, key, value, order}]

  if (!Array.isArray(metas)) {
    return NextResponse.json({ error: "metas must be an array" }, { status: 400 });
  }

  await prisma.$transaction(
    metas.map(({ id, key, value, order }: { id: string; key: string; value: string; order: number }) =>
      prisma.projectMeta.update({
        where: { id, projectId },
        data: { key, value, order },
      })
    )
  );

  return NextResponse.json({ success: true });
}
