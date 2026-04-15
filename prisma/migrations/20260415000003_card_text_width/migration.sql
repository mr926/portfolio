-- Add textWidth column to ProjectCard
ALTER TABLE "ProjectCard" ADD COLUMN "textWidth" TEXT NOT NULL DEFAULT 'narrow';
