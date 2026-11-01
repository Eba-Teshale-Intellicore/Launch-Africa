"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import {
  Home,
  Compass,
  Rocket,
  FolderKanban,
  Layers,
  Users,
  Trophy,
  Bookmark,
  History,
  Settings,
  CircleHelp,
  MessageSquare,
  Plus,
  LogOut,
  LoaderCircle,
  ChevronRight,
} from "lucide-react";

import { logoutUser } from "@/src/lib/auth";
import { clearAuthSession } from "@/src/lib/auth-session";
import { authKeys, useCurrentUser } from "@/src/hooks/useCategory";
import { useToast } from "@/components/toast/ToastProvider";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobileMenu: () => void;
};

const mainNavigation = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Products", href: "/products", icon: Rocket },
  { label: "Categories", href: "/categories", icon: Layers },
];

const builderNavigation = [
  { label: "Launch a Product", href: "/products/new", icon: Plus },
  { label: "My Projects", href: "/my-projects", icon: FolderKanban },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Community", href: "/community", icon: Users },
];

const personalNavigation = [
  { label: "Saved", href: "/saved", icon: Bookmark },
  { label: "History", href: "/history", icon: History },
  { label: "Discussions", href: "/discussions", icon: MessageSquare },
];

const bottomNavigation = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: CircleHelp },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobileMenu,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { showToast } = useToast();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Current authenticated user.
  const { data: user, isLoading: checkingUser } = useCurrentUser();

  // Active navigation.
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  // Launch a product: authentication required.
  const handleLaunchProduct = () => {
    if (checkingUser) {
      showToast("Please wait while we verify your account.", "info");
      return;
    }

    if (!user) {
      showToast("Please log in to create and launch a product.", "info");
      return;
    }

    // Close mobile sidebar and navigate.
    onCloseMobileMenu();

    router.push("/products/new");
  };

  // Navigation renderer.
  const renderNavigation = (
    items:
      | typeof mainNavigation
      | typeof builderNavigation
      | typeof personalNavigation
      | typeof bottomNavigation,
    title: string,
  ) => (
    <section className="border-b border-line py-3">
      {!collapsed && (
        <h2 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted">
          {title}
        </h2>
      )}

      <div className="space-y-1">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          // Special authentication handling for Launch a Product.
          if (item.href === "/products/new") {
            return (
              <button
                key={item.href}
                type="button"
                onClick={handleLaunchProduct}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`group relative flex min-h-11 w-full items-center gap-5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-hover font-semibold text-primary"
                    : "text-secondary hover:bg-hover hover:text-primary"
                }`}
              >
                {active && (
                  <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-main" />
                )}

                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 1.8}
                  className="shrink-0"
                />

                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>

                    {active && <ChevronRight size={15} className="text-main" />}
                  </>
                )}
              </button>
            );
          }

          // Normal navigation links.
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobileMenu}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`group relative flex min-h-11 items-center gap-5 rounded-xl px-3 py-2 text-sm transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-hover font-semibold text-primary"
                  : "text-secondary hover:bg-hover hover:text-primary"
              }`}
            >
              {active && (
                <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-main" />
              )}

              <Icon
                size={21}
                strokeWidth={active ? 2.5 : 1.8}
                className="shrink-0"
              />

              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>

                  {active && <ChevronRight size={15} className="text-main" />}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );

  // Secure logout with toast notifications.
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    showToast("Logging out of your LaunchAfrica account...", "info");

    let logoutFailed = false;

    try {
      await logoutUser();
    } catch (error) {
      logoutFailed = true;
      console.error("Logout request failed:", error);
    } finally {
      // Remove local authentication credentials.
      clearAuthSession();

      // Cancel ongoing current-user requests.
      await queryClient.cancelQueries({
        queryKey: authKeys.me,
      });

      // Update authentication state immediately.
      queryClient.setQueryData(authKeys.me, null);

      // Close mobile navigation.
      onCloseMobileMenu();

      // Show logout result.
      if (logoutFailed) {
        showToast(
          "Your session was cleared locally. The server logout request failed.",
          "error",
        );
      } else {
        showToast("You have successfully logged out.", "success");
      }

      // Navigate to login.
      router.replace("/");
      router.refresh();

      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onCloseMobileMenu}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        id="main-sidebar"
        aria-label="Main navigation"
        className={`fixed bottom-0 left-0 top-16 z-50 flex flex-col overflow-y-auto border-r border-line bg-card px-3 transition-all duration-200 md:sticky md:top-16 md:z-30 md:h-[calc(100vh-4rem)] ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen
            ? "!w-72 translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* DISCOVER */}
        {renderNavigation(mainNavigation, "Discover")}

        {/* BUILDER STUDIO */}
        {renderNavigation(builderNavigation, "Builder Studio")}

        {/* YOUR LIBRARY */}
        {renderNavigation(personalNavigation, "Your Library")}

        {/* BOTTOM SECTION */}
        <div className="mt-auto">
          {/* MORE */}
          {renderNavigation(bottomNavigation, "More")}

          {/* ACCOUNT */}
          <section className="border-b border-line py-3">
            {!collapsed && (
              <h2 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted">
                Account
              </h2>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title={collapsed ? "Logout" : undefined}
              aria-label="Logout"
              className={`flex min-h-11 w-full items-center gap-5 rounded-xl px-3 py-2 text-sm text-secondary transition-colors hover:bg-hover hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              {isLoggingOut ? (
                <LoaderCircle size={21} className="animate-spin" />
              ) : (
                <LogOut size={21} />
              )}

              {!collapsed && (
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              )}
            </button>
          </section>

          {/* FOOTER */}
          {!collapsed && (
            <div className="px-3 py-5 text-xs leading-5 text-muted">
              <p className="font-bold text-primary">LaunchAfrica</p>

              <p>Discover. Build. Launch.</p>

              <p className="mt-3">© 2026 LaunchAfrica</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
