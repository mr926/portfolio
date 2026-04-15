import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "singleton" } });
  }

  return NextResponse.json({ success: true, data: settings });
}

export async function PUT(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const data = await req.json();
  const allowedFields = [
    "siteName", "siteTagline", "landingEnabled",
    "landingBgDesktop", "landingBgMobile",
    "landingStayMs", "landingAnimMs", "landingHideMin",
    "instagram", "linkedin", "email", "location",
    // CDN
    "cdnUrl",
    // Logo & Favicon
    "logoUrl", "logoMode", "faviconUrl",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in data) updateData[field] = data[field];
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: updateData,
    create: { id: "singleton", ...updateData },
  });

  return NextResponse.json({ success: true, data: settings });
}
