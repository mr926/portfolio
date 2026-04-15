import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns pages with showInNav=true for the navigation bar
export async function GET() {
  const pages = await prisma.page.findMany({
    where: { showInNav: true },
    orderBy: [{ navOrder: "asc" }, { title: "asc" }],
    select: { slug: true, title: true, navOrder: true },
  });

  return NextResponse.json({ success: true, data: pages });
}
