"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PanoramaViewer from "@/components/panorama/PanoramaViewer";

interface ProjectMeta {
  id: string;
  key: string;
  value: string;
  order: number;
}

interface ProjectCard {
  id: string;
  type: "image" | "text" | "panorama";
  order: number;
  title?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  content?: string | null;
  panoramaUrl?: string | null;
  panoramaPreviewUrl?: string | null;
  textWidth?: string | null;
}

interface Project {
  id: string;
  name: string;
  subtitle: string;
  slug: string;
  category: { name: string; slug: string };
  coverImage: string;
  metas: ProjectMeta[];
  cards: ProjectCard[];
}

interface ProjectDetailPanelProps {
  slug: string;
  siteName: string;
  onClose: () => void;
}

type DimMap = Record<string, { w: number; h: number }>;

const CARD_GAP = 40;
const TEXT_CARD_W_NARROW = 520;
const TEXT_CARD_W_WIDE   = Math.round(520 * 1.6); // 832
const PANORAMA_CARD_W = 700;

export default function ProjectDetailPanel({
  slug,
  siteName,
  onClose,
}: ProjectDetailPanelProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCard, setCurrentCard] = useState(0);
  const [panoramaUrl, setPanoramaUrl] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [dims, setDims] = useState<DimMap>({});
  // 首次定位完成前禁用 transition，避免从左边滑入的闪烁
  const [canTransition, setCanTransition] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  // Cursor DOM refs — bypasses React re-render entirely on mousemove
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorIconRef = useRef<HTMLSpanElement>(null);
  const cursorActionRef = useRef<"prev" | "next" | "close" | null>(null);

  // Fetch project
  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/projects/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const proj = data.data;
          setProject(proj);
          setCurrentCard(0);

          // 预加载第一张图尺寸，确保定位正确后再开启 transition
          const firstCard = proj.cards?.[0];
          const src = firstCard?.type === "image" ? firstCard.imageUrl : null;
          const enableTransition = () =>
            requestAnimationFrame(() => requestAnimationFrame(() => setCanTransition(true)));

          if (src) {
            const img = new Image();
            img.onload = () => {
              setDims((prev) => ({ ...prev, [src]: { w: img.naturalWidth, h: img.naturalHeight } }));
              enableTransition();
            };
            img.onerror = enableTransition;
            img.src = src;
          } else {
            enableTransition();
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  // Update document title when project loads; restore on unmount
  useEffect(() => {
    if (!project) return;
    const prev = document.title;
    document.title = `${project.name} | ${siteName}`;
    return () => { document.title = prev; };
  }, [project, siteName]);

  // Pre-load image dimensions
  useEffect(() => {
    if (!project) return;
    project.cards.forEach((card) => {
      const src = card.type === "image" ? card.imageUrl : card.panoramaPreviewUrl;
      if (!src || dims[src]) return;
      const img = new Image();
      img.onload = () =>
        setDims((prev) => ({ ...prev, [src]: { w: img.naturalWidth, h: img.naturalHeight } }));
      img.src = src;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 500);
  }, [onClose]);

  const cards = project?.cards ?? [];
  const totalCards = cards.length;

  const goNext = useCallback(() => setCurrentCard((c) => Math.min(c + 1, totalCards - 1)), [totalCards]);
  const goPrev = useCallback(() => setCurrentCard((c) => Math.max(c - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose, goNext, goPrev]);

  // ─── Card widths — memoised, only recalc when dims or cards change ────────
  const cardWidths = useMemo(() => {
    const viewH = typeof window !== "undefined" ? window.innerHeight : 900;
    const viewW = typeof window !== "undefined" ? window.innerWidth : 1440;
    return cards.map((card) => {
      if (card.type === "text") {
        return card.textWidth === "wide" ? TEXT_CARD_W_WIDE : TEXT_CARD_W_NARROW;
      }
      if (card.type === "panorama") return PANORAMA_CARD_W;
      const d = dims[card.imageUrl || ""];
      if (d && d.h > 0) {
        return Math.max(viewW * 0.25, Math.min(viewW * 0.88, viewH * (d.w / d.h)));
      }
      return viewH * (4 / 3);
    });
  }, [cards, dims]);

  // ─── translateX — memoised ────────────────────────────────────────────────
  const translateX = useMemo(() => {
    const viewW = typeof window !== "undefined" ? window.innerWidth : 1440;
    let leftEdge = 0;
    for (let i = 0; i < currentCard; i++) leftEdge += (cardWidths[i] ?? 0) + CARD_GAP;
    const activeW = cardWidths[currentCard] ?? 0;
    return leftEdge + activeW / 2 - viewW / 2;
  }, [cardWidths, currentCard]);

  // ─── Custom cursor — pure DOM, zero React re-renders on mousemove ─────────
  const handleSliderMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;

    let action: "prev" | "next" | "close" | null = null;
    if (pct < 0.25) action = currentCard === 0 ? "close" : "prev";
    else if (pct > 0.75) action = currentCard === totalCards - 1 ? "close" : "next";

    if (cursorRef.current) {
      cursorRef.current.style.left = `${e.clientX}px`;
      cursorRef.current.style.top = `${e.clientY}px`;
      cursorRef.current.style.opacity = action ? "1" : "0";
    }
    if (action !== cursorActionRef.current) {
      cursorActionRef.current = action;
      if (cursorIconRef.current) {
        cursorIconRef.current.textContent =
          action === "close" ? "close" :
          action === "prev"  ? "arrow_back" :
          action === "next"  ? "arrow_forward" : "arrow_forward";
      }
    }
    if (sliderRef.current) {
      sliderRef.current.style.cursor = action ? "none" : "default";
    }
  }, [currentCard, totalCards]);

  const handleSliderMouseLeave = useCallback(() => {
    if (cursorRef.current) cursorRef.current.style.opacity = "0";
    if (sliderRef.current) sliderRef.current.style.cursor = "default";
    cursorActionRef.current = null;
  }, []);

  const handleSliderClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (pct < 0.25) {
      if (currentCard === 0) handleClose();
      else goPrev();
    } else if (pct > 0.75) {
      if (currentCard === totalCards - 1) handleClose();
      else goNext();
    }
  }, [currentCard, totalCards, handleClose, goNext, goPrev]);

  const filledMetas = project?.metas.filter((m) => m.value.trim()) ?? [];

  return (
    <>
      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col
          ${isClosing ? "slide-out-right" : "slide-in-right"}`}
        style={{ willChange: "transform" }}
      >
        {/* ── DESKTOP ──────────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col h-full">

          {/* Top bar */}
          <div className="flex items-center justify-end px-8 py-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-[11px] tracking-widest uppercase text-white/30 hover:text-white/80 transition-colors"
              aria-label="Close project"
            >
              <span className="material-symbols-outlined text-base">close</span>
              <span>Close</span>
            </button>
          </div>

          {/* Card strip */}
          {!loading && project && (
            <div
              ref={sliderRef}
              className="flex-1 relative overflow-hidden"
              onMouseMove={handleSliderMouseMove}
              onMouseLeave={handleSliderMouseLeave}
              onClick={handleSliderClick}
            >
              <div
                className="absolute top-0 left-0 h-full flex items-stretch"
                style={{
                  gap: CARD_GAP,
                  transform: `translateX(${-translateX}px)`,
                  transition: canTransition ? "transform 0.55s cubic-bezier(0.65, 0, 0.35, 1)" : "none",
                  willChange: "transform",
                }}
              >
                {cards.map((card, i) => {
                  const w = cardWidths[i] ?? TEXT_CARD_W_NARROW;

                  if (card.type === "image") {
                    return (
                      <div key={card.id} className="flex-none h-full" style={{ width: w }}>
                        {card.imageUrl ? (
                          <img
                            src={card.imageUrl}
                            alt={card.imageAlt || ""}
                            className="w-full h-full object-contain"
                            draggable={false}
                            style={{ userSelect: "none" }}
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <span className="text-white/20 text-[10px] tracking-widest uppercase">No Image</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (card.type === "text") {
                    return (
                      <div
                        key={card.id}
                        className="flex-none h-full flex flex-col justify-center px-16 bg-white/5 overflow-y-auto no-scrollbar"
                        style={{ width: w }}
                      >
                        {card.title && (
                          <span className="text-[9px] uppercase tracking-widest text-white/30 block mb-8">
                            {card.title}
                          </span>
                        )}
                        <div className="prose-editorial prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.content || ""}</ReactMarkdown>
                        </div>
                      </div>
                    );
                  }

                  if (card.type === "panorama") {
                    return (
                      <div key={card.id} className="flex-none h-full relative overflow-hidden" style={{ width: w }}>
                        {card.panoramaPreviewUrl ? (
                          <>
                            <img
                              src={card.panoramaPreviewUrl}
                              alt="360° panorama"
                              className="w-full h-full object-cover scale-105 pointer-events-none"
                              draggable={false}
                              style={{ filter: "blur(3px)", userSelect: "none" }}
                            />
                            <div className="absolute inset-0 bg-black/55 pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-white/5 pointer-events-none" />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                          <span className="material-symbols-outlined text-white/50 text-5xl">360</span>
                          <p className="text-white/30 text-[9px] tracking-[0.3em] uppercase">360° Panorama</p>
                          <button
                            className="pointer-events-auto mt-2 flex items-center gap-2 border border-white/30 px-5 py-2.5 text-[9px] font-bold tracking-widest uppercase text-white/70 hover:bg-white hover:text-black hover:border-white transition-all"
                            onClick={(e) => { e.stopPropagation(); setPanoramaUrl(card.panoramaUrl || ""); }}
                          >
                            <span className="material-symbols-outlined text-sm">open_in_full</span>
                            进入全景
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>

              {/* Custom cursor — positioned via direct DOM writes, no setState */}
              <div
                ref={cursorRef}
                className="fixed pointer-events-none z-[200]"
                style={{ opacity: 0, transform: "translate(-50%, -50%)", transition: "opacity 0.12s" }}
              >
                <span
                  ref={cursorIconRef}
                  className="material-symbols-outlined text-white drop-shadow-lg select-none"
                  style={{ fontSize: 36, opacity: 0.75 }}
                >
                  arrow_forward
                </span>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[9px] tracking-widest uppercase text-white/20 animate-pulse">Loading...</p>
            </div>
          )}

          {/* Bottom bar */}
          {!loading && project && (
            <div className="flex items-end gap-8 px-8 py-5 flex-shrink-0">
              {/* Left */}
              <div className="flex-1 min-w-0">
                <span className="text-[8px] tracking-[0.25em] uppercase text-white/25 block mb-1">
                  {siteName} · {project.category?.name}
                </span>
                <h1 className="text-lg font-extrabold tracking-tighter text-white uppercase leading-none truncate">
                  {project.name}
                </h1>
                {project.subtitle && (
                  <p className="text-[9px] text-white/30 tracking-[0.15em] uppercase mt-0.5 truncate">
                    {project.subtitle}
                  </p>
                )}
              </div>
              {/* Center: dots */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                {cards.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentCard(i); }}
                    className={`transition-all duration-300 ${
                      i === currentCard
                        ? "w-6 h-[2px] bg-white"
                        : "w-2 h-[2px] bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`Card ${i + 1}`}
                  />
                ))}
                <span className="text-[8px] tracking-widest text-white/20 uppercase ml-2">
                  {currentCard + 1} / {totalCards}
                </span>
              </div>
              {/* Right: metas */}
              {filledMetas.length > 0 && (
                <div className="flex items-end gap-8 flex-shrink-0">
                  {filledMetas.map((meta) => (
                    <div key={meta.id}>
                      <span className="text-[8px] uppercase tracking-widest text-white/20 block mb-0.5">{meta.key}</span>
                      <span className="text-[10px] font-bold uppercase text-white/55">{meta.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── MOBILE ───────────────────────────────────────────────────── */}
        <div className="md:hidden flex flex-col h-full bg-white overflow-y-auto no-scrollbar">
          <button
            onClick={handleClose}
            className="fixed top-4 right-5 z-[110] flex items-center gap-1 text-[9px] tracking-widest uppercase text-black/40 hover:text-black transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>

          {!loading && project && (
            <>
              <div className="px-6 pt-16 pb-8 border-b border-black/5">
                <span className="text-[9px] tracking-widest uppercase text-[#5e5e5e] block mb-2">{project.category?.name}</span>
                <h1 className="text-3xl font-bold tracking-tighter text-black uppercase leading-none mb-2">{project.name}</h1>
                {project.subtitle && (
                  <p className="text-[9px] text-[#5e5e5e] tracking-widest uppercase">{project.subtitle}</p>
                )}
              </div>

              {project.cards.map((card) => (
                <div key={card.id}>
                  {card.type === "image" && (
                    <div className="w-full">
                      {card.imageUrl
                        ? <img src={card.imageUrl} alt={card.imageAlt || ""} className="w-full h-auto" />
                        : <div className="w-full aspect-[4/3] bg-[#e8e8e8]" />}
                    </div>
                  )}
                  {card.type === "text" && (
                    <div className="px-6 py-10 bg-[#f3f3f4]">
                      <div className="prose-editorial">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.content || ""}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  {card.type === "panorama" && (
                    <div
                      className="w-full relative overflow-hidden"
                      style={{ aspectRatio: "16/9" }}
                      onClick={() => setPanoramaUrl(card.panoramaUrl || "")}
                    >
                      {card.panoramaPreviewUrl ? (
                        <>
                          <img src={card.panoramaPreviewUrl} alt="360°" className="w-full h-full object-cover scale-105" style={{ filter: "blur(3px)" }} />
                          <div className="absolute inset-0 bg-black/50" />
                        </>
                      ) : <div className="w-full h-full bg-neutral-900" />}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-white text-4xl">360</span>
                        <p className="text-white/60 text-[9px] tracking-widest uppercase">View 360°</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filledMetas.length > 0 && (
                <div className="px-6 py-10 bg-[#f9f9f9] border-t border-black/5">
                  <div className="grid grid-cols-2 gap-6">
                    {filledMetas.map((meta) => (
                      <div key={meta.id}>
                        <span className="text-[8px] uppercase tracking-widest text-neutral-400 block mb-1">{meta.key}</span>
                        <span className="text-[10px] font-bold uppercase">{meta.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-6 py-8 border-t border-black/5">
                <p className="text-[8px] tracking-widest text-neutral-300 uppercase">© {siteName}. All rights reserved.</p>
              </div>
            </>
          )}
        </div>
      </div>

      {panoramaUrl !== null && (
        <PanoramaViewer url={panoramaUrl} onClose={() => setPanoramaUrl(null)} />
      )}
    </>
  );
}
