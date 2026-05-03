import Link from "next/link";

type Crumb = { label: string; href?: string };

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className="mx-auto max-w-site px-4 md:px-[21px]">
      <nav
        aria-label="Breadcrumb"
        className="border-b border-neutral-200 py-4 text-[12px] uppercase tracking-[0.05em] text-[#222529]"
      >
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" aria-label="Home" className="inline-flex items-center hover:text-brand">
              <HomeIcon />
            </Link>
          </li>
          {items.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-[#aaa]">›</span>
              {c.href ? (
                <Link href={c.href} className="hover:text-brand">{c.label}</Link>
              ) : (
                <span className="font-medium">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3z" />
    </svg>
  );
}
