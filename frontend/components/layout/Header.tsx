"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/src/hooks/useCategory";

type Theme = "dark" | "light";

type HeaderProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
};

export default function Header({
  collapsed,
  onToggleSidebar,
  onToggleMobileMenu,
}: HeaderProps) {
  const router = useRouter();
  const { data: user, isPending: checkingUser } = useCurrentUser();

  const [theme, setTheme] = useState<Theme>("dark");
  const [search, setSearch] = useState("");

  // Restore the user's saved theme.
  useEffect(() => {
    const saved = window.localStorage.getItem("la-theme");

    const initial: Theme =
      saved === "light" || saved === "dark" ? saved : "dark";

    document.documentElement.setAttribute("data-theme", initial);
    setTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("la-theme", next);
    setTheme(next);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = search.trim();

    if (!query) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const initials = (user?.username || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-card px-3 sm:h-20 sm:gap-4 sm:px-6">
      {/* Brand */}
      <Link
        href="/"
        aria-label="LaunchAfrica home"
        className="text-logo flex shrink-0 items-center gap-2"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line text-sm font-black">
          LA
        </span>

        <span className="hidden text-lg font-black tracking-tight lg:inline">
          LaunchAfrica
        </span>
      </Link>

      {/* Desktop sidebar toggle */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        aria-controls="main-sidebar"
        className="btn-soft hidden size-10 shrink-0 items-center justify-center rounded-lg md:inline-flex"
      >
        <span aria-hidden="true" className="text-xl">
          {collapsed ? "›" : "‹"}
        </span>
      </button>

      {/* Mobile sidebar toggle */}
      <button
        type="button"
        onClick={onToggleMobileMenu}
        aria-label="Open navigation menu"
        aria-controls="main-sidebar"
        className="btn-soft inline-flex size-9 shrink-0 items-center justify-center rounded-lg md:hidden"
      >
        <span aria-hidden="true" className="text-lg">
          ☰
        </span>
      </button>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        role="search"
        className="flex min-w-0 flex-1 justify-center"
      >
        <input
          id="site-search"
          type="search"
          name="q"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          aria-label="Search products and categories"
          className="input-box w-full max-w-2xl rounded-pill px-3 py-2.5 sm:px-4 sm:py-3"
        />
      </form>

      {/* Global actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="btn-soft inline-flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10"
        >
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        </button>

        {!checkingUser &&
          (user ? (
            <Link
              href="/profile"
              title={user.username || user.email || "Profile"}
              aria-label="Open user profile"
              className="btn-soft inline-flex size-9 shrink-0 items-center justify-center rounded-full font-semibold sm:size-10"
            >
              {initials}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-soft rounded-pill px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="btn-main rounded-pill px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
              >
                <span className="hidden sm:inline">Register</span>
                <span className="sm:hidden">Join</span>
              </Link>
            </>
          ))}
      </div>
    </header>
  );
}
