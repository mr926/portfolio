"use client";

import { useEffect, useRef } from "react";

interface LandingOverlayProps {
  bgDesktop: string;
  bgMobile: string;
  siteName: string;
  tagline: string;
  stayMs: number;
  animMs: number;
  onComplete: () => void;
}

const LANDING_KEY = "chaoslab_landing_shown";

export default function LandingOverlay({
  bgDesktop,
  bgMobile,
  siteName,
  tagline,
  stayMs,
  animMs,
  onComplete,
}: LandingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if already shown today
    const lastShown = localStorage.getItem(LANDING_KEY);
    const today = new Date().toDateString();

    if (lastShown === today) {
      // Skip landing immediately
      onComplete();
      return;
    }

    // Show landing, then animate after stayMs
    const stayTimer = setTimeout(() => {
      // Phase 1: Logo moves to top-left (animMs)
      if (logoRef.current) {
        logoRef.current.style.transition = `all ${animMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        logoRef.current.style.transform = "translate(0, 0) scale(0.5)";
        logoRef.current.style.top = "40px";
        logoRef.current.style.left = "32px";
        logoRef.current.style.fontSize = "1.25rem";
      }

      // Phase 2: Slide up overlay
      setTimeout(() => {
        if (overlayRef.current) {
          overlayRef.current.style.transition = `transform ${animMs}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${animMs}ms ease`;
          overlayRef.current.style.transform = "translateY(-100%)";
          overlayRef.current.style.opacity = "0";
        }

        // Done
        setTimeout(() => {
          localStorage.setItem(LANDING_KEY, today);
          onComplete();
        }, animMs);
      }, animMs * 0.6);
    }, stayMs);

    return () => clearTimeout(stayTimer);
  }, [stayMs, animMs, onComplete]);

  const defaultBg =
    "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #0a0a0a 100%)";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ willChange: "transform, opacity" }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        {bgDesktop ? (
          <>
            {/* Desktop background */}
            <img
              src={bgDesktop}
              alt=""
              className="hidden md:block w-full h-full object-cover"
            />
            {/* Mobile background */}
            <img
              src={bgMobile || bgDesktop}
              alt=""
              className="md:hidden w-full h-full object-cover"
            />
          </>
        ) : (
          <div className="w-full h-full" style={{ background: defaultBg }} />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 overlay-gradient" />
      </div>

      {/* Logo — centered initially, will animate to corner */}
      <div
        ref={logoRef}
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          willChange: "transform, top, left, font-size",
        }}
      >
        <h1 className="text-white font-extrabold tracking-tighter uppercase text-4xl md:text-6xl select-none">
          {siteName}
        </h1>
        {tagline && (
          <p className="text-white/60 text-[10px] tracking-[0.3em] uppercase mt-2 text-center">
            {tagline}
          </p>
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <p className="text-white/30 text-[9px] tracking-[0.3em] uppercase">
          Architecture & Interior Design
        </p>
      </div>
    </div>
  );
}
