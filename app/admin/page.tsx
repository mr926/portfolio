import Link from "next/link";

export default function AdminDashboard() {
  const cards = [
    {
      href: "/admin/projects",
      title: "Projects",
      desc: "Manage all portfolio projects",
      icon: "photo_library",
    },
    {
      href: "/admin/categories",
      title: "Categories",
      desc: "Organize project categories",
      icon: "folder",
    },
    {
      href: "/admin/pages",
      title: "Pages",
      desc: "Edit About & static pages",
      icon: "article",
    },
    {
      href: "/admin/settings",
      title: "Settings",
      desc: "Site-wide configuration",
      icon: "settings",
    },
  ];

  return (
    <div className="p-8 md:p-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tighter text-black mb-2">
          Dashboard
        </h1>
        <p className="text-sm text-[#5e5e5e]">
          Welcome to the CHAOS LAB admin panel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group p-8 bg-white border border-[rgba(198,198,198,0.3)] hover:border-black transition-all duration-300 flex flex-col gap-4"
          >
            <span className="material-symbols-outlined text-3xl text-[#c6c6c6] group-hover:text-black transition-colors">
              {card.icon}
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-black mb-1">
                {card.title}
              </h2>
              <p className="text-[11px] text-[#5e5e5e] tracking-wide">
                {card.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
