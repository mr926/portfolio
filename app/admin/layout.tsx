"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/projects", label: "Projects", icon: "photo_library" },
  { href: "/admin/categories", label: "Categories", icon: "folder" },
  { href: "/admin/pages", label: "Pages", icon: "article" },
  { href: "/admin/footer", label: "Footer", icon: "dock_to_bottom" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
  { href: "/admin/account", label: "Account", icon: "manage_accounts" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen flex bg-[#f9f9f9]">
      {/* Sidebar */}
      <aside className="w-60 min-h-screen bg-white border-r border-[rgba(198,198,198,0.3)] flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-8 border-b border-[rgba(198,198,198,0.15)]">
          <Link href="/" className="text-base font-extrabold tracking-tighter uppercase text-black hover:opacity-70 transition-opacity">
            CHAOS LAB
          </Link>
          <p className="text-[9px] tracking-[0.2em] uppercase text-[#5e5e5e] mt-1">
            Admin Panel
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[11px] tracking-wider uppercase font-medium transition-all
                  ${isActive
                    ? "bg-black text-white"
                    : "text-[#5e5e5e] hover:text-black hover:bg-[#f3f3f4]"
                  }`}
              >
                <span className="material-symbols-outlined text-sm">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: logout + view site */}
        <div className="px-4 py-6 border-t border-[rgba(198,198,198,0.15)] space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 text-[11px] tracking-wider uppercase font-medium text-[#5e5e5e] hover:text-black hover:bg-[#f3f3f4] transition-all"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            View Site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] tracking-wider uppercase font-medium text-[#5e5e5e] hover:text-black hover:bg-[#f3f3f4] transition-all"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
