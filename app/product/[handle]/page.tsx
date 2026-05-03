import Image from "next/image";
import { notFound } from "next/navigation";
import { formatMoney, getProductByHandle } from "@/lib/shopify";
import AddToCartButton from "@/components/product/AddToCartButton";

export default async function ProductPage({ params }: { params: { handle: string } }) {
  const product = await getProductByHandle(params.handle);
  if (!product) notFound();

  const images = product.images.edges.map((e) => e.node);
  const heroImg = images[0] ?? product.featuredImage;

  return (
    <div className="mx-auto max-w-site px-4 py-12 md:px-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          {heroImg && (
            <div className="relative aspect-square overflow-hidden rounded-md bg-neutral-100">
              <Image
                src={heroImg.url}
                alt={heroImg.altText ?? product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          )}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded bg-neutral-100">
                  <Image
                    src={img.url}
                    alt={img.altText ?? `${product.title} ${i + 2}`}
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl md:text-4xl">{product.title}</h1>
          <p className="mt-3 text-2xl text-brand-accent">
            {formatMoney(product.priceRange.minVariantPrice)}
          </p>
          <div
            className="prose prose-sm mt-6 max-w-none text-neutral-700"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
