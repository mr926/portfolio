-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "siteName" TEXT NOT NULL DEFAULT 'CHAOS LAB',
    "siteTagline" TEXT NOT NULL DEFAULT '',
    "landingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "landingBgDesktop" TEXT NOT NULL DEFAULT '',
    "landingBgMobile" TEXT NOT NULL DEFAULT '',
    "landingStayMs" INTEGER NOT NULL DEFAULT 1000,
    "landingAnimMs" INTEGER NOT NULL DEFAULT 1000,
    "instagram" TEXT NOT NULL DEFAULT '',
    "linkedin" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "ossEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ossRegion" TEXT NOT NULL DEFAULT '',
    "ossBucket" TEXT NOT NULL DEFAULT '',
    "ossAccessKeyId" TEXT NOT NULL DEFAULT '',
    "ossAccessKeySecret" TEXT NOT NULL DEFAULT '',
    "ossPath" TEXT NOT NULL DEFAULT 'portfolio/',
    "ossCustomDomain" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "logoMode" TEXT NOT NULL DEFAULT 'name',
    "faviconUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("email", "id", "instagram", "landingAnimMs", "landingBgDesktop", "landingBgMobile", "landingEnabled", "landingStayMs", "linkedin", "location", "ossAccessKeyId", "ossAccessKeySecret", "ossBucket", "ossCustomDomain", "ossEnabled", "ossPath", "ossRegion", "siteName", "siteTagline", "updatedAt") SELECT "email", "id", "instagram", "landingAnimMs", "landingBgDesktop", "landingBgMobile", "landingEnabled", "landingStayMs", "linkedin", "location", "ossAccessKeyId", "ossAccessKeySecret", "ossBucket", "ossCustomDomain", "ossEnabled", "ossPath", "ossRegion", "siteName", "siteTagline", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
