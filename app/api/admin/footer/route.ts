import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all columns with links
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const columns = await prisma.footerColumn.findMany({
    include: { links: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ success: true, data: columns });
}

// POST create column
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { title } = await req.json();
  const count = await prisma.footerColumn.count();
  const column = await prisma.footerColumn.create({
    data: { title: title || "", order: count },
    include: { links: true },
  });
  return NextResponse.json({ success: true, data: column });
}
