"use client";

import ProductList from "@/components/products/ProductList";
import { useCurrentUser } from "@/src/hooks/useCategory";
import { useToast } from "@/components/toast/ToastProvider";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const { showToast } = useToast();
  const router = useRouter();

  // Create product: authentication required.
  const handleCreateProduct = () => {
    if (isLoading) {
      showToast("Please wait while we verify your account.", "info");
      return;
    }

    if (!user) {
      showToast(
        "Please log in to launch your product on LaunchAfrica.",
        "info",
      );
      return;
    }

    router.push("/products/new");
  };

  return (
    <main className="bg-page min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
      <div className="w-page mx-auto space-y-8">
        <header className="mx-auto max-w-4xl text-center">
          <p className="text-soft mb-5 text-xs font-bold uppercase tracking-[0.2em]">
            Discover African innovation
          </p>

          <h1 className="text-logo text-3xl font-black tracking-tight sm:text-6xl">
            Discover
            <span className="text-logo2"> Products</span>
            <br />
            Built for Africa
          </h1>

          <p className="text-soft mx-auto mt-6 max-w-3xl text-md leading-7">
            Explore innovative products, discover emerging startups, and connect
            with the builders shaping Africa&apos;s future.
          </p>

          {/* CREATE PRODUCT */}
          <button
            type="button"
            onClick={handleCreateProduct}
            disabled={isLoading}
            className={`btn-main rounded-pill mt-8 inline-flex px-6 py-3 transition-opacity ${
              isLoading ? "cursor-wait opacity-60" : "hover:opacity-90"
            }`}
          >
            {isLoading
              ? "Checking account..."
              : user
                ? "Launch a product"
                : "Launch a product"}
          </button>
        </header>

        {/* PRODUCT DISCOVERY */}
        <section className="mt-12 sm:mt-16">
          <div className="divider mb-8">
            <span className="text-soft text-xs font-semibold tracking-[0.16em]">
              EXPLORE PRODUCTS
            </span>
          </div>

          <ProductList />
        </section>

        {/* FOOTER */}
        <footer className="text-soft mt-16 border-t border-[var(--line)] pt-6 text-center text-xs">
          Discover. Build. Launch. Grow.
        </footer>
      </div>
    </main>
  );
}
