import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: page });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { slug: currentSlug } = await params;
  const { slug: newSlug, title, content, coverImage, showInNav, navOrder } = await req.json();

  // If slug is being changed, check it doesn't conflict
  if (newSlug && newSlug !== currentSlug) {
    if (!/^[a-z0-9-]+$/.test(newSlug)) {
      return NextResponse.json(
        { error: "Slug can only contain lowercase letters, numbers and hyphens" },
        { status: 400 }
      );
    }
    const conflict = await prisma.page.findUnique({ where: { slug: newSlug } });
    if (conflict) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (newSlug !== undefined) updateData.slug = newSlug;
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (coverImage !== undefined) updateData.coverImage = coverImage;
  if (showInNav !== undefined) updateData.showInNav = showInNav;
  if (navOrder !== undefined) updateData.navOrder = navOrder;

  const page = await prisma.page.update({
    where: { slug: currentSlug },
    data: updateData,
  });

  return NextResponse.json({ success: true, data: page });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { slug } = await params;

  try {
    await prisma.page.delete({ where: { slug } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
}
