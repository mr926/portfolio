interface FooterLink {
  id: string;
  label: string;
  url: string;
}

interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

interface SiteFooterProps {
  siteName: string;
  columns?: FooterColumn[];
}

export default function SiteFooter({ siteName, columns = [] }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[rgba(198,198,198,0.15)] bg-[#f3f3f4] grid grid-cols-1 md:grid-cols-4 gap-12 px-8 md:px-16 py-20">
      {/* Col 1: fixed copyright */}
      <div className="col-span-1">
        <div className="text-sm font-bold text-black mb-6 uppercase tracking-tighter">
          {siteName}
        </div>
        <p className="text-xs leading-relaxed tracking-tight text-neutral-500">
          © {year} {siteName}. ALL RIGHTS RESERVED.
        </p>
      </div>

      {/* Dynamic columns */}
      {columns.map((col) => (
        <div key={col.id}>
          {col.title && (
            <h4 className="font-bold text-[10px] tracking-widest uppercase text-black mb-6">
              {col.title}
            </h4>
          )}
          <div className="flex flex-col gap-3">
            {col.links.map((link) =>
              link.url ? (
                <a
                  key={link.id}
                  href={link.url}
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-xs leading-relaxed tracking-tight text-neutral-500 hover:text-black transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <span key={link.id} className="text-xs leading-relaxed tracking-tight text-neutral-500">
                  {link.label}
                </span>
              )
            )}
          </div>
        </div>
      ))}
    </footer>
  );
}
