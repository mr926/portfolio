import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET all pages
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pages = await prisma.page.findMany({ orderBy: [{ navOrder: "asc" }, { slug: "asc" }] });
  return NextResponse.json({ success: true, data: pages });
}

// POST — create new page
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { slug, title, subtitle, content, coverImage, showInNav, navOrder } = await req.json();

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug is required and can only contain lowercase letters, numbers and hyphens" },
      { status: 400 }
    );
  }

  const existing = await prisma.page.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A page with this slug already exists" }, { status: 409 });
  }

  const page = await prisma.page.create({
    data: {
      slug,
      title: title ?? "",
      subtitle: subtitle ?? "",
      content: content ?? "",
      coverImage: coverImage ?? "",
      showInNav: showInNav ?? false,
      navOrder: navOrder ?? 0,
    },
  });

  return NextResponse.json({ success: true, data: page }, { status: 201 });
}
