"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, LoaderCircle, UserRound } from "lucide-react";

import { useGlobalSearch } from "@/src/hooks/useSearch";

export default function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  const { data, isLoading, isFetching, error } = useGlobalSearch(initialQuery);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = query.trim();

    if (value.length < 2) return;

    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const totalResults =
    (data?.products.length || 0) +
    (data?.categories.length || 0) +
    (data?.builders.length || 0);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-24 sm:px-6">
      {/* Search heading */}
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold text-main">
          DISCOVER LAUNCHAFRICA
        </p>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Search
        </h1>

        <p className="mt-2 text-sm text-muted">
          Discover African products, categories, and builders.
        </p>
      </div>

      {/* Search input */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 flex h-12 max-w-2xl overflow-hidden rounded-xl border border-line bg-input focus-within:border-main"
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products, categories, builders..."
          className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none"
        />

        <button
          type="submit"
          disabled={query.trim().length < 2}
          className="flex items-center gap-2 bg-main px-5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Search size={18} />
          Search
        </button>
      </form>

      {/* Loading */}
      {(isLoading || isFetching) && (
        <div className="flex items-center gap-3 py-10 text-sm text-muted">
          <LoaderCircle size={20} className="animate-spin" />
          Searching LaunchAfrica...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-line p-6">
          <p className="font-semibold">Something went wrong.</p>
          <p className="mt-2 text-sm text-muted">
            We couldn't load your search results. Please try again.
          </p>
        </div>
      )}

      {/* Results */}
      {!isLoading && !isFetching && !error && data && (
        <>
          <div className="mb-8 border-b border-line pb-5">
            <h2 className="text-xl font-bold">Results for "{data.query}"</h2>

            <p className="mt-2 text-sm text-muted">
              {totalResults} results found
            </p>
          </div>

          {totalResults === 0 ? (
            <div className="rounded-2xl border border-line px-5 py-16 text-center">
              <Search size={35} className="mx-auto mb-4 text-muted" />

              <h2 className="text-xl font-bold">No results found</h2>

              <p className="mt-2 text-sm text-muted">
                Try different keywords or check your spelling.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Products */}
              {data.products.length > 0 && (
                <section>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Products</h2>

                    <span className="text-sm text-muted">
                      {data.products.length} found
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="flex gap-4 rounded-xl border border-line bg-card p-4 transition-colors hover:bg-hover"
                      >
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-line bg-input">
                          {product.logo_url ? (
                            <Image
                              src={product.logo_url}
                              alt={product.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center font-bold text-main">
                              {product.title.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-bold">
                            {product.title}
                          </h3>

                          <p className="mt-1 line-clamp-2 text-sm text-muted">
                            {product.tagline}
                          </p>

                          <p className="mt-2 text-xs font-semibold text-main">
                            {product.category_name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Categories */}
              {data.categories.length > 0 && (
                <section>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Categories</h2>

                    <span className="text-sm text-muted">
                      {data.categories.length} found
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.categories.map((category) => (
                      <article
                        key={category.id}
                        className="rounded-xl border border-line bg-card p-5"
                      >
                        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-hover font-bold text-main">
                          {category.name.charAt(0)}
                        </div>

                        <h3 className="font-bold">{category.name}</h3>

                        <p className="mt-2 text-sm text-muted">
                          {category.description || "Explore this category."}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Builders */}
              {data.builders.length > 0 && (
                <section>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Builders</h2>

                    <span className="text-sm text-muted">
                      {data.builders.length} found
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.builders.map((builder) => (
                      <article
                        key={builder.id}
                        className="flex items-center gap-4 rounded-xl border border-line bg-card p-4"
                      >
                        <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-main font-bold text-black">
                          {builder.avatar_url ? (
                            <Image
                              src={builder.avatar_url}
                              alt={builder.username}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <UserRound size={22} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-bold">
                            {builder.display_name || builder.username}
                          </h3>

                          <p className="text-sm text-muted">
                            @{builder.username}
                          </p>

                          {builder.bio && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted">
                              {builder.bio}
                            </p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* No query */}
      {!initialQuery && (
        <p className="py-8 text-sm text-muted">
          Enter at least two characters to discover products, categories, and
          builders.
        </p>
      )}
    </main>
  );
}
