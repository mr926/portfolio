import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET all projects (admin, includes all statuses)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");

  const projects = await prisma.project.findMany({
    where: {
      ...(categoryId && { categoryId }),
      ...(status && { status }),
    },
    include: {
      category: true,
      _count: { select: { cards: true, metas: true } },
    },
    orderBy: [{ isPinned: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ success: true, data: projects });
}

const DEFAULT_META_KEYS = ["Year", "Client", "Typology", "Size", "Status", "Location"];

// POST create project
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { name, subtitle, slug, categoryId, coverImage, status, isPinned, order } =
    await req.json();

  if (!name || !slug || !categoryId) {
    return NextResponse.json(
      { error: "name, slug, categoryId are required" },
      { status: 400 }
    );
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        subtitle: subtitle ?? "",
        slug,
        categoryId,
        coverImage: coverImage ?? "",
        status: status ?? "draft",
        isPinned: isPinned ?? false,
        order: order ?? 0,
        // Auto-create default meta fields
        metas: {
          create: DEFAULT_META_KEYS.map((key, i) => ({
            key,
            value: "",
            order: i,
          })),
        },
      },
      include: { category: true },
    });
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }
}
