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

  const { slug } = await params;
  const { title, content } = await req.json();

  const page = await prisma.page.upsert({
    where: { slug },
    update: { ...(title !== undefined && { title }), ...(content !== undefined && { content }) },
    create: { slug, title: title ?? "", content: content ?? "" },
  });

  return NextResponse.json({ success: true, data: page });
}
