import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: GET published projects (with optional category filter)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "100");
  const page = parseInt(searchParams.get("page") || "1");

  const where = {
    status: "published" as const,
    ...(categorySlug && categorySlug !== "all"
      ? { category: { slug: categorySlug } }
      : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        category: true,
        metas: { where: { key: "Year" }, select: { value: true } },
      },
      orderBy: [{ isPinned: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.project.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items: projects,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
