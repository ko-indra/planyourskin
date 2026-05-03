import Breadcrumb from "@/components/layout/Breadcrumb";

export const metadata = { title: "Contact Us | PlanYourSkin" };

export default function ContactPage() {
  return (
    <>
    <Breadcrumb items={[{ label: "Contact Us" }]} />
    <article className="mx-auto max-w-site px-4 py-10 md:px-8 md:py-16">
      <h1 className="mb-4 text-center font-medium text-[#222529] text-3xl md:text-5xl">Contact Us</h1>
      <p className="mb-12 text-center text-[15px] text-[#777]">
        Punya pertanyaan atau butuh bantuan? Tim kami siap membantu.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <ContactCard title="WhatsApp" detail="0852-1826-5003" href="https://wa.me/6285218265003">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </ContactCard>

        <ContactCard title="Email" detail="admin@planyourskin.id" href="mailto:admin@planyourskin.id">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </ContactCard>
      </div>

      <div className="mt-12 rounded-lg border border-neutral-200 bg-brand-soft/30 p-8 text-center">
        <h2 className="mb-3 text-xl font-medium text-[#222529]">Operations Hours</h2>
        <p className="text-[#555]">
          Senin – Jumat
          <br />
          08.00 – 16.00 WIB
        </p>
      </div>
    </article>
    </>
  );
}

function ContactCard({
  title,
  detail,
  href,
  children,
}: {
  title: string;
  detail: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-lg border border-neutral-200 p-6 transition-colors hover:border-brand"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        {children}
      </div>
      <div>
        <h3 className="text-[14px] font-semibold uppercase tracking-wide text-[#222529]">{title}</h3>
        <p className="mt-1 text-[15px] text-[#555] group-hover:text-brand">{detail}</p>
      </div>
    </a>
  );
}
