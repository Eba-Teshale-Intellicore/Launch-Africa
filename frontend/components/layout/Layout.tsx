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

  // Desktop sidebar.
  const handleToggleSidebar = () => {
    setCollapsed((previous) => !previous);
  };

  // Mobile sidebar.
  const handleToggleMobileMenu = () => {
    setMobileOpen((previous) => !previous);
  };

  // Close mobile sidebar.
  const handleCloseMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-primary">
      {/* HEADER */}
      <Header
        onToggleSidebar={handleToggleSidebar}
        onToggleMobileMenu={handleToggleMobileMenu}
      />

      {/* MAIN LAYOUT */}
      <div className="flex min-h-screen pt-16">
        {/* SIDEBAR */}
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobileMenu={handleCloseMobileMenu}
        />

        {/* PAGE CONTENT */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
