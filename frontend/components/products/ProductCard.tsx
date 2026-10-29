import Link from "next/link";
import type { Product } from "@/src/types/product";
import Image from "next/image";
import { AFRICAN_COUNTRIES } from "@/src/constants/african-countries";

export function getAfricanCountryFlag(countryName: string): string {
  return (
    AFRICAN_COUNTRIES.find((country) => country.name === countryName)?.flag ??
    "🌍"
  );
}
interface Props {
  product: Product;
  isOwnerView?: boolean;
}

function VoteIcon() {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  return (
    <svg {...common}>
      <path d="M12 17V7" />
      <path d="m7.5 11.5 4.5-4.5 4.5 4.5" />
    </svg>
  );
}

export default function ProductCard({ product, isOwnerView = false }: Props) {
  const primaryImage =
    product.images?.find((image) => image.is_primary) ?? product.images?.[0];

  const categoryName =
    typeof product.category === "object" && product.category
      ? product.category.name
      : "Product";

  return (
    <article className="bg-card border-line rounded-card group relative flex min-w-0 flex-col border p-5 transition duration-200 hover:-translate-y-1 hover:border-[var(--text-soft)] hover:shadow-card sm:p-6">
      <Link
        href={`/products/${encodeURIComponent(product.slug)}`}
        className="block"
        aria-label={`View ${product.title}`}
      >
        <div className="flex items-start gap-4">
          <div>
            <div className="bg-page text-soft flex size-16 shrink-0 items-center justify-center rounded-card transition-colors group-hover:text-logo2 mt-1">
              <Image
                src={product.logo_url}
                alt={`${product.title} logo`}
                width={64}
                height={64}
                className="bg-input size-16 shrink-0 rounded-2xl object-contain transition-colors"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-main break-words text-xl font-bold tracking-tight line-clamp-1 ">
              {product.title}
            </h2>
            {isOwnerView && (
              <span
                className={`mt-2 inline-flex items-center gap-2 text-xs font-semibold ${
                  product.status ? "text-success" : "text-soft"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${
                    product.status == "published"
                      ? "bg-[var(--success)]"
                      : "bg-[var(--text-soft)]"
                  }`}
                />
                {product.status ? "Active" : "Inactive"}
              </span>
            )}

            <p className="text-soft mt-1 min-h-12 text-sm leading-6">
              {product.tagline || "Explore the products."}
            </p>
          </div>

          <div className="bg-input rounded-card px-2 border-line">
            <span className="inline-block origin-reverse animate-[wave_3s_ease-in-out_infinite] text-2xl">
              {getAfricanCountryFlag(product.country)}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col pb-5">
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

        <div className="flex items-end gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-soft mt-2 min-h-12 line-clamp-2 text-sm leading-6">
              {product.description || "Explore the products."}
            </p>
          </div>

          <button
            type="button"
            aria-label="Upvote product"
            className="border-line hover:border-orange-500 hover:text-orange-500 flex shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2 transition-colors"
          >
            <VoteIcon />
            <span className="text-xs font-semibold">24</span>
          </button>
        </div>

        {/* <div className="mt-auto pt-5">
            <Link
              href={`/products/${encodeURIComponent(product.slug)}`}
              className="btn-soft rounded-pill w-full px-4 py-3 text-sm"
            >
              View product
            </Link>
          </div> */}
      </div>
    </article>
  );
}
