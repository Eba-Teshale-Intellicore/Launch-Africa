"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Menu,
  Search,
  Plus,
  Bell,
  X,
  Sun,
  Moon,
  LoaderCircle,
  Rocket,
  Layers,
  Users,
} from "lucide-react";

import { useCurrentUser } from "@/src/hooks/useCategory";
import { useGlobalSearch } from "@/src/hooks/useSearch";
import { useToast } from "@/components/toast/ToastProvider";

type HeaderProps = {
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
};

type Theme = "dark" | "light";

const THEME_EVENT = "launchafrica-theme-change";

const subscribeToHydration = () => () => {};

const getHydrationSnapshot = () => true;

const getServerHydrationSnapshot = () => false;

// Theme external store.
function getThemeSnapshot(): Theme {
  try {
    const saved = localStorage.getItem("la-theme");

    return saved === "light" || saved === "dark" ? saved : "dark";
  } catch {
    return "dark";
  }
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

export default function Header({
  onToggleSidebar,
  onToggleMobileMenu,
}: HeaderProps) {
  const router = useRouter();

  const searchContainerRef = useRef<HTMLFormElement>(null);
  const lastNotifiedSearchError = useRef<string | null>(null);

  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Hydration status.
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  // Theme synchronization.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  // Current authenticated user.
  const { data: user, isLoading: checkingUser } = useCurrentUser();

  // Debounce search input.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  // Global search.
  const {
    data: searchResults,
    isFetching: searching,
    error: searchError,
  } = useGlobalSearch(debouncedSearch);

  const query = search.trim();

  const canSearch = query.length >= 2;
  const canShowResults = debouncedSearch.length >= 2;

  const hasResults =
    (searchResults?.products.length ?? 0) > 0 ||
    (searchResults?.categories.length ?? 0) > 0 ||
    (searchResults?.builders.length ?? 0) > 0;

  const showDropdown = showSuggestions && canSearch;

  // Notify user when autocomplete search fails.
  useEffect(() => {
    if (!searchError) {
      lastNotifiedSearchError.current = null;
      return;
    }

    if (
      !showDropdown ||
      !canShowResults ||
      debouncedSearch !== query ||
      searching
    ) {
      return;
    }

    if (lastNotifiedSearchError.current === debouncedSearch) {
      return;
    }

    lastNotifiedSearchError.current = debouncedSearch;

    showToast("Unable to search right now. Please try again.", "error");
  }, [
    searchError,
    showDropdown,
    canShowResults,
    debouncedSearch,
    query,
    searching,
    showToast,
  ]);

  // Close search suggestions when clicking outside.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Theme switcher.
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", next);

    try {
      localStorage.setItem("la-theme", next);
    } catch {
      // Theme remains active for this session.
    }

    window.dispatchEvent(new Event(THEME_EVENT));

    showToast(`Switched to ${next} mode successfully.`, "success");
  };

  // Close search UI.
  const closeSearch = () => {
    setShowSuggestions(false);
    setMobileSearchOpen(false);
  };

  // Submit search.
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSearch) {
      showToast("Please enter at least 2 characters to search.", "info");
      return;
    }

    closeSearch();

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Create product: authentication required.
  const handleCreateProduct = () => {
    if (checkingUser) {
      showToast("Please wait while we verify your account.", "info");
      return;
    }

    if (!user) {
      showToast("Please log in to create and launch a product.", "info");
      return;
    }

    router.push("/products/new");
  };

  // Open product.
  const openProduct = (slug: string) => {
    closeSearch();
    router.push(`/products/${encodeURIComponent(slug)}`);
  };

  // Open category.
  const openCategory = (slug: string) => {
    closeSearch();
    router.push(`/categories/${encodeURIComponent(slug)}`);
  };

  // Open builder.
  const openBuilder = (username: string) => {
    closeSearch();
    router.push(`/builders/${encodeURIComponent(username)}`);
  };

  // User information.
  const fullName =
    user?.display_name?.trim() || user?.username || user?.email || "User";

  const initial = fullName.charAt(0).toUpperCase();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-3 border-b border-line bg-card px-3 sm:px-5">
      {/* LEFT: BRAND AND NAVIGATION */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
          aria-label="LaunchAfrica home"
          className="flex items-center gap-2"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-main text-sm font-black text-black sm:hidden">
            LA
          </span>

          <span className="hidden text-lg font-black tracking-tight sm:block">
            LaunchAfrica
          </span>
        </Link>
      </div>

      {/* CENTER: SEARCH */}
      <form
        ref={searchContainerRef}
        onSubmit={handleSearch}
        role="search"
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeSearch();
          }
        }}
        className={`relative mx-auto max-w-2xl flex-1 ${
          mobileSearchOpen ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="flex h-10 w-full overflow-hidden rounded-full border border-line bg-input transition-colors focus-within:border-main">
          {/* <input
            type="search"
            name="q"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, builders, categories..."
            aria-label="Search LaunchAfrica"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={showDropdown}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted"
          /> */}
          <input
            type="search"
            name="q"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, builders, categories..."
            aria-label="Search LaunchAfrica"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
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
            aria-label="Submit search"
            disabled={!canSearch}
            className="flex w-14 shrink-0 items-center justify-center border-l border-line bg-hover transition-colors hover:bg-hover/70 disabled:opacity-40"
          >
            <Search size={19} />
          </button>
        </div>

        {/* SEARCH AUTOCOMPLETE */}
        {showDropdown && (
          <div
            id="search-suggestions"
            className="absolute left-0 right-0 top-12 z-[60] max-h-[75vh] overflow-y-auto rounded-xl border border-line bg-card shadow-2xl"
          >
            {/* Waiting for debounce */}
            {debouncedSearch !== query && (
              <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted">
                <LoaderCircle size={18} className="animate-spin" />
                Preparing search...
              </div>
            )}

            {/* Loading */}
            {debouncedSearch === query && searching && (
              <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted">
                <LoaderCircle size={18} className="animate-spin" />
                Searching LaunchAfrica...
              </div>
            )}

            {/* Error */}
            {canShowResults &&
              debouncedSearch === query &&
              !searching &&
              searchError && (
                <div className="px-4 py-5 text-sm text-muted">
                  Unable to search right now. Please try again.
                </div>
              )}

            {/* RESULTS */}
            {canShowResults &&
              debouncedSearch === query &&
              !searching &&
              !searchError &&
              searchResults && (
                <>
                  {!hasResults ? (
                    <div className="px-4 py-8 text-center">
                      <Search size={28} className="mx-auto mb-3 text-muted" />

                      <p className="text-sm font-semibold">No results found</p>

                      <p className="mt-1 text-xs text-muted">
                        Try another product, category, or builder.
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {/* PRODUCTS */}
                      {searchResults.products.length > 0 && (
                        <section>
                          <p className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted">
                            <Rocket size={14} />
                            Products
                          </p>

                          {searchResults.products.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => openProduct(product.slug)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover"
                            >
                              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-input">
                                {product.logo_url ? (
                                  <Image
                                    src={product.logo_url}
                                    alt={`${product.title} logo`}
                                    width={112}
                                    height={112}
                                    unoptimized
                                    className="size-full object-contain p-2"
                                  />
                                ) : (
                                  <span className="text-soft text-xs">
                                    No logo
                                  </span>
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

                              <span className="text-xs text-muted">
                                Product
                              </span>
                            </button>
                          ))}
                        </section>
                      )}

                      {/* CATEGORIES */}
                      {searchResults.categories.length > 0 && (
                        <section className="mt-2 border-t border-line pt-2">
                          <p className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted">
                            <Layers size={14} />
                            Categories
                          </p>

                          {searchResults.categories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => openCategory(category.slug)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover"
                            >
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-hover text-sm font-bold">
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

                      {/* BUILDERS */}
                      {searchResults.builders.length > 0 && (
                        <section className="mt-2 border-t border-line pt-2">
                          <p className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted">
                            <Users size={14} />
                            Builders
                          </p>

                          {searchResults.builders.map((builder) => (
                            <button
                              key={builder.id}
                              type="button"
                              onClick={() => openBuilder(builder.username)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover"
                            >
                              <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-main text-sm font-bold text-black">
                                {builder.avatar_url ? (
                                  <Image
                                    src={builder.avatar_url}
                                    alt=""
                                    fill
                                    sizes="40px"
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

                  {/* VIEW ALL RESULTS */}
                  <button
                    type="button"
                    onClick={() => {
                      closeSearch();
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                    }}
                    className="w-full border-t border-line px-4 py-4 text-center text-sm font-semibold text-main transition-colors hover:bg-hover"
                  >
                    View all results for &quot;{query}&quot;
                  </button>
                </>
              )}
          </div>
        )}
      </form>

      {/* MOBILE SEARCH BUTTON */}
      <button
        type="button"
        onClick={() => {
          setMobileSearchOpen((previous) => !previous);
          setShowSuggestions(false);
        }}
        aria-label="Toggle mobile search"
        aria-expanded={mobileSearchOpen}
        className="flex size-10 items-center justify-center rounded-full hover:bg-hover md:hidden"
      >
        {mobileSearchOpen ? <X size={21} /> : <Search size={21} />}
      </button>

      {/* RIGHT: ACTIONS */}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
        {/* THEME */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title="Change theme"
          className="flex size-10 items-center justify-center rounded-full bg-hover transition-colors hover:bg-hover/70"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* CREATE PRODUCT */}
        <button
          type="button"
          onClick={handleCreateProduct}
          disabled={!mounted || checkingUser}
          title="Create a product"
          className="hidden h-10 items-center gap-2 rounded-full bg-hover px-3 text-sm font-semibold transition-colors hover:bg-hover/70 disabled:cursor-wait disabled:opacity-50 lg:inline-flex"
        >
          <Plus size={20} />
          Create
        </button>

        {/* NOTIFICATIONS */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => router.push("/notifications")}
          className="relative flex size-10 items-center justify-center rounded-full hover:bg-hover"
        >
          <Bell size={21} />
        </button>

        {/* AUTHENTICATION */}
        {!mounted || checkingUser ? (
          <div
            aria-label="Loading user profile"
            className="size-9 shrink-0 animate-pulse rounded-full bg-hover sm:size-10"
          />
        ) : user ? (
          <Link
            href="/profile"
            title={user.username || user.email || "My profile"}
            aria-label="Open user profile"
            className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-main text-sm font-bold text-black transition-all hover:ring-2 hover:ring-main/50 sm:size-10"
          >
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <span>{initial}</span>
            )}
          </Link>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-hover sm:px-4"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-main px-3 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 sm:px-4"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
