import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// PUT /api/admin/account — update username and/or password
export async function PUT(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { currentPassword, newUsername, newPassword } = await req.json();

  if (!currentPassword) {
    return NextResponse.json(
      { error: "请输入当前密码以验证身份" },
      { status: 400 }
    );
  }

  // Load current user
  const user = await prisma.adminUser.findUnique({
    where: { id: auth.payload.userId },
  });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "当前密码不正确" }, { status: 401 });
  }

  const updateData: { username?: string; password?: string } = {};

  if (newUsername && newUsername.trim() && newUsername.trim() !== user.username) {
    // Check uniqueness
    const exists = await prisma.adminUser.findUnique({
      where: { username: newUsername.trim() },
    });
    if (exists) {
      return NextResponse.json({ error: "用户名已被使用" }, { status: 409 });
    }
    updateData.username = newUsername.trim();
  }

  if (newPassword && newPassword.length >= 6) {
    updateData.password = await bcrypt.hash(newPassword, 12);
  } else if (newPassword && newPassword.length < 6) {
    return NextResponse.json(
      { error: "新密码至少需要 6 位字符" },
      { status: 400 }
    );
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "没有需要更新的内容" },
      { status: 400 }
    );
  }

  const updated = await prisma.adminUser.update({
    where: { id: user.id },
    data: updateData,
    select: { id: true, username: true, updatedAt: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
