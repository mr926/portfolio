import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET all pages
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  return NextResponse.json({ success: true, data: pages });
}
