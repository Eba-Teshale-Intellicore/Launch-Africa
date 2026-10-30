"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  X,
} from "lucide-react";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleSidebar: () => void;
  onCloseMobileMenu: () => void;
};

const mainNavigation = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Products", href: "/products", icon: Rocket },
  { label: "Categories", href: "/categories", icon: Layers },
];

const builderNavigation = [
  { label: "Launch a Product", href: "/products/new", icon: PlusIcon },
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

import { Plus as PlusIcon } from "lucide-react";

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobileMenu,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const renderNavigation = (items: typeof mainNavigation, title: string) => (
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

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobileMenu}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-5 rounded-xl px-3 py-2 text-sm transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-hover font-semibold text-primary"
                  : "text-secondary hover:bg-hover hover:text-primary"
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />

              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onCloseMobileMenu}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        id="main-sidebar"
        aria-label="Main sidebar"
        className={`fixed bottom-0 left-0 top-16 z-50 flex flex-col overflow-y-auto border-r border-line bg-card px-3 transition-all duration-200 md:sticky md:top-16 md:z-30 md:h-[calc(100vh-4rem)] ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen
            ? "!w-72 translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Mobile close */}
        <div className="flex h-12 items-center justify-between md:hidden">
          <span className="font-bold">Navigation</span>
          <button
            type="button"
            onClick={onCloseMobileMenu}
            aria-label="Close navigation"
          >
            <X size={21} />
          </button>
        </div>

        {renderNavigation(mainNavigation, "Discover")}

        {renderNavigation(builderNavigation, "Builder Studio")}

        {renderNavigation(personalNavigation, "Your Library")}

        <div className="mt-auto">
          {renderNavigation(bottomNavigation, "More")}

          {!collapsed && (
            <div className="px-3 py-5 text-xs leading-5 text-muted">
              <p className="font-bold">LaunchAfrica</p>
              <p>Discover. Build. Launch.</p>
              <p className="mt-3">© 2026 LaunchAfrica</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
