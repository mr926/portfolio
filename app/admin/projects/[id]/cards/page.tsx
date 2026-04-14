"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";

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
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

type NewCardType = "image" | "text" | "panorama";

export default function CardsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [cards, setCards] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCardType, setNewCardType] = useState<NewCardType>("image");
  const [editCardId, setEditCardId] = useState<string | null>(null);

  // Card form state
  const [cardForm, setCardForm] = useState({
    title: "",
    imageUrl: "",
    imageAlt: "",
    content: "",
    panoramaUrl: "",
    panoramaPreviewUrl: "",
  });
  const [cardSaving, setCardSaving] = useState(false);
  const [cardError, setCardError] = useState("");

  async function fetchData() {
    const [projRes, cardsRes] = await Promise.all([
      fetch(`/api/admin/projects/${projectId}`),
      fetch(`/api/admin/projects/${projectId}/cards`),
    ]);
    const [projData, cardsData] = await Promise.all([
      projRes.json(),
      cardsRes.json(),
    ]);
    if (projData.success) setProject(projData.data);
    if (cardsData.success) setCards(cardsData.data);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [projectId]);

  function openAddForm(type: NewCardType) {
    setNewCardType(type);
    setEditCardId(null);
    setCardError("");
    setCardForm({ title: "", imageUrl: "", imageAlt: "", content: "", panoramaUrl: "", panoramaPreviewUrl: "" });
    setShowAddForm(true);
  }

  function openEditForm(card: ProjectCard) {
    setEditCardId(card.id);
    setNewCardType(card.type);
    setCardError("");
    setCardForm({
      title: card.title || "",
      imageUrl: card.imageUrl || "",
      imageAlt: card.imageAlt || "",
      content: card.content || "",
      panoramaUrl: card.panoramaUrl || "",
      panoramaPreviewUrl: card.panoramaPreviewUrl || "",
    });
    setShowAddForm(true);
  }

  async function handleSaveCard(e: React.FormEvent) {
    e.preventDefault();
    setCardSaving(true);
    setCardError("");

    const payload: Record<string, unknown> = { type: newCardType };
    // title is universal — send for all card types (can be empty/null)
    payload.title = cardForm.title.trim() || null;
    if (newCardType === "image") {
      payload.imageUrl = cardForm.imageUrl;
      payload.imageAlt = cardForm.imageAlt;
    } else if (newCardType === "text") {
      payload.content = cardForm.content;
    } else if (newCardType === "panorama") {
      payload.panoramaUrl = cardForm.panoramaUrl;
      payload.panoramaPreviewUrl = cardForm.panoramaPreviewUrl;
    }

    try {
      let res: Response;
      if (editCardId) {
        res = await fetch(`/api/admin/projects/${projectId}/cards/${editCardId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        payload.order = cards.length;
        res = await fetch(`/api/admin/projects/${projectId}/cards`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setCardError(err.error || "保存失败，请重试");
        return;
      }

      setShowAddForm(false);
      fetchData();
    } catch {
      setCardError("网络错误，请重试");
    } finally {
      setCardSaving(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm("Delete this card?")) return;
    await fetch(`/api/admin/projects/${projectId}/cards/${cardId}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchData();
  }

  // Move card up/down (simple ordering)
  async function moveCard(cardId: string, direction: "up" | "down") {
    const idx = cards.findIndex((c) => c.id === cardId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === cards.length - 1) return;

    const newCards = [...cards];
    const swap = direction === "up" ? idx - 1 : idx + 1;
    [newCards[idx], newCards[swap]] = [newCards[swap], newCards[idx]];

    // Update orders
    const orders = newCards.map((c, i) => ({ id: c.id, order: i }));
    await fetch(`/api/admin/projects/${projectId}/cards`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders }),
    });

    setCards(newCards.map((c, i) => ({ ...c, order: i })));
  }

  const CARD_TYPE_LABELS = {
    image: { label: "Image", icon: "image" },
    text: { label: "Text (Markdown)", icon: "article" },
    panorama: { label: "360° Panorama", icon: "panorama" },
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6] animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12">
      {/* Header */}
      <div className="mb-12">
        <button
          onClick={() => router.push(`/admin/projects/${projectId}`)}
          className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-[#5e5e5e] hover:text-black transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to {project?.name}
        </button>
        <h1 className="text-3xl font-bold tracking-tighter text-black mb-2">
          Content Cards
        </h1>
        <p className="text-sm text-[#5e5e5e]">
          {cards.length} cards — shown in the horizontal detail view
        </p>
      </div>

      {/* Add card buttons */}
      <div className="flex gap-4 mb-12">
        {(["image", "text", "panorama"] as NewCardType[]).map((type) => {
          const info = CARD_TYPE_LABELS[type];
          return (
            <button
              key={type}
              onClick={() => openAddForm(type)}
              className="flex items-center gap-2 border border-[rgba(198,198,198,0.5)] px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:border-black transition-colors"
            >
              <span className="material-symbols-outlined text-sm">{info.icon}</span>
              Add {info.label}
            </button>
          );
        })}
      </div>

      {/* Cards list */}
      {cards.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[#c6c6c6]">
          <p className="text-[10px] tracking-widest uppercase text-[#c6c6c6]">
            No cards yet. Add your first card above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className="bg-white border border-[rgba(198,198,198,0.3)] p-6 flex gap-6 items-start"
            >
              {/* Thumbnail / preview */}
              <div className="w-20 h-24 flex-shrink-0 bg-[#e8e8e8] flex items-center justify-center overflow-hidden relative">
                {card.type === "image" && card.imageUrl ? (
                  <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : card.type === "panorama" && card.panoramaPreviewUrl ? (
                  <>
                    <img
                      src={card.panoramaPreviewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ filter: "blur(1px)" }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xl drop-shadow">360</span>
                    </span>
                  </>
                ) : (
                  <span className="material-symbols-outlined text-2xl text-[#c6c6c6]">
                    {CARD_TYPE_LABELS[card.type].icon}
                  </span>
                )}
              </div>

              {/* Card info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-[#f3f3f4] px-2 py-1 text-[#5e5e5e]">
                    {CARD_TYPE_LABELS[card.type].label}
                  </span>
                  <span className="text-[9px] text-[#c6c6c6]">#{idx + 1}</span>
                </div>

                {card.type === "image" && (
                  <p className="text-[11px] text-[#5e5e5e] truncate">
                    {card.imageUrl || "(no image)"}
                  </p>
                )}
                {card.type === "text" && (
                  <p className="text-[11px] text-[#5e5e5e] line-clamp-2">
                    {card.content?.slice(0, 100) || "(empty)"}
                  </p>
                )}
                {card.type === "panorama" && (
                  <p className="text-[11px] text-[#5e5e5e] truncate">
                    {card.panoramaUrl || "(no URL)"}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => moveCard(card.id, "up")}
                  disabled={idx === 0}
                  className="p-1 text-[#5e5e5e] hover:text-black disabled:opacity-30 transition-colors"
                  title="Move up"
                >
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                </button>
                <button
                  onClick={() => moveCard(card.id, "down")}
                  disabled={idx === cards.length - 1}
                  className="p-1 text-[#5e5e5e] hover:text-black disabled:opacity-30 transition-colors"
                  title="Move down"
                >
                  <span className="material-symbols-outlined text-sm">arrow_downward</span>
                </button>
                <button
                  onClick={() => openEditForm(card)}
                  className="p-1 text-[#5e5e5e] hover:text-black transition-colors"
                  title="Edit"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-1 text-[#5e5e5e] hover:text-[#ba1a1a] transition-colors"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit card modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg p-8 my-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tighter">
                {editCardId ? "Edit" : "Add"} {CARD_TYPE_LABELS[newCardType].label} Card
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-[#5e5e5e] hover:text-black"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-6">
              {newCardType === "image" && (
                <>
                  <ImageUpload
                    label="Image"
                    value={cardForm.imageUrl}
                    onChange={(url) => setCardForm((f) => ({ ...f, imageUrl: url }))}
                    type="image"
                  />
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={cardForm.imageAlt}
                      onChange={(e) => setCardForm((f) => ({ ...f, imageAlt: e.target.value }))}
                      className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors"
                      placeholder="Describe the image"
                    />
                  </div>
                </>
              )}

              {newCardType === "text" && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                      标题 <span className="text-[#c6c6c6] normal-case tracking-normal">（可为空）</span>
                    </label>
                    <input
                      type="text"
                      value={cardForm.title}
                      onChange={(e) => setCardForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm focus:outline-none focus:border-black transition-colors"
                      placeholder="例：项目背景、设计说明…"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                      Content (Markdown)
                    </label>
                    <textarea
                      value={cardForm.content}
                      onChange={(e) => setCardForm((f) => ({ ...f, content: e.target.value }))}
                      rows={12}
                      className="w-full bg-transparent border border-[#c6c6c6] p-4 text-sm font-mono focus:outline-none focus:border-black transition-colors resize-y"
                      placeholder={"Your text here...\n\nSupports **bold**, _italic_, and more."}
                    />
                    <p className="text-[9px] text-[#5e5e5e] mt-1">
                      Markdown supported: # headings, **bold**, _italic_, lists, etc.
                    </p>
                  </div>
                </>
              )}

              {newCardType === "panorama" && (
                <>
                  <ImageUpload
                    label="Panorama Image (equirectangular)"
                    value={cardForm.panoramaUrl}
                    onChange={(url) => setCardForm((f) => ({ ...f, panoramaUrl: url }))}
                    onUploadComplete={(result) => {
                      // Auto-fill the blurred preview URL generated by the server
                      if (result.previewUrl) {
                        setCardForm((f) => ({ ...f, panoramaPreviewUrl: result.previewUrl! }));
                      }
                    }}
                    type="panorama"
                  />
                  {cardForm.panoramaPreviewUrl && (
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-[#5e5e5e] mb-2">
                        Preview (auto-generated)
                      </p>
                      <img
                        src={cardForm.panoramaPreviewUrl}
                        alt="panorama preview"
                        className="w-full h-32 object-cover opacity-80"
                      />
                    </div>
                  )}
                  <p className="text-[9px] text-[#5e5e5e]">
                    Upload an equirectangular panorama image (360° × 180°). A blurred preview will be generated automatically.
                  </p>
                </>
              )}

              {cardError && (
                <p className="text-[#ba1a1a] text-[10px] tracking-widest uppercase pt-2">
                  ⚠ {cardError}
                </p>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={cardSaving}
                  className="flex-1 bg-black text-white py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] disabled:opacity-50 transition-colors"
                >
                  {cardSaving ? "Saving..." : editCardId ? "Update Card" : "Add Card"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="border border-[#c6c6c6] px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:border-black transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
