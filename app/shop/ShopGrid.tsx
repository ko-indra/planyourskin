"use client";
import { useMemo, useState } from "react";
import ProductCardLoved from "@/components/product/ProductCardLoved";
import { type ProductSummary } from "@/lib/shopify";

const CATEGORIES = ["Cleansing Serum", "Moisturizer", "Serums", "Skincare", "Sunscreen"];
const KEY_CONCERNS = [
  "Acne Prone",
  "Blemish",
  "Combination",
  "Dehydration",
  "Large Pores",
  "Normal",
  "Oily",
  "PIE",
  "PIH",
  "Sensitive Skin",
];

const SORT_OPTIONS = [
  { value: "default", label: "Default sorting" },
  { value: "price-asc", label: "Sort by price: low to high" },
  { value: "price-desc", label: "Sort by price: high to low" },
  { value: "name-asc", label: "Sort by name: A-Z" },
  { value: "name-desc", label: "Sort by name: Z-A" },
];

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function ShopGrid({ products }: { products: ProductSummary[] }) {
  // Min/max price across all products
  const { minPrice, maxPrice } = useMemo(() => {
    const prices = products.map((p) => parseFloat(p.priceRange.minVariantPrice.amount));
    return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
  }, [products]);

  const [search, setSearch] = useState("");
  const [pendingMin, setPendingMin] = useState(minPrice);
  const [pendingMax, setPendingMax] = useState(maxPrice);
  const [appliedMin, setAppliedMin] = useState(minPrice);
  const [appliedMax, setAppliedMax] = useState(maxPrice);
  const [cats, setCats] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [sort, setSort] = useState("default");

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const filtered = useMemo(() => {
    let out = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((p) => p.title.toLowerCase().includes(q));
    }
    out = out.filter((p) => {
      const price = parseFloat(p.priceRange.minVariantPrice.amount);
      return price >= appliedMin && price <= appliedMax;
    });
    if (cats.length > 0) {
      out = out.filter((p) => cats.some((c) => p.tags?.includes(c)));
    }
    if (concerns.length > 0) {
      out = out.filter((p) => concerns.some((c) => p.tags?.includes(c)));
    }
    if (sort === "price-asc") out.sort((a, b) => parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount));
    else if (sort === "price-desc") out.sort((a, b) => parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount));
    else if (sort === "name-asc") out.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "name-desc") out.sort((a, b) => b.title.localeCompare(a.title));
    return out;
  }, [products, search, appliedMin, appliedMax, cats, concerns, sort]);

  return (
    <div className="grid gap-8 md:grid-cols-[260px_1fr] md:gap-10">
      {/* Sidebar */}
      <aside className="space-y-8">
        {/* Search */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex"
        >
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-neutral-300 px-3 py-2 text-[13px] focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            className="bg-[#222529] px-4 text-[12px] font-semibold uppercase tracking-wide text-white"
          >
            Search
          </button>
        </form>

        {/* Price */}
        <div>
          <h3 className="mb-4 flex items-center justify-between text-[14px] font-bold uppercase tracking-wide text-[#222529]">
            Price
            <span className="font-normal text-[#aaa]">−</span>
          </h3>
          <div className="space-y-3">
            <div className="relative h-1 rounded bg-neutral-200">
              <div
                className="absolute h-1 rounded bg-[#222529]"
                style={{
                  left: `${((pendingMin - minPrice) / (maxPrice - minPrice)) * 100}%`,
                  right: `${100 - ((pendingMax - minPrice) / (maxPrice - minPrice)) * 100}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={pendingMin}
                min={minPrice}
                max={pendingMax}
                onChange={(e) => setPendingMin(Number(e.target.value))}
                className="w-full border border-neutral-300 px-2 py-1 text-[12px]"
              />
              <input
                type="number"
                value={pendingMax}
                min={pendingMin}
                max={maxPrice}
                onChange={(e) => setPendingMax(Number(e.target.value))}
                className="w-full border border-neutral-300 px-2 py-1 text-[12px]"
              />
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#777]">
                Price: <span className="font-semibold text-[#222529]">{formatIDR(pendingMin)}</span> —{" "}
                <span className="font-semibold text-[#222529]">{formatIDR(pendingMax)}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAppliedMin(pendingMin);
                  setAppliedMax(pendingMax);
                }}
                className="rounded bg-neutral-100 px-3 py-1 text-[12px] font-medium hover:bg-[#222529] hover:text-white"
              >
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <FilterGroup title="Categories" options={CATEGORIES} selected={cats} onToggle={(v) => setCats(toggleArr(cats, v))} />

        {/* Key Concern */}
        <FilterGroup
          title="Key Concern"
          options={KEY_CONCERNS}
          selected={concerns}
          onToggle={(v) => setConcerns(toggleArr(concerns, v))}
        />
      </aside>

      {/* Main grid */}
      <div>
        <div className="mb-6 flex items-center justify-end gap-3 text-[13px] text-[#777]">
          <label htmlFor="sort">Sort by:</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-[13px] uppercase tracking-wide text-[#222529] focus:border-brand focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="py-20 text-center text-[#777]">Tidak ada produk yang cocok dengan filter.</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-6">
            {filtered.map((p) => (
              <ProductCardLoved key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-4 text-[16px] font-semibold text-[#222529]">{title}</h3>
      <ul className="space-y-2">
        {options.map((opt) => (
          <li key={opt}>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#555] hover:text-[#222529]">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand"
              />
              {opt}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
