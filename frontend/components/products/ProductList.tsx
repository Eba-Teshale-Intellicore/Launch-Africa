"use client";

import { useProducts } from "@/src/hooks/useProduct";
import ProductCard from "@/components/products/ProductCard";
import { useState } from "react";

interface Props {
  view?: string;
  isOwnerView?: boolean;
}

function CategoryIcon({ name }: { name: string }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (name === "file") {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </svg>
    );
  }

  if (name === "house") {
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9M9 21v-8h6v8" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
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
            className="bg-card border-line rounded-card shadow-card animate-pulse overflow-hidden border p-5"
          >
            <div className="bg-input mb-5 size-12 rounded-card" />
            <div className="bg-input mb-3 h-5 w-2/3 rounded" />
            <div className="bg-input mb-2 h-3 w-full rounded" />
            <div className="bg-input h-3 w-4/5 rounded" />
            <div className="bg-input mt-8 h-9 w-28 rounded-full" />
          </div>
        ))}
      </section>
    );
  }

  if (isError) {
    return (
      <section className="bg-card border-line rounded-card mx-auto max-w-xl border p-8 text-center">
        <div className="text-error mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--input)]">
          !
        </div>
        <h2 className="text-main text-lg font-bold">Could not load products</h2>

        <p className="text-soft mt-2 text-sm">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          className="btn-main rounded-pill mt-6 px-6 py-3 text-sm"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!products?.length) {
    return (
      <section className="bg-card border-line rounded-card mx-auto max-w-xl border p-10 text-center">
        <div className="bg-input text-soft mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl">
          <CategoryIcon name="folder" />
        </div>
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
    <section aria-label="Products">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isOwnerView={isOwnerView}
          />
        ))}
      </div>
    </section>
  );
}
