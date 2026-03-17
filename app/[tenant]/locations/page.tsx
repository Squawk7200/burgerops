import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '../../../lib/db';

type TenantRow = {
    id: string;
    name: string;
    slug: string;
};

type LocationRow = {
    id: string;
    name: string;
    city: string;
    state: string;
    address: string | null;
    status: string;
    manager_name: string | null;
    ticket_count: string;
    open_ticket_count: string;
    asset_count: string;
};

export default async function LocationsPage({
    params,
}: {
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

    const locationsResult = await pool.query<LocationRow>(
        `
    SELECT
      l.id,
      l.name,
      l.city,
      l.state,
      l.address,
      l.status,
      l.manager_name,
      COUNT(DISTINCT tk.id) AS ticket_count,
      COUNT(DISTINCT CASE
        WHEN tk.status NOT IN ('resolved', 'closed') THEN tk.id
      END) AS open_ticket_count,
      COUNT(DISTINCT a.id) AS asset_count
    FROM locations l
    LEFT JOIN tickets tk ON tk.location_id = l.id
    LEFT JOIN assets a ON a.location_id = l.id
    WHERE l.tenant_id = $1
    GROUP BY
      l.id,
      l.name,
      l.city,
      l.state,
      l.address,
      l.status,
      l.manager_name
    ORDER BY l.name ASC
    `,
        [tenantRow.id]
    );

    const locations = locationsResult.rows;

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-6">
                    <Link
                        href={`/${tenantRow.slug}/dashboard`}
                        className="text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                        ← Back to dashboard
                    </Link>
                </div>

                <header className="mb-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Locations
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
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
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

                <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="mb-5">
                        <h2 className="text-2xl font-semibold">Store Locations</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Operational overview of locations for {tenantRow.name}.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Location
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        City
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Manager
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Assets
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Open Tickets
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Total Tickets
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {locations.map((location) => (
                                    <tr key={location.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                            <div>{location.name}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {location.address ?? '—'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {location.city}, {location.state}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {location.manager_name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {location.status}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {location.asset_count}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {location.open_ticket_count}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {location.ticket_count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}