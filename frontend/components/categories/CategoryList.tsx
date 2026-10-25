"use client";

import { useState } from "react";
import { useCategories, useUpdateCategory } from "@/src/hooks/useCategory";
import type { CategoryIconName } from "@/src/types/category";

interface CategoryListProps {
  isAdmin: boolean;
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
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "The request failed. Please try again.";
}

export default function CategoryList({ isAdmin }: CategoryListProps) {
  const {
    data: categories,
    isPending,
    isError,
    error,
    refetch,
  } = useCategories(isAdmin);

  // const updateCategory = useUpdateCategory();
  const updateMutation = useUpdateCategory();
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  const [mutationError, setMutationError] = useState<string | null>(null);

  async function toggleCategory(slug: string, isActive: boolean) {
    setUpdatingSlug(slug);
    setMutationError(null);

    try {
      await updateMutation.mutateAsync({
        slug,
        input: { is_active: !isActive },
      });
    } catch (err) {
      setMutationError(getErrorMessage(err));
    } finally {
      setUpdatingSlug(null);
    }
  }

  if (isPending) {
    return (
      <section
        aria-label="Loading categories"
        aria-busy="true"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-card border-line rounded-card shadow-card animate-pulse border p-6"
          >
            <div className="bg-input mb-5 size-12 rounded-2xl" />
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

        <h2 className="text-main text-lg font-bold">
          Could not load categories
        </h2>

        <p className="text-soft mt-2 text-sm leading-6">
          {error instanceof Error
            ? error.message
            : "Something went wrong while loading categories."}
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="btn-main rounded-pill mt-6 px-6 py-3 text-sm"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!categories?.length) {
    return (
      <section className="bg-card border-line rounded-card mx-auto max-w-xl border px-6 py-12 text-center sm:px-10">
        <div className="bg-input text-soft mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl">
          <CategoryIcon name="folder" />
        </div>

        <h2 className="text-main text-lg font-bold">
          {isAdmin ? "Your categories start here" : "No categories available"}
        </h2>

        <p className="text-soft mx-auto mt-3 max-w-sm text-sm leading-6">
          {isAdmin
            ? "Create your first category to organize products across the African innovation ecosystem."
            : "Categories will appear here when an administrator activates them."}
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Product categories">
      {mutationError && (
        <p role="alert" className="text-error mb-5 text-sm">
          {mutationError}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const iconName: CategoryIconName =
            category.icon_name === "file" || category.icon_name === "house"
              ? category.icon_name
              : "folder";

          const isUpdating = updatingSlug === category.slug;
          return (
            <article
              key={category.id}
              className="bg-card border-line rounded-card group relative flex min-w-0 flex-col border p-5 transition duration-200 hover:-translate-y-1 hover:border-[var(--text-soft)] hover:shadow-card sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div>
                  <div className="bg-input text-soft flex size-12 shrink-0 items-center justify-center rounded-2xl transition-colors group-hover:text-logo2">
                    <CategoryIcon name={iconName} />
                  </div>
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <h2 className="text-main break-words text-lg font-bold tracking-tight">
                    {category.name}
                  </h2>
                  {isAdmin && (
                    <span
                      className={`mt-2 inline-flex items-center gap-2 text-xs font-semibold ${
                        category.is_active ? "text-success" : "text-soft"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`size-1.5 rounded-full ${
                          category.is_active
                            ? "bg-[var(--success)]"
                            : "bg-[var(--text-soft)]"
                        }`}
                      />
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  )}

                  <p className="text-soft mt-2 min-h-12 text-sm leading-6">
                    {category.description || "Explore products in this sector."}
                  </p>
                </div>
              </div>

              <div
                className="mt-6 flex items-center justify-between"
                // border-t border-[var(--line)]
              >
                <span className="bg-input text-main rounded-pill inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold">
                  <span className="text-logo2 font-bold">
                    {category.product_count}
                  </span>
                  {category.product_count === 1 ? "product" : "products"}
                </span>
              </div>

              {isAdmin && (
                <div className="mt-4 border-t border-[var(--line)] pt-4">
                  {/* <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      updateCategory.mutate({
                        slug: category.slug,
                        input: {
                          is_active: !category.is_active,
                        },
                      })
                    }
                    className="btn-soft rounded-pill w-full px-4 py-3 text-sm disabled:opacity-50"
                  > */}
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      void toggleCategory(category.slug, category.is_active)
                    }
                    className="btn-soft rounded-pill w-full px-4 py-3 text-sm disabled:opacity-50"
                  >
                    {isUpdating
                      ? "Updating..."
                      : category.is_active
                        ? "Deactivate category"
                        : "Activate category"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
