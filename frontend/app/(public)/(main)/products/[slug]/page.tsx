"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useProduct } from "@/src/hooks/useProduct";
import { useCurrentUser } from "@/src/hooks/useCategory";
import { AFRICAN_COUNTRIES } from "@/src/constants/african-countries";
import { useToast } from "@/components/toast/ToastProvider";

type ToastType = "success" | "error" | "info";

export function getAfricanCountryFlag(countryName: string): string {
  return (
    AFRICAN_COUNTRIES.find((country) => country.name === countryName)?.flag ??
    "🌍"
  );
}

function VoteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 17V7" />
      <path d="m7.5 11.5 4.5-4.5 4.5 4.5" />
    </svg>
  );
}

export default function ProductDetailPage() {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const {
    data: product,
    isPending,
    isError,
    error,
    refetch,
  } = useProduct(slug);

  const { data: user, isLoading: checkingUser } = useCurrentUser();

  // Calculate images safely, including while product data is loading.
  const images = [...(product?.images ?? [])].sort(
    (a, b) =>
      Number(b.is_primary) - Number(a.is_primary) ||
      a.display_order - b.display_order,
  );

  // All hooks must be called before any conditional return.
  useEffect(() => {
    if (selectedImageIndex === null || images.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImageIndex(null);
      }

      if (event.key === "ArrowRight") {
        setSelectedImageIndex((current) =>
          current === null ? null : (current + 1) % images.length,
        );
      }

      if (event.key === "ArrowLeft") {
        setSelectedImageIndex((current) =>
          current === null
            ? null
            : (current - 1 + images.length) % images.length,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImageIndex, images.length]);

  // Loading state
  if (isPending) {
    return (
      <main className="bg-page min-h-screen px-4 pt-32 sm:px-6">
        <p role="status" className="text-soft text-center">
          Loading product...
        </p>
      </main>
    );
  }

  // Error state
  if (isError || !product) {
    return (
      <main className="bg-page min-h-screen px-4 pt-32 sm:px-6">
        <section className="bg-card border-line rounded-card mx-auto max-w-xl border p-5 text-center sm:p-8">
          <h1 className="text-main text-xl font-bold">Product unavailable</h1>

          <p className="text-soft mt-3 break-words text-sm">
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

  // Assumes product.owner contains the owner's ID.
  const isOwner = Boolean(user) && String(user?.id) === String(product.owner);

  const canManage = !checkingUser && (isOwner || isAdmin);

  const handleExternalLink = (url: string) => {
    if (checkingUser) {
      showToast("Please wait while we verify your account.", "info");
      return;
    }

    if (!user) {
      showToast(
        "Login required! Please sign in to visit this website or view the demo.",
        "error",
      );
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const categoryName =
    typeof product.category === "object" && product.category
      ? product.category.name
      : "Product";

  // Share using the native share dialog, or copy the URL.
  const handleShareProduct = async () => {
    const productUrl = `${window.location.origin}/products/${encodeURIComponent(
      product.slug,
    )}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: product.tagline || `Discover ${product.title} on LaunchAfrica.`,
          url: productUrl,
        });

        showToast("Product shared successfully.", "success");
      } else {
        await navigator.clipboard.writeText(productUrl);
        showToast("Product link copied to clipboard.", "success");
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(productUrl);
        showToast("Product link copied to clipboard.", "success");
      } catch {
        showToast(
          "Unable to share. Please copy the page URL manually.",
          "error",
        );
      }
    }
  };

  const selectedImage =
    selectedImageIndex === null ? null : images[selectedImageIndex];

  return (
    <main className="bg-page min-h-screen px-3 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-36">
      <div className="w-page mx-auto min-w-0 space-y-6 sm:space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-soft min-w-0 text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-logo2">
                Home
              </Link>
            </li>

            <li aria-hidden="true">/</li>

            <li>
              <Link
                href="/products"
                className="transition-colors hover:text-logo2"
              >
                Products
              </Link>
            </li>

            <li aria-hidden="true">/</li>

            <li
              aria-current="page"
              className="text-main max-w-40 truncate sm:max-w-64"
            >
              {product.title}
            </li>
          </ol>
        </nav>

        {/* Product header */}
        <header className="bg-card border-line rounded-card flex min-w-0 flex-col gap-6 border p-4 sm:gap-8 sm:p-6 lg:p-8">
          <div className="flex min-w-0 flex-row gap-5 sm:items-start sm:gap-6">
            {/* Product logo */}
            <div className="bg-input border-line flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-card border sm:size-24 lg:size-28">
              {product.logo_url ? (
                <Image
                  src={product.logo_url}
                  alt={`${product.title} logo`}
                  width={112}
                  height={112}
                  className="size-full rounded-card object-contain p-2"
                  unoptimized
                />
              ) : (
                <span className="text-soft text-xs">No logo</span>
              )}
            </div>

            {/* Product information */}
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-logo break-words text-2xl leading-tight font-black sm:text-3xl lg:text-4xl xl:text-5xl">
                    {product.title}
                  </h1>

                  <p className="text-soft mt-2 break-words text-base leading-7 sm:text-lg">
                    {product.tagline || "Explore the products."}
                  </p>

                  {canManage && (
                    <p className="text-soft mt-3 text-sm">
                      Product status:{" "}
                      <span className="text-logo2 font-semibold uppercase">
                        {product.status}
                      </span>
                    </p>
                  )}
                </div>

                <span
                  className="shrink-0 pt-1 text-2xl sm:text-3xl"
                  role="img"
                  aria-label={product.country || "Country"}
                  title={product.country || "Country"}
                >
                  {getAfricanCountryFlag(product.country)}
                </span>
              </div>

              {/* Website and sharing */}
              {(product.website_url || product.demo_url) && (
                <div className="mt-5 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
                  {product.website_url && (
                    <button
                      type="button"
                      onClick={() => handleExternalLink(product.website_url!)}
                      className="btn-main rounded-pill inline-flex w-full items-center justify-center px-4 py-3 text-sm sm:w-auto sm:px-5"
                    >
                      Visit website ↗
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleShareProduct}
                    className="btn-soft rounded-pill inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm transition-colors sm:w-auto sm:px-5"
                    aria-label={`Share ${product.title}`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <path d="m8.7 10.5 6.6-4" />
                      <path d="m8.7 13.5 6.6 4" />
                    </svg>
                    Share Product
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category, description and upvote */}
          <div className="min-w-0 border-t pt-5 sm:pt-6">
            <div className="mb-3">
              <span className="bg-input text-main rounded-pill inline-flex max-w-full px-3 py-1 text-sm font-bold">
                {categoryName}
              </span>
            </div>

            <div className="flex min-w-0 items-end gap-3 sm:gap-5">
              <div className="min-w-0 flex-1">
                <p className="text-soft mt-2 break-words text-sm leading-7 sm:text-base">
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
          </div>
        </header>

        {/* Product image gallery */}
        <section className="bg-card border-line rounded-card min-w-0 overflow-hidden border p-4 sm:p-6 lg:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-logo text-xl font-bold sm:text-2xl">
              Overview
            </h2>

            {product.demo_url ? (
              <button
                type="button"
                onClick={() => handleExternalLink(product.demo_url!)}
                className="btn-soft rounded-pill inline-flex w-full items-center justify-center px-4 py-3 text-sm sm:w-auto sm:px-5"
              >
                View demo ↗
              </button>
            ) : (
              images.length > 0 && (
                <span className="text-soft shrink-0 text-xs sm:text-sm">
                  {images.length} {images.length === 1 ? "image" : "images"}
                </span>
              )
            )}
          </div>

          {images.length > 0 ? (
            <div className="mt-5 min-w-0">
              <div
                className="flex w-full min-w-0 flex-nowrap gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-4 sm:gap-4"
                aria-label="Product image gallery"
                tabIndex={0}
              >
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`View ${image.alt_text || `${product.title} image ${index + 1}`} full screen`}
                    className="group bg-card border-line rounded-card relative flex h-52 w-[78vw] max-w-72 shrink-0 flex-col overflow-hidden border text-left transition duration-200 hover:-translate-y-1 hover:border-[var(--text-soft)] hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-soft)] sm:h-60 sm:w-72 sm:max-w-none md:h-64 md:w-80 lg:h-72 lg:w-[28rem] xl:w-[32rem]"
                  >
                    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2">
                      <Image
                        src={image.secure_url}
                        alt={
                          image.alt_text ||
                          `${product.title} image ${index + 1}`
                        }
                        width={800}
                        height={500}
                        unoptimized
                        className="size-full min-h-0 object-cover"
                        sizes="(max-width: 639px) 78vw, (max-width: 767px) 288px, (max-width: 1023px) 320px, (max-width: 1279px) 448px, 512px"
                      />
                    </div>

                    <div className="shrink-0 px-3 pb-3">
                      {image.is_primary && (
                        <span className="text-logo2 block text-xs font-semibold">
                          Primary image
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {images.length > 1 && (
                <p className="text-soft mt-1 text-right text-xs">
                  Select an image to view fullscreen · Swipe to see more
                </p>
              )}
            </div>
          ) : (
            <div className="bg-input border-line text-soft mt-5 flex min-h-52 items-center justify-center rounded-card border px-4 text-center sm:min-h-64">
              No product images available.
            </div>
          )}
        </section>
      </div>

      {/* Fullscreen image viewer */}
      {selectedImage && selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Full-screen product image viewer"
          onClick={() => setSelectedImageIndex(null)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setSelectedImageIndex(null)}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 z-20 flex size-11 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20"
          >
            ×
          </button>

          {/* Previous */}
          {images.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedImageIndex(
                  (selectedImageIndex - 1 + images.length) % images.length,
                );
              }}
              className="absolute left-2 z-20 flex size-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:left-5 sm:size-12"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <div
            className="relative h-[85vh] max-h-[900px] w-full max-w-7xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              key={selectedImage.id}
              src={selectedImage.secure_url}
              alt={
                selectedImage.alt_text ||
                `${product.title} image ${selectedImageIndex + 1}`
              }
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-contain"
            />

            {/* Caption */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex flex-col items-center gap-1 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10 text-center">
              <p className="text-sm font-medium text-white">{product.title}</p>
              <p className="text-xs text-white/70">
                Image {selectedImageIndex + 1} of {images.length}
              </p>
            </div>
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedImageIndex((selectedImageIndex + 1) % images.length);
              }}
              className="absolute right-2 z-20 flex size-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:right-5 sm:size-12"
            >
              ›
            </button>
          )}
        </div>
      )}
    </main>
  );
}
