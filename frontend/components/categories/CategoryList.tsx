"use client";

import { useCategories, useUpdateCategory } from "@/src/hooks/useCategory";

interface CategoryListProps {
  isAdmin: boolean;
}

export default function CategoryList({ isAdmin }: CategoryListProps) {
  const {
    data: categories,
    isPending,
    isError,
    error,
    refetch,
  } = useCategories(isAdmin);

  const updateCategory = useUpdateCategory();

  if (isPending) {
    return (
      <section className="space-y-4">
        <h2 className="text-main text-xl font-semibold">Explore categories</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-card border-line rounded-card shadow-card animate-pulse p-5"
            >
              <div className="bg-input mb-3 h-3 w-16 rounded" />
              <div className="bg-input mb-3 h-5 w-3/4 rounded" />
              <div className="bg-input mb-2 h-3 w-full rounded" />
              <div className="bg-input mb-4 h-3 w-2/3 rounded" />
              <div className="bg-input h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <h2 className="text-main text-xl font-semibold">Explore categories</h2>

        <div className="bg-card border-line rounded-card shadow-card w-card mx-auto p-6 sm:p-8">
          <p role="alert" className="text-error text-sm">
            Could not load categories: {error.message}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="btn-main rounded-pill mt-4 w-full px-4 py-3"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!categories?.length) {
    return (
      <section className="space-y-4">
        <h2 className="text-main text-xl font-semibold">Explore categories</h2>

        <div className="bg-card border-line rounded-card shadow-card w-card mx-auto p-8 text-center">
          <div className="bg-input rounded-pill mx-auto mb-4 inline-flex size-12 items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="text-soft"
            >
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            </svg>
          </div>

          <p className="text-main text-sm font-semibold">
            {isAdmin ? "No categories yet" : "No active categories yet"}
          </p>

          <p className="text-soft mt-1 text-sm">
            {isAdmin
              ? "Create a category to get started."
              : "Categories appear here once an administrator activates them."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-main text-xl font-semibold">Explore categories</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <article
            key={category.id}
            className="bg-card border-line rounded-card shadow-card p-5 transition hover:opacity-95"
          >
            <p className="text-soft mb-2 text-xs font-semibold uppercase tracking-wide">
              {category.icon_name || "Category"}
            </p>

            <h3 className="text-main text-lg font-bold">{category.name}</h3>

            <p className="text-soft mt-2 text-sm leading-6">
              {category.description || "No description yet."}
            </p>

            <p className="text-soft border-line mt-4 border-t pt-3 text-xs">
              {category.product_count} published{" "}
              {category.product_count === 1 ? "product" : "products"}
            </p>

            {isAdmin && (
              <div className="border-line mt-4 border-t pt-4">
                <p className="text-soft mb-3 text-sm">
                  Status:{" "}
                  <span className="font-semibold">
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </p>

                <button
                  type="button"
                  disabled={updateCategory.isPending}
                  onClick={() =>
                    updateCategory.mutate({
                      slug: category.slug,
                      input: { is_active: !category.is_active },
                    })
                  }
                  className="btn-main rounded-pill w-full px-4 py-3 disabled:opacity-50"
                >
                  {updateCategory.isPending
                    ? "Updating..."
                    : category.is_active
                      ? "Deactivate category"
                      : "Activate category"}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
