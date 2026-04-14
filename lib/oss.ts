/**
 * Alibaba Cloud OSS helper
 * Lazily initialised — only creates a client when OSS is enabled and configured.
 */
import OSS from "ali-oss";
import { prisma } from "./prisma";

export interface OssConfig {
  enabled: boolean;
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  /** Base path prefix inside the bucket, e.g. "portfolio/" */
  path: string;
  /** Optional custom CDN domain, e.g. "https://cdn.example.com" */
  customDomain: string;
}

/** Load OSS config from SiteSettings. Returns null if OSS is disabled. */
export async function getOssConfig(): Promise<OssConfig | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
    select: {
      ossEnabled: true,
      ossRegion: true,
      ossBucket: true,
      ossAccessKeyId: true,
      ossAccessKeySecret: true,
      ossPath: true,
      ossCustomDomain: true,
    },
  });

  if (
    !settings?.ossEnabled ||
    !settings.ossRegion ||
    !settings.ossBucket ||
    !settings.ossAccessKeyId ||
    !settings.ossAccessKeySecret
  ) {
    return null;
  }

  return {
    enabled: true,
    region: settings.ossRegion,
    bucket: settings.ossBucket,
    accessKeyId: settings.ossAccessKeyId,
    accessKeySecret: settings.ossAccessKeySecret,
    path: settings.ossPath || "portfolio/",
    customDomain: settings.ossCustomDomain || "",
  };
}

/** Create an OSS client from config. */
export function createOssClient(config: OssConfig): OSS {
  return new OSS({
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
  });
}

/**
 * Upload a Buffer to OSS.
 * @param client  OSS client
 * @param config  OSS config (for URL generation)
 * @param key     Object key inside the bucket (without leading slash), e.g. "portfolio/lg/1234_abc.webp"
 * @param buffer  File content
 * @returns Public URL of the uploaded file
 */
export async function uploadToOss(
  client: OSS,
  config: OssConfig,
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  await client.put(key, buffer, {
    headers: {
      "Content-Type": mimeType,
      // Public read — matches bucket ACL (private write / public read)
      "x-oss-object-acl": "public-read",
    },
  });

  return ossUrl(config, key);
}

/** Build the public URL for an OSS object. */
export function ossUrl(config: OssConfig, key: string): string {
  if (config.customDomain) {
    const base = config.customDomain.replace(/\/$/, "");
    return `${base}/${key}`;
  }
  // Standard OSS URL pattern
  return `https://${config.bucket}.${config.region}.aliyuncs.com/${key}`;
}
