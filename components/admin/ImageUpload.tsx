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

      {/* Current image preview */}
      {value && (
        <div className="mb-3 relative group">
          <img
            src={value}
            alt=""
            className="h-32 w-full object-cover bg-[#e8e8e8]"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-black text-white w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      )}

      {/* URL input — type="text" to allow relative paths like /uploads/... */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://... 或 /uploads/... 或直接上传"
        className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm text-black focus:outline-none focus:border-black transition-colors mb-3"
      />

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-[#c6c6c6] p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-black transition-colors"
      >
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
