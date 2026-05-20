import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-8 bg-[#1a1a1a] text-white md:mt-10">
      <div className="mx-auto max-w-site px-4 py-14 md:px-8">
        {/* Row 1 */}
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="mb-5 text-[14px] font-bold uppercase tracking-[0.1em]">Terms & Conditions</h3>
            <ul className="space-y-3 text-[13px] text-white/85 [&_a:hover]:text-brand">
              <li><Link href="/refund-policy">Refund Policy</Link></li>
              <li><Link href="/terms-and-conditions">Terms and Conditions</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-[14px] font-bold uppercase tracking-[0.1em]">Company Info</h3>
            <ul className="space-y-3 text-[13px] text-white/85 [&_a:hover]:text-brand">
              <li><Link href="/about-us">About Us</Link></li>
              <li><Link href="/contact-us">Contact Us</Link></li>
              <li><Link href="/faq">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-[14px] font-bold uppercase tracking-[0.1em]">Customer Care</h3>
            <ul className="space-y-3 text-[13px] text-white/85 [&_a:hover]:text-brand">
              <li>
                <a href="https://wa.me/6285218265003" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5">
                  <SocialSvg src="/assets/social/whatsapp.svg" size={16} />
                  0852-1826-5003
                </a>
              </li>
              <li>
                <a href="mailto:admin@planyourskin.id" className="flex items-center gap-2.5">
                  <SocialSvg src="/assets/social/envelope.svg" size={16} />
                  admin@planyourskin.id
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Row 2 */}
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="mb-5 text-[14px] font-bold uppercase tracking-[0.1em]">How To Find Us</h3>
            <div className="flex items-center gap-5">
              <SocialIconLink href="https://instagram.com/planyourskin" label="Instagram" src="/assets/social/instagram.svg" />
              <MarketplaceLink href="https://shopee.co.id/planyourskin" label="Shopee" src="/assets/social/shopee.png" />
              <MarketplaceLink href="https://tk.tokopedia.com/ZSxkVH2fX/" label="Tokopedia" src="/assets/social/tokopedia.png" />
              <SocialIconLink href="http://tiktok.com/@planyourskin" label="TikTok" src="/assets/social/tiktok.svg" />
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-[14px] font-bold uppercase tracking-[0.1em]">Operations Hours</h3>
            <p className="text-[13px] leading-relaxed text-white/85">
              MONDAY - FRIDAY
              <br />
              08.00 AM - 16.00 PM
            </p>
          </div>

          <div />
        </div>

        <hr className="my-8 border-white/10" />

        <p className="text-center text-[12px] tracking-wide text-white/60">
          © {new Date().getFullYear()} PT. BRITE LUXE HERBALINDO. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

function SocialSvg({ src, size }: { src: string; size: number }) {
  return (
    <span
      aria-hidden
      className="inline-block"
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

function SocialIconLink({ href, label, src }: { href: string; label: string; src: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-white transition-colors hover:text-brand"
    >
      <SocialSvg src={src} size={22} />
    </a>
  );
}

function MarketplaceLink({ href, label, src }: { href: string; label: string; src: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="opacity-90 transition-opacity hover:opacity-100"
    >
      <Image src={src} alt={label} width={28} height={28} className="h-6 w-auto object-contain" />
    </a>
  );
}
