import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });

  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "singleton" } });
  }

  return NextResponse.json({ success: true, data: settings });
}
