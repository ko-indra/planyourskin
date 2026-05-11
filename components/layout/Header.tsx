import Image from "next/image";
import Link from "next/link";
import CartIcon from "./CartIcon";
import MobileNav from "./MobileNav";
import AccountIconButton from "./AccountIconButton";

type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

const NAV: NavItem[] = [
  { label: "ABOUT US", href: "/about-us" },
  { label: "PRODUCTS", href: "/shop" },
  { label: "SEASONAL PROMO", href: "/product-category/sale" },
  { label: "SKIN ANALYZER", href: "/skin-analyzer" },
  { label: "FAQ", href: "/faq" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Top announcement bar */}
      <div className="bg-[#222529] text-white">
        <div className="mx-auto max-w-site px-4 py-[7px] text-center text-[13px] font-normal md:px-8">
          Stop ribet! Raih kulit sehat optimal, Plan Your Skin yang #IntinyaAjaCukup.
        </div>
      </div>

      {/* Logo row */}
      <div className="relative">
        <div className="mx-auto flex max-w-site items-center justify-between px-4 py-5 nav:justify-center md:px-8 md:py-6">
          {/* Logo: left on mobile, center on desktop */}
          <Link href="/" aria-label="Plan Your Skin home">
            <Image
              src="/assets/logo.png"
              alt="Plan Your Skin - Intinya Aja Cukup"
              width={398}
              height={80}
              className="h-10 w-auto md:h-14"
              priority
            />
          </Link>

          {/* Right cluster: account + cart (always), hamburger (mobile only) */}
          <div className="flex items-center gap-4 text-[#222529] nav:absolute nav:right-4 nav:top-1/2 nav:gap-5 nav:-translate-y-1/2 md:nav:right-8">
            <AccountIconButton />
            <CartIcon />
            <div className="nav:hidden">
              <MobileNav items={NAV} />
            </div>
          </div>
        </div>

        {/* Desktop nav row */}
        <nav className="hidden border-t border-neutral-100 nav:block">
          <ul className="mx-auto flex max-w-site items-center justify-center gap-8 px-4 text-[12px] font-medium tracking-[0.05em] text-[#222529] md:px-8 xl:gap-12">
            {NAV.map((item) => (
              <li key={item.label} className="group relative">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 py-4 transition-colors hover:text-brand"
                >
                  {item.label}
                  {item.children && <Caret />}
                </Link>
                {item.children && (
                  <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                    <ul className="min-w-[240px] rounded-sm border border-neutral-100 bg-white py-2 shadow-lg">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            className="block px-4 py-2 text-[12px] font-normal normal-case tracking-normal text-[#222529] hover:bg-neutral-50 hover:text-brand"
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function Caret() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" className="opacity-60">
      <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}
