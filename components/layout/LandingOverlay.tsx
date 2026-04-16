"use client";

import { useEffect, useRef } from "react";

interface LandingOverlayProps {
  bgDesktop: string;
  bgMobile: string;
  siteName: string;
  tagline: string;
  stayMs: number;
  animMs: number;
  hideMin: number;
  logoUrl?: string;        // 导航栏 logo（fallback）
  landingLogoUrl?: string; // landing 专用 logo（优先）
  logoMode?: "name" | "logo" | "both";
  onComplete: () => void;
}

const LANDING_KEY = "chaoslab_landing_ts";

export default function LandingOverlay({
  bgDesktop,
  bgMobile,
  siteName,
  tagline,
  stayMs,
  animMs,
  hideMin,
  logoUrl,
  landingLogoUrl,
  logoMode = "name",
  onComplete,
}: LandingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef   = useRef<HTMLDivElement>(null);  // position wrapper
  const innerRef  = useRef<HTMLDivElement>(null);  // scale wrapper

  useEffect(() => {
    const lastTs = parseInt(localStorage.getItem(LANDING_KEY) || "0", 10);
    const elapsed = Date.now() - lastTs;
    const hideMs  = hideMin * 60 * 1000;

    if (elapsed < hideMs) {
      onComplete();
      return;
    }

    const stayTimer = setTimeout(() => {
      const logo    = logoRef.current;
      const inner   = innerRef.current;
      const overlay = overlayRef.current;
      if (!logo || !inner || !overlay) return;

      // ── 1. Snapshot current pixel position ─────────────────────
      const rect = logo.getBoundingClientRect();

      // Switch from % to px (no transition yet)
      logo.style.transition = "none";
      logo.style.top        = `${rect.top}px`;
      logo.style.left       = `${rect.left}px`;
      logo.style.transform  = "none";

      // Force reflow so the above is applied before we add transition
      logo.getBoundingClientRect();

      // ── 2. Calculate target ─────────────────────────────────────
      // Nav: px-8 (32px) or md:px-16 (64px), py-6 (24px)
      const navLeft = window.innerWidth >= 768 ? 64 : 32;
      const navTop  = 24;

      // Scale: inner div starts at a large size, nav size is the target
      // Text nav: text-lg = 1.125rem ≈ 18px
      // Image nav: h-7 = 28px
      // We'll use CSS scale on the inner element
      // Big text: text-6xl = 3.75rem = 60px → scale ≈ 18/60 = 0.30
      // Big image: h-24 = 96px → scale ≈ 28/96 ≈ 0.29
      // Use 0.30 as a reasonable approximation for both
      const navScale = 0.30;

      // ── 3. Start all animations simultaneously ──────────────────
      const ease = `cubic-bezier(0.4, 0, 0.2, 1)`;

      logo.style.transition = `top ${animMs}ms ${ease}, left ${animMs}ms ${ease}`;
      logo.style.top        = `${navTop}px`;
      logo.style.left       = `${navLeft}px`;

      inner.style.transition      = `transform ${animMs}ms ${ease}, opacity ${animMs}ms ease`;
      inner.style.transformOrigin = "top left";
      inner.style.transform       = `scale(${navScale})`;
      inner.style.opacity         = "0";   // fade out as it shrinks

      overlay.style.transition    = `opacity ${animMs}ms ease`;
      overlay.style.opacity       = "0";

      // ── 4. Done ─────────────────────────────────────────────────
      setTimeout(() => {
        localStorage.setItem(LANDING_KEY, String(Date.now()));
        onComplete();
      }, animMs);
    }, stayMs);

    return () => clearTimeout(stayTimer);
  }, [stayMs, animMs, hideMin, onComplete]);

  const defaultBg = "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #0a0a0a 100%)";
  // landing 专用 logo 优先，没有则 fallback 到导航栏 logo
  const effectiveLogoUrl = landingLogoUrl || logoUrl;
  const showImage = (logoMode === "logo" || logoMode === "both") && effectiveLogoUrl;
  const showName  = logoMode === "name" || logoMode === "both";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ willChange: "opacity" }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        {bgDesktop ? (
          <>
            <img src={bgDesktop} alt="" className="hidden md:block absolute inset-0 w-full h-full object-cover" />
            <img src={bgMobile || bgDesktop} alt="" className="md:hidden absolute inset-0 w-full h-full object-cover" />
          </>
        ) : (
          <div className="w-full h-full" style={{ background: defaultBg }} />
        )}
        <div className="absolute inset-0 overlay-gradient" />
      </div>

      {/* ── Logo position wrapper — starts centered ─────────────── */}
      <div
        ref={logoRef}
        className="absolute"
        style={{
          top:       "50%",
          left:      "50%",
          transform: "translate(-50%, -50%)",
          zIndex:    10,
        }}
      >
        {/* ── Inner scale wrapper ─────────────────────────────── */}
        <div
          ref={innerRef}
          className="flex items-center gap-3 select-none"
          style={{ willChange: "transform, opacity" }}
        >
          {showImage && (
            <img
              src={effectiveLogoUrl!}
              alt={siteName}
              className="h-24 w-auto object-contain"
              draggable={false}
            />
          )}
          {showName && (
            <span className="text-white font-extrabold tracking-tighter uppercase text-6xl whitespace-nowrap">
              {siteName}
            </span>
          )}
        </div>

        {/* Tagline — only shown at full size, fades with inner */}
        {tagline && (
          <p
            className="text-white/50 text-[10px] tracking-[0.3em] uppercase mt-4 text-center select-none"
            style={{ willChange: "opacity" }}
          >
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}
