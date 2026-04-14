import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST add link to column
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: columnId } = await params;
  const { label, url } = await req.json();
  const count = await prisma.footerLink.count({ where: { columnId } });
  const link = await prisma.footerLink.create({
    data: { columnId, label: label || "", url: url || "", order: count },
  });
  return NextResponse.json({ success: true, data: link });
}
