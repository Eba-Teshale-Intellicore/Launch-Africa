// frontend/
// ├── app/
// │   ├── layout.tsx
// │   ├── page.tsx
// │   ├── globals.scss
// │   │
// │   ├── (public)/
// │   │   ├── layout.tsx
// │   │   ├── explore/
// │   │   │   └── page.tsx
// │   │   ├── products/
// │   │   │   ├── page.tsx
// │   │   │   └── [slug]/
// │   │   │       └── page.tsx
// │   │   ├── categories/
// │   │   │   └── page.tsx
// │   │   ├── login/
// │   │   │   └── page.tsx
// │   │   └── register/
// │   │       └── page.tsx
// │   │
// │   └── admin/
// │       ├── layout.tsx
// │       ├── page.tsx
// │       ├── users/
// │       │   └── page.tsx
// │       ├── products/
// │       │   └── page.tsx
// │       ├── categories/
// │       │   └── page.tsx
// │       └── settings/
// │           └── page.tsx
// │
// ├── components/
// │   ├── ui/
// │   ├── layout/
// │   ├── auth/
// │   ├── products/
// │   ├── categories/
// │   ├── search/
// │   └── admin/
// │
// ├── src/
// │   ├── types/
// │   ├── providers/
// │   ├── hooks/
// │   └── lib/
// │
// ├── styles/
// │   ├── design-tokens.scss
// │   └── roots.scss
// │
// ├── public/
// ├── package.json
// ├── tsconfig.json
// └── next.config.ts
// app/layout.tsx
//     ├── Global fonts and metadata
//     ├── globals.scss
//     ├── TanStack Query provider
//     │
//     ├── (public)/layout.tsx
//     │     ├── Public Header
//     │     ├── Public page content
//     │     └── Public Footer
//     │
//     └── admin/layout.tsx
//           ├── Admin Sidebar
//           ├── Admin Header
//           └── Admin page content
const stats = [
  { label: "Total Users", value: "—" },
  { label: "Projects", value: "—" },
  { label: "Categories", value: "—" },
  { label: "Pending Reviews", value: "—" },
];

export default function AdminPage() {
  return (
    <section>
      <div className="mb-8">
        <p className="mb-2 text-sm text-[#F0AF03]">PLATFORM OVERVIEW</p>

        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

        <p className="mt-2 text-sm text-white/60">
          Monitor activity and manage the LaunchAfrica platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-white/10 bg-[#1C1C1C] p-5"
          >
            <p className="text-sm text-white/60">{stat.label}</p>
            <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-[#1C1C1C] p-6">
        <h3 className="text-lg font-semibold">Getting started</h3>
        <p className="mt-2 text-sm text-white/60">
          Connect the dashboard to your Django API to load real platform
          statistics and manage submissions.
        </p>
      </div>
    </section>
  );
}
