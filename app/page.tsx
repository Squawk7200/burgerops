import Link from 'next/link';
import pool from '../lib/db';

type TenantRow = {
  name: string;
  slug: string;
};

export default async function Home() {
  const result = await pool.query<TenantRow>(`
    SELECT name, slug
    FROM tenants
    ORDER BY name
  `);

  const tenants = result.rows;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Restaurant Operations CRM
          </p>
          <h1 className="text-4xl font-bold tracking-tight">BurgerOps</h1>
          <p className="mt-3 text-lg text-slate-600">
            Because grills break and buns explode.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
            A Salesforce-style SaaS demo for burger and hotdog businesses.
            Manage locations, vendors, assets, and operational incidents across
            multiple restaurant brands.
          </p>
        </header>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Demo Businesses</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a business to enter its dashboard.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {tenants.map((tenant) => (
              <div
                key={tenant.slug}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <h3 className="text-xl font-semibold">{tenant.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Multi-location restaurant operations demo
                </p>

                <div className="mt-5">
                  <Link
                    href={`/${tenant.slug}/dashboard`}
                    className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Open Dashboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}