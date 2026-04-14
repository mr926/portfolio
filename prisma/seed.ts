/**
 * seed.ts — 初始化数据库示例数据
 */

import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const adapter = new PrismaLibSql({
  url: `file:${path.join(process.cwd(), "dev.db")}`,
});
// @ts-ignore
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // AdminUser
  const passwordHash = await bcrypt.hash("chaos2024", 12);
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: passwordHash },
  });
  console.log("✅ Admin user created (username: admin, password: chaos2024)");

  // SiteSettings
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteName: "CHAOS LAB",
      siteTagline: "Architecture & Interior Design",
      landingEnabled: true,
      landingBgDesktop: "",
      landingBgMobile: "",
      landingStayMs: 1000,
      landingAnimMs: 1000,
      instagram: "https://instagram.com/chaoslab",
      linkedin: "",
      email: "studio@chaoslab.com",
      location: "Shanghai, China",
    },
  });
  console.log("✅ Site settings created");

  // Categories
  const archCat = await prisma.category.upsert({
    where: { slug: "architecture" },
    update: {},
    create: { name: "建筑", slug: "architecture", order: 0 },
  });
  const interiorCat = await prisma.category.upsert({
    where: { slug: "interior" },
    update: {},
    create: { name: "室内", slug: "interior", order: 1 },
  });
  await prisma.category.upsert({
    where: { slug: "landscape" },
    update: {},
    create: { name: "景观", slug: "landscape", order: 2 },
  });
  await prisma.category.upsert({
    where: { slug: "unbuilt" },
    update: {},
    create: { name: "概念", slug: "unbuilt", order: 3 },
  });
  console.log("✅ Categories created");

  // Projects
  const project1 = await prisma.project.upsert({
    where: { slug: "the-silent-refuge" },
    update: {},
    create: {
      name: "寂静避居",
      subtitle: "The Silent Refuge",
      slug: "the-silent-refuge",
      categoryId: archCat.id,
      coverImage: "",
      status: "published",
      isPinned: true,
      order: 0,
    },
  });

  await prisma.project.upsert({
    where: { slug: "obsidian-house" },
    update: {},
    create: {
      name: "黑曜石居所",
      subtitle: "The Obsidian House",
      slug: "obsidian-house",
      categoryId: archCat.id,
      coverImage: "",
      status: "published",
      isPinned: false,
      order: 1,
    },
  });

  await prisma.project.upsert({
    where: { slug: "vellum-gallery" },
    update: {},
    create: {
      name: "羊皮纸画廊",
      subtitle: "Vellum Gallery",
      slug: "vellum-gallery",
      categoryId: interiorCat.id,
      coverImage: "",
      status: "published",
      isPinned: false,
      order: 2,
    },
  });
  console.log("✅ Projects created");

  // ProjectMeta for project1
  const existingMetas = await prisma.projectMeta.findMany({ where: { projectId: project1.id } });
  if (existingMetas.length === 0) {
    await prisma.projectMeta.createMany({
      data: [
        { projectId: project1.id, key: "Year", value: "2023", order: 0 },
        { projectId: project1.id, key: "Client", value: "Private Estate", order: 1 },
        { projectId: project1.id, key: "Typology", value: "Residential", order: 2 },
        { projectId: project1.id, key: "Size", value: "450 m2", order: 3 },
        { projectId: project1.id, key: "Status", value: "Completed", order: 4 },
        { projectId: project1.id, key: "Location", value: "Kyoto, Japan", order: 5 },
      ],
    });
  }

  // ProjectCards for project1
  const existingCards = await prisma.projectCard.findMany({ where: { projectId: project1.id } });
  if (existingCards.length === 0) {
    await prisma.projectCard.createMany({
      data: [
        { projectId: project1.id, type: "image", order: 0, imageUrl: "", imageAlt: "Aerial view" },
        {
          projectId: project1.id,
          type: "text",
          order: 1,
          content: "# Design Concept\n\nThrough a series of concrete voids, the project explores the relationship between monastic minimalism and residential comfort.\n\nThe masterplan prioritizes the restoration of the undulating terrain, where the structure intentionally blends into the landscape's natural contours.",
        },
        { projectId: project1.id, type: "image", order: 2, imageUrl: "", imageAlt: "Interior hall" },
      ],
    });
  }
  console.log("✅ Cards and metas created");

  // About page
  await prisma.page.upsert({
    where: { slug: "about" },
    update: {},
    create: {
      slug: "about",
      title: "",
      content: "",
    },
  });
  console.log("✅ About page created");

  console.log("\n🎉 Seed completed!");
  console.log("   Admin login: admin / chaos2024");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
