"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SiteNavProps {
  siteName: string;
  navItems?: NavItem[];
  theme?: "light" | "dark";
  // Logo
  logoUrl?: string;
  logoMode?: "name" | "logo" | "both";
  // optional category filter (homepage only)
  categories?: Category[];
  activeCategory?: string;
  onCategoryChange?: (slug: string) => void;
}

const DEFAULT_NAV: NavItem[] = [
  { label: "Works", href: "/" },
  { label: "About", href: "/about" },
];

export default function SiteNav({
  siteName,
  navItems = DEFAULT_NAV,
  theme = "light",
  logoUrl,
  logoMode = "name",
  categories,
  activeCategory,
  onCategoryChange,
}: SiteNavProps) {
  const pathname = usePathname();

  const logoColor   = theme === "dark" ? "text-white" : "text-black";
  const textColor   = theme === "dark" ? "text-white" : "text-black";
  const activeColor = theme === "dark" ? "border-white text-white" : "border-black text-black";
  const inactiveColor =
    theme === "dark" ? "text-white/50 hover:text-white" : "text-neutral-400 hover:text-black";
  const dividerColor =
    theme === "dark" ? "bg-white/20" : "bg-neutral-200";
  const bgClass =
    theme === "dark" ? "bg-black/0" : "bg-white/80 backdrop-blur-xl";

  const hasCats = categories && categories.length > 0 && onCategoryChange;

  return (
    <nav
      className={`fixed top-0 w-full z-50 flex justify-between items-center px-8 md:px-16 py-6 ${bgClass}`}
    >
      {/* Logo area */}
      <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity flex-shrink-0">
        {(logoMode === "logo" || logoMode === "both") && logoUrl && (
          <img src={logoUrl} alt={siteName} className="h-7 w-auto object-contain" />
        )}
        {(logoMode === "name" || logoMode === "both") && (
          <span className={`text-lg font-extrabold tracking-tighter uppercase ${logoColor}`}>
            {siteName}
          </span>
        )}
      </Link>

      {/* Desktop right side: page nav + optional category filters */}
      <div className={`hidden md:flex items-center gap-8 ${textColor}`}>

        {/* Category filters */}
        {hasCats && (
          <>
            <button
              onClick={() => onCategoryChange("all")}
              className={`font-sans tracking-widest uppercase text-[10px] font-bold transition-all duration-300 ${
                activeCategory === "all"
                  ? `border-b pb-0.5 ${activeColor}`
                  : inactiveColor
              }`}
            >
              All
            </button>
            {categories!.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.slug)}
                className={`font-sans tracking-widest uppercase text-[10px] font-medium transition-all duration-300 ${
                  activeCategory === cat.slug
                    ? `border-b pb-0.5 ${activeColor}`
                    : inactiveColor
                }`}
              >
                {cat.name}
              </button>
            ))}
            {/* Divider */}
            <span className={`w-px h-3 ${dividerColor}`} />
          </>
        )}

        {/* Page nav links */}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`font-sans tracking-widest uppercase text-[10px] font-bold transition-all duration-300 ${
                isActive ? `border-b pb-0.5 ${activeColor}` : inactiveColor
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Mobile hamburger */}
      <button className={`md:hidden ${textColor}`} aria-label="Menu">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </nav>
  );
}
