import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET single project with all relations
export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
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

// PUT update project
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const data = await req.json();

  const allowedFields = [
    "name", "subtitle", "slug", "categoryId", "coverImage",
    "status", "isPinned", "order",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in data) updateData[field] = data[field];
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
    return NextResponse.json({ success: true, data: project });
  } catch {
    return NextResponse.json({ error: "Project not found or slug conflict" }, { status: 404 });
  }
}

// DELETE project
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
