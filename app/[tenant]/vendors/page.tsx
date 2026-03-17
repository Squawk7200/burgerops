import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '../../../lib/db';

type TenantRow = {
    id: string;
    name: string;
    slug: string;
};

type VendorRow = {
    id: string;
    name: string;
    category: string | null;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    sla_level: string | null;
    active: boolean;
    ticket_count: string;
    open_ticket_count: string;
    work_order_count: string;
};

export default async function VendorsPage({
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

    const vendorsResult = await pool.query<VendorRow>(
        `
    SELECT
      v.id,
      v.name,
      v.category,
      v.contact_name,
      v.email,
      v.phone,
      v.sla_level,
      v.active,
      COUNT(DISTINCT tk.id) AS ticket_count,
      COUNT(DISTINCT CASE
        WHEN tk.status NOT IN ('resolved', 'closed') THEN tk.id
      END) AS open_ticket_count,
      COUNT(DISTINCT wo.id) AS work_order_count
    FROM vendors v
    LEFT JOIN tickets tk ON tk.vendor_id = v.id
    LEFT JOIN work_orders wo ON wo.vendor_id = v.id
    WHERE v.tenant_id = $1
    GROUP BY
      v.id,
      v.name,
      v.category,
      v.contact_name,
      v.email,
      v.phone,
      v.sla_level,
      v.active
    ORDER BY v.name ASC
    `,
        [tenantRow.id]
    );

    const vendors = vendorsResult.rows;

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
                        Vendors
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
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
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
                        <h2 className="text-2xl font-semibold">Vendor Directory</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Suppliers and service partners for {tenantRow.name}.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Vendor
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Category
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Contact
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        SLA
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Active
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Open Tickets
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Total Tickets
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Work Orders
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                            <div>{vendor.name}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {vendor.email ?? '—'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {vendor.category ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            <div>{vendor.contact_name ?? '—'}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {vendor.phone ?? '—'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {vendor.sla_level ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {vendor.active ? 'Yes' : 'No'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {vendor.open_ticket_count}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {vendor.ticket_count}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {vendor.work_order_count}
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
