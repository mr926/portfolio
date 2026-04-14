-- Drop OSS columns from SiteSettings
ALTER TABLE "SiteSettings" DROP COLUMN "ossEnabled";
ALTER TABLE "SiteSettings" DROP COLUMN "ossRegion";
ALTER TABLE "SiteSettings" DROP COLUMN "ossBucket";
ALTER TABLE "SiteSettings" DROP COLUMN "ossAccessKeyId";
ALTER TABLE "SiteSettings" DROP COLUMN "ossAccessKeySecret";
ALTER TABLE "SiteSettings" DROP COLUMN "ossPath";
ALTER TABLE "SiteSettings" DROP COLUMN "ossCustomDomain";

-- Add CDN URL column
ALTER TABLE "SiteSettings" ADD COLUMN "cdnUrl" TEXT NOT NULL DEFAULT '';
