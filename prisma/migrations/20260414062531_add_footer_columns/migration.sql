-- CreateTable
CREATE TABLE "FooterColumn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FooterLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "columnId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FooterLink_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "FooterColumn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
