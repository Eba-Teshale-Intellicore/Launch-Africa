export default function MainPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
          LAUNCHAFRICA
        </p>

        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Discover African projects. Build what comes next.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          Explore innovative projects, discover African builders, and share what
          you are creating with the community.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/products/"
            className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-gray-950 hover:bg-amber-400"
          >
            Explore projects
          </a>

          <a
            href="/register"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold hover:bg-white"
          >
            Join the community
          </a>
        </div>

        <section className="mt-16 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold">Made by African builders</h2>
          <p className="mt-3 text-gray-600">
            Project discovery and launches are coming together here.
          </p>
        </section>
      </div>
    </main>
  );
}
