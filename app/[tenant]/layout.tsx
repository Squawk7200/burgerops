import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '../../lib/db';

type TenantRow = {
    id: string;
    name: string;
    slug: string;
};

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenant: string }>;
}) {
    const { tenant } = await params;

    const tenantResult = await pool.query<TenantRow>(
        `
    SELECT id, name, slug
    FROM tenants
    WHERE slug = $1
    LIMIT 1
    `,
        [tenant]
    );

    const tenantRow = tenantResult.rows[0];

    if (!tenantRow) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-6">
                    <Link
                        href="/"
                        className="text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                        ← Back to businesses
                    </Link>
                </div>

                <header className="mb-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Restaurant Operations CRM
                    </p>
                    <h1 className="text-4xl font-bold tracking-tight">{tenantRow.name}</h1>
                    <p className="mt-3 text-lg text-slate-600">
                        Because grills break and buns explode.
                    </p>

                    <nav className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href={`/${tenantRow.slug}/dashboard`}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href={`/${tenantRow.slug}/locations`}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                        >
                            Locations
                        </Link>
                        <Link
                            href={`/${tenantRow.slug}/vendors`}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                        >
                            Vendors
                        </Link>
                        <Link
                            href={`/${tenantRow.slug}/tickets`}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                        >
                            Tickets
                        </Link>
                    </nav>
                </header>

                {children}
            </div>
        </main>
    );
}