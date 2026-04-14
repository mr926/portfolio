"use client";

import { useEffect, useRef } from "react";

// Dynamically load Pannellum (browser-only)
declare global {
  interface Window {
    pannellum: {
      viewer: (container: string | HTMLElement, config: object) => unknown;
    };
  }
}

interface PanoramaViewerProps {
  url: string;
  onClose: () => void;
}

export default function PanoramaViewer({ url, onClose }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<unknown>(null);

  useEffect(() => {
    // Lock scroll
    document.body.style.overflow = "hidden";

    // Load Pannellum if not already loaded
    const loadPannellum = async () => {
      if (!window.pannellum) {
        // Dynamically inject script and CSS
        await new Promise<void>((resolve) => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
          document.head.appendChild(link);

          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      if (containerRef.current && window.pannellum && url) {
        viewerRef.current = window.pannellum.viewer(containerRef.current, {
          type: "equirectangular",
          panorama: url,
          autoLoad: true,
          autoRotate: -2,
          showControls: true,
          showZoomCtrl: true,
          showFullscreenCtrl: false,
          compass: false,
          hfov: 100,
        });
      }
    };

    loadPannellum();

    return () => {
      document.body.style.overflow = "";
    };
  }, [url]);

  // Keyboard close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-5 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        {/* Back label */}
        <span className="text-white/50 text-[10px] tracking-[0.2em] uppercase">
          360° Panorama
        </span>
        {/* Close button */}
        <button
          onClick={onClose}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 border border-white/30 text-white hover:bg-white hover:text-black transition-all duration-200 text-[10px] tracking-widest uppercase"
          aria-label="Close panorama"
        >
          <span className="material-symbols-outlined text-base leading-none">arrow_back</span>
          <span>Back to Project</span>
        </button>
      </div>

      {/* Panorama container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        id="panorama-container"
      />

      {!url && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/30 text-[10px] tracking-widest uppercase">
            No panorama URL configured
          </p>
        </div>
      )}
    </div>
  );
}
