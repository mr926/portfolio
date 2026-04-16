"use client";

import { useState, useRef } from "react";

interface UploadResult {
  url: string;
  urls: Record<string, string>;
  previewUrl?: string | null;
}

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  /** Called with the full upload result (includes previewUrl for panoramas) */
  onUploadComplete?: (result: UploadResult) => void;
  type?: "image" | "panorama" | "cover" | "bg";
  label?: string;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onUploadComplete,
  type = "image",
  label = "Image",
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        onChange(data.data.url);
        onUploadComplete?.(data.data);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Network error during upload");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className={className}>
      <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-2">
        {label}
      </label>

      {/* Upload zone — shows preview when image exists */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="relative border border-dashed border-[#c6c6c6] cursor-pointer hover:border-black transition-colors overflow-hidden group"
        style={{ minHeight: "80px" }}
      >
        {value ? (
          /* Image preview fills the zone */
          <>
            <img
              src={value}
              alt=""
              className="w-full object-cover"
              style={{ maxHeight: "160px" }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <span className="material-symbols-outlined text-white text-2xl">
                {uploading ? "hourglass_empty" : "cloud_upload"}
              </span>
              <p className="text-[10px] tracking-widest uppercase text-white">
                {uploading ? "Uploading..." : "Replace image"}
              </p>
            </div>
            {/* Clear button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute top-2 right-2 bg-black text-white w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              ×
            </button>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-2 p-6">
            {uploading ? (
              <p className="text-[10px] tracking-widest uppercase text-[#5e5e5e] animate-pulse">
                Uploading...
              </p>
            ) : (
              <>
                <span className="material-symbols-outlined text-2xl text-[#c6c6c6]">
                  cloud_upload
                </span>
                <p className="text-[10px] tracking-widest uppercase text-[#5e5e5e]">
                  Click or drag to upload
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* URL input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://... 或 /uploads/..."
        className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm text-black focus:outline-none focus:border-black transition-colors mt-2"
      />

      {error && (
        <p className="text-[#ba1a1a] text-[10px] tracking-widest uppercase mt-2">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
