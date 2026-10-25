"use client";

import { useEffect, useState } from "react";

import CreateCategoryForm from "@/components/categories/CreateCategoryForm";
import CategoryList from "@/components/categories/CategoryList";
import { useCurrentUser } from "@/src/hooks/useCategory";
import { getAccessToken } from "@/src/lib/auth-session";

export default function CategoriesPage() {
  const { data: currentUser, isFetching, isError } = useCurrentUser();

  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasSession(Boolean(getAccessToken()));
      setHasCheckedSession(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const isAdmin = Boolean(
    currentUser &&
    currentUser.is_active !== false &&
    (currentUser.is_staff ||
      currentUser.is_superuser ||
      currentUser.role === "admin"),
  );

  const checkingAuth = !hasCheckedSession || (hasSession && isFetching);

  return (
    <main className="bg-page min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
      <div className="w-page mx-auto">
        <header className="mx-auto max-w-4xl text-center">
          <p className="text-soft mb-5 text-xs font-bold uppercase tracking-[0.2em]">
            Explore the ecosystem
          </p>

          <h1 className="text-logo text-3xl font-black tracking-tight sm:text-5xl leading-14">
            Discover
            <span className="text-logo2"> African</span>
            <br />
            Products by Sector
          </h1>

          <p className="text-soft mx-auto mt-8 max-w-3xl text-md leading-7 sm:text-base">
            Explore the sectors shaping Africa&apos;s future. Discover
            innovative products, meet builders, and find ideas across finance,
            agriculture, education, technology, and creative industries.
          </p>
        </header>
        <section className="mt-12 sm:mt-16">
          <div className="divider mb-8">
            <span className="text-soft text-xs font-semibold tracking-[0.16em]">
              EXPLORE CATEGORIES
            </span>
          </div>

          {checkingAuth && (
            <p role="status" className="text-soft mb-6 text-center text-sm">
              Checking your account...
            </p>
          )}

          {hasSession && isError && (
            <p role="status" className="text-soft mb-6 text-center text-sm">
              Your account could not be verified. Administrator controls are
              hidden until you sign in again.
            </p>
          )}

          {isAdmin && !checkingAuth && (
            <div className="mb-10">
              <CreateCategoryForm />
            </div>
          )}

          <CategoryList isAdmin={isAdmin && !checkingAuth} />
        </section>
        <footer className="text-soft mt-16 border-t border-[var(--line)] pt-6 text-center text-xs">
          Discover. Build. Launch. Grow.
        </footer>
      </div>
    </main>
  );
}
