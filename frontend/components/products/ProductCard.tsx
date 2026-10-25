import Link from "next/link";
import type { Product } from "@/src/types/product";

interface Props {
  product: Product;
  isOwnerView?: boolean;
}

export default function ProductCard({ product, isOwnerView = false }: Props) {
  const primaryImage =
    product.images?.find((image) => image.is_primary) ?? product.images?.[0];

  const categoryName =
    typeof product.category === "object" && product.category
      ? product.category.name
      : "Product";

  return (
    <article className="bg-card border-line rounded-card group flex min-w-0 flex-col overflow-hidden border transition duration-200 hover:-translate-y-1 hover:shadow-card">
      <Link
        href={`/products/${encodeURIComponent(product.slug)}`}
        className="block"
        aria-label={`View ${product.title}`}
      >
        <div className="bg-input aspect-[16/9] overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.secure_url}
              alt={primaryImage.alt_text || product.title}
              className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="text-soft flex size-full items-center justify-center">
              <span className="text-sm">No product image</span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="bg-input text-soft rounded-pill px-3 py-1 text-xs">
            {categoryName}
          </span>

          {isOwnerView && (
            <span className="text-soft text-xs capitalize">
              {product.status}
            </span>
          )}
        </div>

        <h2 className="text-main break-words text-lg font-bold">
          {product.title}
        </h2>

        <p className="text-soft mt-2 line-clamp-2 text-sm leading-6">
          {product.tagline}
        </p>

        <div className="mt-auto pt-5">
          <Link
            href={`/products/${encodeURIComponent(product.slug)}`}
            className="btn-soft rounded-pill w-full px-4 py-3 text-sm"
          >
            View product
          </Link>
        </div>
      </div>
    </article>
  );
}
