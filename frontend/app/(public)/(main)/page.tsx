import Link from "next/link";
import ProductList from "@/components/products/ProductList";
export default function MainPage() {
  return (
    <main className="bg-page min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
      <div className="w-page mx-auto space-y-8">
        <header className="mx-auto max-w-4xl text-center">
          <p className="text-soft mb-5 text-xs font-bold uppercase tracking-[0.2em]">
            LAUNCHAFRICA
          </p>

          <h1 className="text-logo text-3xl font-black tracking-tight sm:text-6xl">
            Discover <span className="text-logo2"> African </span>projects.
            Build
            <br />
            what comes next.
          </h1>

          <p className="text-soft mx-auto mt-6 max-w-3xl text-md leading-7">
            Explore innovative projects, discover African builders, and share
            what you are creating with the community.
          </p>
          <Link
            href="/products/"
            className="btn-main rounded-pill mt-8 inline-flex px-6 py-3 mx-4"
          >
            Explore projects
          </Link>

          <Link
            href="/register"
            className="btn-main rounded-pill mt-8 inline-flex px-6 py-3 mx-4"
          >
            Join the community
          </Link>
        </header>

        <section className="mt-12 sm:mt-16">
          <div className="divider mb-8">
            <span className="text-soft text-xs font-semibold tracking-[0.16em]">
              SOME
            </span>
          </div>

          <h2 className="text-2xl font-bold">Made by African builders</h2>
          <p className="mt-3 text-gray-600 mb-12">
            Project discovery and launches are coming together here.
          </p>

          <ProductList />
        </section>

        <footer className="text-soft mt-16 border-t border-[var(--line)] pt-6 text-center text-xs">
          Discover. Build. Launch. Grow.
        </footer>
      </div>
    </main>
  );
}
