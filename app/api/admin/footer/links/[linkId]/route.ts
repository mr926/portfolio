import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT update link
export async function PUT(req: NextRequest, { params }: { params: Promise<{ linkId: string }> }) {
  const auth = requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { linkId } = await params;
  const { label, url } = await req.json();
  const link = await prisma.footerLink.update({
    where: { id: linkId },
    data: {
      ...(label !== undefined && { label }),
      ...(url !== undefined && { url }),
    },
  });
  return NextResponse.json({ success: true, data: link });
}

// DELETE link
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ linkId: string }> }) {
  const auth = requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { linkId } = await params;
  await prisma.footerLink.delete({ where: { id: linkId } });
  return NextResponse.json({ success: true });
}
