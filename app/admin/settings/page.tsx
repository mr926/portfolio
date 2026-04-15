"use client";

import { useState, useEffect } from "react";
import ImageUpload from "@/components/admin/ImageUpload";

interface SiteSettings {
  id: string;
  siteName: string;
  siteTagline: string;
  landingEnabled: boolean;
  landingBgDesktop: string;
  landingBgMobile: string;
  landingStayMs: number;
  landingAnimMs: number;
  instagram: string;
  linkedin: string;
  email: string;
  location: string;
  // CDN
  cdnUrl: string;
  // Logo & Favicon
  logoUrl: string;
  logoMode: string;
  faviconUrl: string;
  // Landing hide duration
  landingHideMin: number;
}

const INPUT_CLS =
  "w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors";
const LABEL_CLS = "block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2";
const LEGEND_CLS =
  "text-[10px] uppercase tracking-widest text-[#5e5e5e] border-b border-[rgba(198,198,198,0.3)] pb-2 w-full";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSettings(data.data);
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || "Save failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  if (loading || !settings) {
    return (
      <div className="p-8">
        <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6] animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-2xl">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tighter text-black mb-2">
          Site Settings
        </h1>
        <p className="text-sm text-[#5e5e5e]">Global configuration for your portfolio</p>
      </div>

      <form onSubmit={handleSave} className="space-y-12">
        {/* ── Basic Info ── */}
        <fieldset className="space-y-6">
          <legend className={LEGEND_CLS}>Basic Info</legend>

          <div>
            <label className={LABEL_CLS}>Site Name</label>
            <input type="text" value={settings.siteName} onChange={(e) => update("siteName", e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Tagline</label>
            <input type="text" value={settings.siteTagline} onChange={(e) => update("siteTagline", e.target.value)} className={INPUT_CLS} placeholder="Architecture & Interior Design" />
          </div>
          <div>
            <label className={LABEL_CLS}>Location</label>
            <input type="text" value={settings.location} onChange={(e) => update("location", e.target.value)} className={INPUT_CLS} placeholder="Shanghai, China" />
          </div>
          <div>
            <label className={LABEL_CLS}>Email</label>
            <input type="email" value={settings.email} onChange={(e) => update("email", e.target.value)} className={INPUT_CLS} placeholder="studio@chaoslab.com" />
          </div>
        </fieldset>

        {/* ── CDN ── */}
        <fieldset className="space-y-6">
          <legend className={LEGEND_CLS}>CDN 加速</legend>
          <div>
            <label className={LABEL_CLS}>CDN 域名</label>
            <input
              type="url"
              value={settings.cdnUrl}
              onChange={(e) => update("cdnUrl", e.target.value)}
              className={INPUT_CLS}
              placeholder="https://cdn.example.com"
            />
            <p className="text-[9px] text-[#c6c6c6] mt-2 leading-relaxed">
              填写后，所有图片链接自动替换为 CDN 地址（例如 /uploads/xxx.jpg → https://cdn.example.com/uploads/xxx.jpg）。<br />
              回源地址请配置为本服务器的域名或 IP。留空则使用本地路径。
            </p>
          </div>
        </fieldset>

        {/* ── Logo & Favicon ── */}
        <fieldset className="space-y-6">
          <legend className={LEGEND_CLS}>Logo &amp; Favicon</legend>

          <div>
            <label className={LABEL_CLS}>导航栏显示模式</label>
            <div className="flex flex-col gap-3 mt-1">
              {[
                { value: "name", label: "仅显示网站名称" },
                { value: "logo", label: "仅显示 Logo 图片" },
                { value: "both", label: "Logo + 网站名称" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="logoMode"
                    value={opt.value}
                    checked={settings.logoMode === opt.value}
                    onChange={() => update("logoMode", opt.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-[11px] uppercase tracking-widest text-[#5e5e5e]">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {(settings.logoMode === "logo" || settings.logoMode === "both") && (
            <div>
              <ImageUpload
                label="Logo 图片（建议透明背景 PNG，高度 40px 左右）"
                value={settings.logoUrl}
                onChange={(url) => update("logoUrl", url)}
                type="bg"
              />
              {settings.logoUrl && (
                <div className="mt-3 p-4 bg-[#f3f3f4] inline-flex items-center">
                  <img src={settings.logoUrl} alt="Logo preview" className="h-8 object-contain" />
                </div>
              )}
            </div>
          )}

          <div>
            <ImageUpload
              label="Favicon（建议 32×32 或 64×64 PNG / ICO）"
              value={settings.faviconUrl}
              onChange={(url) => update("faviconUrl", url)}
              type="bg"
            />
            {settings.faviconUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img src={settings.faviconUrl} alt="Favicon preview" className="w-8 h-8 object-contain border border-[#e8e8e8]" />
                <span className="text-[9px] text-[#c6c6c6] tracking-widest">保存后刷新页面生效</span>
              </div>
            )}
          </div>
        </fieldset>

        {/* ── Social ── */}
        <fieldset className="space-y-6">
          <legend className={LEGEND_CLS}>Social Links</legend>
          <div>
            <label className={LABEL_CLS}>Instagram URL</label>
            <input type="url" value={settings.instagram} onChange={(e) => update("instagram", e.target.value)} className={INPUT_CLS} placeholder="https://instagram.com/chaoslab" />
          </div>
          <div>
            <label className={LABEL_CLS}>LinkedIn URL</label>
            <input type="url" value={settings.linkedin} onChange={(e) => update("linkedin", e.target.value)} className={INPUT_CLS} placeholder="https://linkedin.com/company/..." />
          </div>
        </fieldset>

        {/* ── Landing ── */}
        <fieldset className="space-y-6">
          <legend className={LEGEND_CLS}>Landing Animation</legend>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="landingEnabled" checked={settings.landingEnabled} onChange={(e) => update("landingEnabled", e.target.checked)} className="w-4 h-4" />
            <label htmlFor="landingEnabled" className="text-[10px] uppercase tracking-widest text-[#5e5e5e]">
              Enable landing screen
            </label>
          </div>
          <div>
            <label className={LABEL_CLS}>显示间隔（分钟）</label>
            <input
              type="number"
              value={settings.landingHideMin}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                update("landingHideMin", isNaN(v) ? 1 : Math.max(0, v));
              }}
              className={INPUT_CLS}
              min="0"
              step="1"
            />
            <p className="text-[9px] text-[#c6c6c6] mt-2">
              Landing 显示一次后，间隔多少分钟再次显示。设为 0 则每次打开首页都显示。默认 1440（24 小时）。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={LABEL_CLS}>Stay Duration (ms)</label>
              <input type="number" value={settings.landingStayMs} onChange={(e) => update("landingStayMs", parseInt(e.target.value) || 1000)} className={INPUT_CLS} min="500" step="100" />
            </div>
            <div>
              <label className={LABEL_CLS}>Animation Duration (ms)</label>
              <input type="number" value={settings.landingAnimMs} onChange={(e) => update("landingAnimMs", parseInt(e.target.value) || 1000)} className={INPUT_CLS} min="300" step="100" />
            </div>
          </div>
          <ImageUpload label="Desktop Background Image" value={settings.landingBgDesktop} onChange={(url) => update("landingBgDesktop", url)} type="bg" />
          <ImageUpload label="Mobile Background Image (optional)" value={settings.landingBgMobile} onChange={(url) => update("landingBgMobile", url)} type="bg" />
        </fieldset>

        {error && <p className="text-[#ba1a1a] text-[10px] tracking-widest uppercase">{error}</p>}
        {saved && <p className="text-green-600 text-[10px] tracking-widest uppercase">✓ Settings saved</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
