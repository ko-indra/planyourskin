const BADGES = [
  "Non-Comedogenic",
  "Dermatologicaly Tested",
  "Halal Certified",
  "BPOM Certified",
  "Sensitive Skin Friendly",
  "All Skin Type",
];

export default function BadgesMarquee() {
  const items = [...BADGES, ...BADGES];
  return (
    <div className="overflow-hidden border-y border-neutral-200 bg-white py-3">
      <div className="flex animate-marquee gap-12 whitespace-nowrap text-[13px] font-medium tracking-wide text-[#222529]">
        {items.map((b, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-2">
            <Check />
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E491A9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
