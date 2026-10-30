"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  Menu,
  Search,
  Plus,
  Bell,
  UserRound,
  X,
  Sun,
  Moon,
  LoaderCircle,
} from "lucide-react";

import { useCurrentUser } from "@/src/hooks/useCategory";
import { useGlobalSearch } from "@/src/hooks/useSearch";

type HeaderProps = {
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
};

type Theme = "dark" | "light";

export default function Header({
  onToggleSidebar,
  onToggleMobileMenu,
}: HeaderProps) {
  const router = useRouter();

  const [theme, setTheme] = useState<Theme>("dark");
  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: user, isPending: checkingUser } = useCurrentUser();

  const {
    data: searchResults,
    isFetching: searching,
    error: searchError,
  } = useGlobalSearch(search);

  const query = search.trim();
  const canSearch = query.length >= 2;

  useEffect(() => {
    const saved = window.localStorage.getItem("la-theme");

    const initial: Theme =
      saved === "light" || saved === "dark" ? saved : "dark";

    document.documentElement.setAttribute("data-theme", initial);
    setTheme(initial);
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!query) return;

    setShowSuggestions(false);
    setMobileSearchOpen(false);

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const openSearchResult = (value: string) => {
    setSearch(value);
    setShowSuggestions(false);
    setMobileSearchOpen(false);

    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("la-theme", next);

    setTheme(next);
  };

  const fullName =
    user?.display_name?.trim() || user?.username || user?.email || "User";

  const initial = fullName.charAt(0).toUpperCase();

  const hasResults =
    Boolean(searchResults) &&
    (searchResults.products.length > 0 ||
      searchResults.categories.length > 0 ||
      searchResults.builders.length > 0);

  const showDropdown = showSuggestions && canSearch;

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-3 border-b border-line bg-card px-3 sm:px-5">
      {/* Left: Brand and navigation */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="hidden size-10 items-center justify-center rounded-full hover:bg-hover md:flex"
        >
          <Menu size={23} />
        </button>

        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation"
          className="flex size-10 items-center justify-center rounded-full hover:bg-hover md:hidden"
        >
          <Menu size={23} />
        </button>

        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="LaunchAfrica home"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-main text-sm font-black text-black sm:hidden">
            LA
          </span>

          <span className="hidden text-lg font-black tracking-tight sm:block">
            LaunchAfrica
          </span>
        </Link>

        {/* Mobile search toggle */}
        <button
          type="button"
          onClick={() => {
            setMobileSearchOpen((previous) => !previous);
            setShowSuggestions(false);
          }}
          aria-label="Toggle search"
          className="flex size-10 items-center justify-center rounded-full hover:bg-hover md:hidden"
        >
          {mobileSearchOpen ? <X size={21} /> : <Search size={21} />}
        </button>
      </div>

      {/* Center: Search and autocomplete */}
      <form
        onSubmit={handleSearch}
        role="search"
        onFocus={() => setShowSuggestions(true)}
        onBlur={(event) => {
          const nextFocusedElement = event.relatedTarget as Node | null;

          if (!event.currentTarget.contains(nextFocusedElement)) {
            setShowSuggestions(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setShowSuggestions(false);
          }
        }}
        className={`relative mx-auto max-w-2xl flex-1 ${
          mobileSearchOpen ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="flex h-10 w-full overflow-hidden rounded-full border border-line bg-input focus-within:border-main">
          <input
            type="search"
            name="q"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, categories, builders..."
            aria-label="Search LaunchAfrica"
            aria-expanded={showDropdown}
            aria-controls="search-suggestions"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setShowSuggestions(false);
              }}
              aria-label="Clear search"
              className="px-2 text-muted hover:text-primary"
            >
              <X size={17} />
            </button>
          )}

          <button
            type="submit"
            aria-label="Search"
            className="flex w-14 shrink-0 items-center justify-center border-l border-line bg-hover hover:bg-hover/70"
          >
            <Search size={19} />
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {showDropdown && (
          <div
            id="search-suggestions"
            className="absolute left-0 right-0 top-12 z-[60] max-h-[75vh] overflow-y-auto rounded-xl border border-line bg-card shadow-xl"
          >
            {/* Loading */}
            {searching && (
              <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted">
                <LoaderCircle size={18} className="animate-spin" />
                Searching LaunchAfrica...
              </div>
            )}

            {/* Error */}
            {!searching && searchError && (
              <div className="px-4 py-5 text-sm text-muted">
                Unable to search right now. Please try again.
              </div>
            )}

            {/* Results */}
            {!searching && !searchError && searchResults && (
              <>
                {!hasResults ? (
                  <div className="px-4 py-6 text-center">
                    <Search size={25} className="mx-auto mb-2 text-muted" />
                    <p className="text-sm font-semibold">No results found</p>
                    <p className="mt-1 text-xs text-muted">
                      Try another keyword.
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {/* Products */}
                    {searchResults.products.length > 0 && (
                      <section>
                        <p className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted">
                          Products
                        </p>

                        {searchResults.products.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => openSearchResult(product.title)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover"
                          >
                            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-input">
                              {product.logo_url ? (
                                <Image
                                  src={product.logo_url}
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Search size={16} className="text-muted" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {product.title}
                              </p>
                              <p className="truncate text-xs text-muted">
                                {product.tagline}
                              </p>
                            </div>
                          </button>
                        ))}
                      </section>
                    )}

                    {/* Categories */}
                    {searchResults.categories.length > 0 && (
                      <section className="mt-2 border-t border-line pt-2">
                        <p className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted">
                          Categories
                        </p>

                        {searchResults.categories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => openSearchResult(category.name)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover"
                          >
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hover text-sm font-bold">
                              {category.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {category.name}
                              </p>
                              <p className="truncate text-xs text-muted">
                                {category.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </section>
                    )}

                    {/* Builders */}
                    {searchResults.builders.length > 0 && (
                      <section className="mt-2 border-t border-line pt-2">
                        <p className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted">
                          Builders
                        </p>

                        {searchResults.builders.map((builder) => (
                          <button
                            key={builder.id}
                            type="button"
                            onClick={() =>
                              openSearchResult(
                                builder.display_name || builder.username,
                              )
                            }
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover"
                          >
                            <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-main text-sm font-bold text-black">
                              {builder.avatar_url ? (
                                <Image
                                  src={builder.avatar_url}
                                  alt=""
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              ) : (
                                (builder.display_name || builder.username)
                                  .charAt(0)
                                  .toUpperCase()
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {builder.display_name || builder.username}
                              </p>
                              <p className="truncate text-xs text-muted">
                                @{builder.username}
                              </p>
                            </div>
                          </button>
                        ))}
                      </section>
                    )}
                  </div>
                )}

                {/* View all results */}
                <button
                  type="button"
                  onClick={() => handleSearchFromDropdown()}
                  className="w-full border-t border-line px-4 py-3 text-center text-sm font-semibold text-main hover:bg-hover"
                >
                  View all results for "{query}"
                </button>
              </>
            )}

            {/* Query is too short */}
            {!searching && !searchError && !searchResults && (
              <p className="px-4 py-4 text-sm text-muted">
                Keep typing to search products, categories, and builders.
              </p>
            )}
          </div>
        )}
      </form>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {/* Theme */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="flex size-10 items-center justify-center rounded-full bg-hover transition-colors hover:bg-hover/70"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Create product */}
        <Link
          href="/products/new"
          className="hidden h-10 items-center gap-2 rounded-full bg-hover px-3 text-sm font-semibold hover:bg-hover/70 lg:inline-flex"
        >
          <Plus size={20} />
          Create
        </Link>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-10 items-center justify-center rounded-full hover:bg-hover"
        >
          <Bell size={21} />
        </button>

        {/* User profile */}
        {checkingUser ? (
          <div
            aria-label="Loading user profile"
            className="size-9 shrink-0 animate-pulse rounded-full bg-hover sm:size-10"
          />
        ) : (
          <Link
            href={user ? "/profile" : "/login"}
            title={user?.username || user?.email || "Sign in"}
            aria-label={user ? "Open user profile" : "Sign in"}
            className="group relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-main text-sm font-bold text-black shadow-sm transition-all duration-200 hover:scale-105 hover:ring-2 hover:ring-main/50 sm:size-10"
          >
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={`${user.username} profile`}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : user ? (
              <span className="select-none">{initial}</span>
            ) : (
              <UserRound size={20} />
            )}
          </Link>
        )}
      </div>
    </header>
  );

  function handleSearchFromDropdown() {
    if (!query) return;

    setShowSuggestions(false);
    setMobileSearchOpen(false);

    router.push(`/search?q=${encodeURIComponent(query)}`);
  }
}
