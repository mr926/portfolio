import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { projects: { some: { status: "published" } } },
    orderBy: { order: "asc" },
    include: { _count: { select: { projects: { where: { status: "published" } } } } },
  });

  return NextResponse.json({ success: true, data: categories });
}
