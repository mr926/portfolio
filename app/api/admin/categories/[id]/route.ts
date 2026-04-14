import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PUT update category
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { name, slug, order } = await req.json();

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { ...(name && { name }), ...(slug && { slug }), ...(order !== undefined && { order }) },
    });
    return NextResponse.json({ success: true, data: category });
  } catch {
    return NextResponse.json({ error: "Category not found or slug conflict" }, { status: 404 });
  }
}

// DELETE category
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  // Check if category has projects
  const count = await prisma.project.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: category has ${count} project(s)` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
