"use client";

import Image from "next/image";

interface ProjectCardProps {
  id: string;
  name: string;
  subtitle: string;
  categoryName: string;
  coverImage: string;
  slug: string;
  isPinned: boolean;
  onClick: (slug: string) => void;
}

export default function ProjectCard({
  name,
  subtitle,
  categoryName,
  coverImage,
  slug,
  onClick,
}: ProjectCardProps) {
  return (
    <article
      className="group cursor-pointer"
      onClick={() => onClick(slug)}
    >
      {/* Image container — aspect 4:5 exactly as Stitch */}
      <div className="aspect-[4/5] overflow-hidden bg-[#e2e2e2] mb-6 transition-all duration-500 group-hover:opacity-90">
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#e8e8e8]">
            <span className="text-[#c6c6c6] text-[10px] tracking-widest uppercase">
              No Image
            </span>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] tracking-widest uppercase text-[#5e5e5e] font-medium mb-2 block">
            {categoryName}
          </span>
          <h3 className="text-xl font-bold tracking-tight text-black">
            {name}
          </h3>
          {subtitle && (
            <p className="text-[10px] tracking-widest text-[#5e5e5e] mt-1 uppercase">
              {subtitle}
            </p>
          )}
        </div>
        <span className="material-symbols-outlined text-black text-lg opacity-0 group-hover:opacity-100 transition-opacity mt-1">
          north_east
        </span>
      </div>
    </article>
  );
}
