import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const columns = await prisma.footerColumn.findMany({
    include: { links: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ success: true, data: columns });
}
