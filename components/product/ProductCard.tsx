import Image from "next/image";
import Link from "next/link";
import { formatMoney, type ProductSummary } from "@/lib/shopify";

export default function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link href={`/product/${product.handle}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-md bg-neutral-100">
        {product.featuredImage ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium text-neutral-800">{product.title}</h3>
        <p className="text-sm text-neutral-600">
          {formatMoney(product.priceRange.minVariantPrice)}
        </p>
      </div>
    </Link>
  );
}
