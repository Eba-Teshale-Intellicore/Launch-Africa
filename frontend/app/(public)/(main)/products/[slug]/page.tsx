"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import ProductImageUploader from "@/components/products/ProductImageUploader";
import { useProduct } from "@/src/hooks/useProduct";
import { useCurrentUser } from "@/src/hooks/useCategory";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const {
    data: product,
    isPending,
    isError,
    error,
    refetch,
  } = useProduct(slug);

  const { data: user, isPending: checkingUser } = useCurrentUser();

  if (isPending) {
    return (
      <main className="bg-page min-h-screen px-4 pt-32">
        <p role="status" className="text-soft text-center">
          Loading product...
        </p>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="bg-page min-h-screen px-4 pt-32">
        <section className="bg-card border-line rounded-card mx-auto max-w-xl border p-8 text-center">
          <h1 className="text-main text-xl font-bold">Product unavailable</h1>
          <p className="text-soft mt-3 text-sm">
            {error instanceof Error
              ? error.message
              : "This product could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="btn-main rounded-pill mt-5 px-6 py-3"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const isAdmin = Boolean(
    user &&
    user.is_active !== false &&
    (user.is_staff || user.is_superuser || user.role === "admin"),
  );

  // This assumes the serializer returns the owner's ID in `owner`.
  const isOwner = Boolean(user) && String(user?.id) === String(product.owner);

  const canManage = !checkingUser && (isOwner || isAdmin);

  const categoryName =
    typeof product.category === "object" && product.category
      ? product.category.name
      : "Product";

  return (
    <main className="bg-page min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
      <div className="w-page mx-auto space-y-8">
        <Link href="/products" className="text-soft text-sm hover:text-logo2">
          ← Back to products
        </Link>

        <header className="bg-card border-line rounded-card border p-6 sm:p-8">
          <span className="text-soft text-xs font-semibold uppercase tracking-wider">
            {categoryName}
          </span>

          <h1 className="text-logo mt-3 break-words text-3xl font-black sm:text-4xl">
            {product.title}
          </h1>

          <p className="text-soft mt-3 text-lg leading-7">{product.tagline}</p>

          {canManage && (
            <p className="text-soft mt-4 text-sm">
              Product status:{" "}
              <span className="text-logo2 font-semibold">{product.status}</span>
            </p>
          )}

          <p className="text-main mt-6 whitespace-pre-wrap text-sm leading-7">
            {product.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {product.website_url && (
              <a
                href={product.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-main rounded-pill px-5 py-3 text-sm"
              >
                Visit website ↗
              </a>
            )}

            {product.demo_url && (
              <a
                href={product.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-soft rounded-pill px-5 py-3 text-sm"
              >
                View demo ↗
              </a>
            )}
          </div>
        </header>

        <ProductImageUploader slug={product.slug} canManage={canManage} />
      </div>
    </main>
  );
}
