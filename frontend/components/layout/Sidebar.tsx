"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/src/hooks/useCategory";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobileMenu: () => void;
};

const navigation = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Products", href: "/products", icon: "▦" },
  { label: "Categories", href: "/categories", icon: "◫" },
  { label: "Launch a Product", href: "/products/new", icon: "+" },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobileMenu,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: user, isPending: checkingUser } = useCurrentUser();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const initials = (user?.username || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onCloseMobileMenu}
          className="fixed inset-x-0 bottom-0 top-16 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        id="main-sidebar"
        aria-label="Application sidebar"
        aria-hidden={!mobileOpen && undefined}
        className={[
          "fixed bottom-0 left-0 top-16 z-40 flex flex-col",
          "w-72 border-r border-line bg-card p-3 shadow-xl",
          "transition-[width,transform] duration-200",
          "md:sticky md:top-20 md:z-30",
          "md:h-[calc(100vh-5rem)] md:shrink-0 md:shadow-none",
          "md:translate-x-0",
          collapsed ? "md:w-20" : "md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          mobileOpen ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="flex flex-1 flex-col gap-2 overflow-y-auto"
        >
          {navigation.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                onClick={onCloseMobileMenu}
                className={[
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3",
                  "transition-colors",
                  collapsed ? "md:justify-center" : "",
                  active ? "btn-main font-semibold" : "btn-soft",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex w-6 shrink-0 justify-center text-lg"
                >
                  {item.icon}
                </span>

                <span
                  className={`truncate text-sm ${collapsed ? "md:hidden" : ""}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Account */}
        <div className="mt-4 shrink-0 border-t border-line pt-4">
          {!checkingUser &&
            (user ? (
              <Link
                href="/profile"
                title={
                  collapsed
                    ? user.username || user.email || "Profile"
                    : undefined
                }
                aria-label={
                  collapsed
                    ? user.username || user.email || "Open profile"
                    : undefined
                }
                onClick={onCloseMobileMenu}
                className={[
                  "btn-soft flex min-h-12 items-center gap-3 rounded-xl p-2",
                  collapsed ? "md:justify-center" : "",
                ].join(" ")}
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line font-semibold">
                  {initials}
                </span>

                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    collapsed ? "md:hidden" : ""
                  }`}
                >
                  {user.username || user.email}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                title={collapsed ? "Login" : undefined}
                onClick={onCloseMobileMenu}
                className={[
                  "btn-main flex min-h-11 items-center gap-3 rounded-pill px-3 py-2",
                  collapsed ? "md:justify-center" : "",
                ].join(" ")}
              >
                <span aria-hidden="true">↪</span>

                <span className={`text-sm ${collapsed ? "md:hidden" : ""}`}>
                  Login
                </span>
              </Link>
            ))}
        </div>
      </aside>
    </>
  );
}
