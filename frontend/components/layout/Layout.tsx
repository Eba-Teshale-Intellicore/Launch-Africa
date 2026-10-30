"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-primary">
      <Header
        onToggleSidebar={() => setCollapsed((previous) => !previous)}
        onToggleMobileMenu={() => setMobileOpen((previous) => !previous)}
      />

      <div className="flex min-h-screen pt-16">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleSidebar={() => setCollapsed((previous) => !previous)}
          onCloseMobileMenu={() => setMobileOpen(false)}
        />

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
