import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOssConfig, createOssClient } from "@/lib/oss";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ossConfig = await getOssConfig();
  if (!ossConfig) {
    return NextResponse.json(
      { success: false, error: "OSS 未配置或未启用，请先填写并保存配置" },
      { status: 400 }
    );
  }

  try {
    const client = createOssClient(ossConfig);
    // Try listing up to 1 object — lightweight connectivity + credential check
    await client.list({ "max-keys": 1 }, {});
    return NextResponse.json({ success: true, bucket: ossConfig.bucket });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg });
  }
}
