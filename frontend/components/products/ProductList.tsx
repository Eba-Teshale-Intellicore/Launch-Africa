"use client";

import { useProducts } from "@/src/hooks/useProduct";
import ProductCard from "@/components/products/ProductCard";

interface Props {
  view?: string;
  isOwnerView?: boolean;
}

export default function ProductList({
  view = "public",
  isOwnerView = false,
}: Props) {
  const {
    data: products,
    isPending,
    isError,
    error,
    refetch,
  } = useProducts(view);

  if (isPending) {
    return (
      <section
        aria-label="Loading products"
        aria-busy="true"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-card border-line rounded-card animate-pulse overflow-hidden border p-5"
          >
            <div className="bg-input mb-5 aspect-[16/9] rounded-card" />
            <div className="bg-input mb-3 h-5 w-2/3 rounded" />
            <div className="bg-input h-3 w-full rounded" />
          </div>
        ))}
      </section>
    );
  }

  if (isError) {
    return (
      <section className="bg-card border-line rounded-card mx-auto max-w-xl border p-8 text-center">
        <h2 className="text-main text-lg font-bold">Could not load products</h2>

        <p className="text-soft mt-2 text-sm">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          className="btn-main rounded-pill mt-5 px-6 py-3"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!products?.length) {
    return (
      <section className="bg-card border-line rounded-card mx-auto max-w-xl border p-10 text-center">
        <h2 className="text-main text-xl font-bold">
          {isOwnerView ? "Your products start here" : "No products yet"}
        </h2>

        <p className="text-soft mt-3 text-sm leading-6">
          {isOwnerView
            ? "Create your first product and introduce it to the LaunchAfrica ecosystem."
            : "New products will appear here when they are published."}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Products"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isOwnerView={isOwnerView}
        />
      ))}
    </section>
  );
}
