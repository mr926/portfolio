import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getOssConfig, createOssClient, uploadToOss } from "@/lib/oss";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

async function ensureUploadDirs() {
  await mkdir(path.join(UPLOAD_DIR, "original"), { recursive: true });
  await mkdir(path.join(UPLOAD_DIR, "lg"), { recursive: true });
  await mkdir(path.join(UPLOAD_DIR, "md"), { recursive: true });
  await mkdir(path.join(UPLOAD_DIR, "thumb"), { recursive: true });
  await mkdir(path.join(UPLOAD_DIR, "panorama-preview"), { recursive: true });
}

// ─── Local helpers ───────────────────────────────────────────────────────────

async function saveLocal(
  buffer: Buffer,
  relPath: string // e.g. "lg/1234_abc.webp"
): Promise<string> {
  const fullPath = path.join(UPLOAD_DIR, relPath);
  await writeFile(fullPath, buffer);
  return `/uploads/${relPath}`;
}

// ─── Panorama preview ────────────────────────────────────────────────────────

async function buildPanoramaPreviewBuffer(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 4096;
  const h = meta.height ?? 2048;

  return sharp(buffer)
    .extract({
      left: Math.floor(w * 0.33),
      top: Math.floor(h * 0.25),
      width: Math.floor(w * 0.34),
      height: Math.floor(h * 0.5),
    })
    .resize(1200, undefined, { withoutEnlargement: true, fit: "inside" })
    .blur(8)
    .webp({ quality: 80 })
    .toBuffer();
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "image";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 413 });
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const baseName = `${timestamp}_${random}`;

    // Check OSS config once
    const ossConfig = await getOssConfig();
    const useOss = !!ossConfig;
    const ossClient = useOss ? createOssClient(ossConfig!) : null;
    const ossBase = ossConfig?.path ?? "portfolio/";

    // Helper — stores one buffer and returns its public URL
    async function store(
      buf: Buffer,
      relPath: string, // local-style path like "lg/1234_abc.webp"
      mime: string
    ): Promise<string> {
      if (useOss && ossClient) {
        const key = `${ossBase}${relPath}`;
        return uploadToOss(ossClient, ossConfig!, key, buf, mime);
      }
      await ensureUploadDirs();
      return saveLocal(buf, relPath);
    }

    const urls: Record<string, string> = {};

    // ── Original ──
    const origBuffer = buffer;
    const origMime = file.type;
    urls.original = await store(origBuffer, `original/${baseName}.${ext}`, origMime);

    if (type === "panorama") {
      urls.lg = urls.original;
      urls.md = urls.original;
      urls.thumb = urls.original;

      try {
        const previewBuf = await buildPanoramaPreviewBuffer(buffer);
        urls.preview = await store(previewBuf, `panorama-preview/${baseName}.webp`, "image/webp");
      } catch (e) {
        console.warn("Panorama preview generation failed:", e);
        urls.preview = "";
      }
    } else if (file.type !== "image/gif") {
      // WebP variants
      const variants: Array<{ size: string; width: number }> = [
        { size: "lg", width: 1920 },
        { size: "md", width: 1200 },
        { size: "thumb", width: 400 },
      ];
      for (const { size, width } of variants) {
        const varBuf = await sharp(buffer)
          .resize(width, undefined, { withoutEnlargement: true, fit: "inside" })
          .webp({ quality: 85 })
          .toBuffer();
        urls[size] = await store(varBuf, `${size}/${baseName}.webp`, "image/webp");
      }
    } else {
      // GIF — no transcoding
      urls.lg = urls.original;
      urls.md = urls.original;
      urls.thumb = urls.original;
    }

    return NextResponse.json({
      success: true,
      data: {
        url: urls.lg || urls.original,
        urls,
        filename: `${baseName}.${ext}`,
        originalName: file.name,
        size: file.size,
        type: file.type,
        previewUrl: urls.preview || null,
        storage: useOss ? "oss" : "local",
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", detail: String(error) },
      { status: 500 }
    );
  }
}
