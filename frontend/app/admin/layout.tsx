import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard | LaunchAfrica",
    template: "%s | LaunchAfrica Admin",
  },
};

const adminLinks = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[#141414] text-white">
      <aside className="w-64 shrink-0 border-r border-white/10 p-5">
        <Link
          href="/admin"
          className="text-xl font-bold tracking-tight text-[#F0AF03]"
        >
          LAUNCHAFRICA
        </Link>

        <p className="mb-8 mt-2 text-xs uppercase tracking-widest text-white/40">
          Administration
        </p>

        <nav aria-label="Admin navigation" className="space-y-2">
          {adminLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 border-t border-white/10 pt-5">
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            ← Back to website
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between border-b border-white/10 px-6">
          <h1 className="text-sm font-semibold">Admin Workspace</h1>
          <span className="text-xs text-white/50">Platform Management</span>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
