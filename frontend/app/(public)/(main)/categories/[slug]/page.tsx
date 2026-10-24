import Link from "next/link";

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-medium text-amber-700 hover:text-amber-800"
        >
          ← Back to home
        </Link>

        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Discover
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Explore projects
            </h1>
            <p className="mt-3 max-w-2xl text-gray-600">
              Discover products, ideas, and innovations created by African
              builders.
            </p>
          </div>

          <Link
            href="/dashboard/products/new"
            className="inline-flex w-fit rounded-lg bg-amber-500 px-5 py-3 font-semibold text-gray-950 hover:bg-amber-400"
          >
            Submit a project
          </Link>
        </div>

        <section className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <h2 className="text-xl font-semibold">
            Your next discovery starts here
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-600">
            Projects will appear here when we connect this page to the
            LAUNCHAFRICA Django API.
          </p>
        </section>
      </div>
    </main>
  );
}
