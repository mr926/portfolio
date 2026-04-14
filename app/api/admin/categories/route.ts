import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET all categories (admin)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { projects: true } } },
  });

  return NextResponse.json({ success: true, data: categories });
}

// POST create category
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { name, slug, order } = await req.json();

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: { name, slug, order: order ?? 0 },
    });
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }
}
