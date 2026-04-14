"use client";

import { useState } from "react";

const INPUT_CLS =
  "w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors";
const LABEL_CLS =
  "block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2";
const LEGEND_CLS =
  "text-[10px] uppercase tracking-widest text-[#5e5e5e] border-b border-[rgba(198,198,198,0.3)] pb-2 w-full";

export default function AdminAccountPage() {
  const [form, setForm] = useState({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (!form.currentPassword) {
      setError("请输入当前密码");
      return;
    }
    if (!form.newUsername && !form.newPassword) {
      setError("请填写新用户名或新密码中的至少一项");
      return;
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newUsername: form.newUsername || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
      } else {
        setSaved(true);
        setForm({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setSaved(false), 4000);
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 md:p-12 max-w-lg">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tighter text-black mb-2">
          Account
        </h1>
        <p className="text-sm text-[#5e5e5e]">Manage your admin credentials</p>
      </div>

      <form onSubmit={handleSave} className="space-y-12">
        {/* ── Verify identity ── */}
        <fieldset className="space-y-6">
          <legend className={LEGEND_CLS}>Verify Identity</legend>
          <div>
            <label className={LABEL_CLS}>Current Password</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => update("currentPassword", e.target.value)}
              className={INPUT_CLS}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </fieldset>

        {/* ── New credentials ── */}
        <fieldset className="space-y-6">
          <legend className={LEGEND_CLS}>New Credentials</legend>
          <div>
            <label className={LABEL_CLS}>
              New Username{" "}
              <span className="normal-case tracking-normal text-[#c6c6c6]">
                (leave blank to keep current)
              </span>
            </label>
            <input
              type="text"
              value={form.newUsername}
              onChange={(e) => update("newUsername", e.target.value)}
              className={INPUT_CLS}
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>
              New Password{" "}
              <span className="normal-case tracking-normal text-[#c6c6c6]">
                (leave blank to keep current, min 6 chars)
              </span>
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => update("newPassword", e.target.value)}
              className={INPUT_CLS}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Confirm New Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              className={INPUT_CLS}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
        </fieldset>

        {error && (
          <p className="text-[#ba1a1a] text-[10px] tracking-widest uppercase">
            {error}
          </p>
        )}
        {saved && (
          <p className="text-green-600 text-[10px] tracking-widest uppercase">
            ✓ Account updated — please log in again if you changed your username
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
