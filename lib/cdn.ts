/**
 * CDN URL helper
 * Prepends the CDN base URL to local /uploads/ paths.
 * If no CDN is configured, or the path is already absolute, returns as-is.
 */
export function withCdn(path: string, cdnBase: string): string {
  if (!path) return path;
  if (!cdnBase) return path;
  // Already an absolute URL — don't double-prefix
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = cdnBase.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
