import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '../../../lib/db';

type TenantRow = {
    id: string;
    name: string;
    slug: string;
};

type CountRow = {
    count: string;
};

type CategoryRow = {
    category: string;
    count: string;
};

type TicketRow = {
    id: string;
    title: string;
    status: string;
    priority: string;
    category: string;
    created_at: string;
    due_at: string | null;
    resolved_at: string | null;
    location_name: string;
};

function formatDate(value: string | null) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
}

export default async function TenantDashboard({
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

    const [
        openTicketsResult,
        criticalTicketsResult,
        overdueTicketsResult,
        closedTicketsResult,
        locationsResult,
        vendorsResult,
        recentTicketsResult,
        categoriesResult,
    ] = await Promise.all([
        pool.query<CountRow>(
            `
      SELECT COUNT(*) AS count
      FROM tickets
      WHERE tenant_id = $1
        AND status NOT IN ('resolved', 'closed')
      `,
            [tenantRow.id]
        ),
        pool.query<CountRow>(
            `
      SELECT COUNT(*) AS count
      FROM tickets
      WHERE tenant_id = $1
        AND priority = 'critical'
      `,
            [tenantRow.id]
        ),
        pool.query<CountRow>(
            `
      SELECT COUNT(*) AS count
      FROM tickets
      WHERE tenant_id = $1
        AND due_at IS NOT NULL
        AND due_at < NOW()
        AND status NOT IN ('resolved', 'closed')
      `,
            [tenantRow.id]
        ),
        pool.query<CountRow>(
            `
      SELECT COUNT(*) AS count
      FROM tickets
      WHERE tenant_id = $1
        AND status IN ('resolved', 'closed')
      `,
            [tenantRow.id]
        ),
        pool.query<CountRow>(
            `
      SELECT COUNT(*) AS count
      FROM locations
      WHERE tenant_id = $1
      `,
            [tenantRow.id]
        ),
        pool.query<CountRow>(
            `
      SELECT COUNT(*) AS count
      FROM vendors
      WHERE tenant_id = $1
      `,
            [tenantRow.id]
        ),
        pool.query<TicketRow>(
            `
      SELECT
        tickets.id,
        tickets.title,
        tickets.status,
        tickets.priority,
        tickets.category,
        tickets.created_at,
        tickets.due_at,
        tickets.resolved_at,
        locations.name AS location_name
      FROM tickets
      JOIN locations ON tickets.location_id = locations.id
      WHERE tickets.tenant_id = $1
      ORDER BY tickets.created_at DESC
      LIMIT 12
      `,
            [tenantRow.id]
        ),
        pool.query<CategoryRow>(
            `
      SELECT category, COUNT(*) AS count
      FROM tickets
      WHERE tenant_id = $1
      GROUP BY category
      ORDER BY COUNT(*) DESC, category ASC
      LIMIT 5
      `,
            [tenantRow.id]
        ),
    ]);

    const openTickets = openTicketsResult.rows[0]?.count ?? '0';
    const criticalTickets = criticalTicketsResult.rows[0]?.count ?? '0';
    const overdueTickets = overdueTicketsResult.rows[0]?.count ?? '0';
    const closedTickets = closedTicketsResult.rows[0]?.count ?? '0';
    const locations = locationsResult.rows[0]?.count ?? '0';
    const vendors = vendorsResult.rows[0]?.count ?? '0';
    const recentTickets = recentTicketsResult.rows;
    const topCategories = categoriesResult.rows;

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
                        Tenant Dashboard
                    </p>
                    <h1 className="text-4xl font-bold tracking-tight">{tenantRow.name}</h1>
                    <p className="mt-3 text-lg text-slate-600">
                        Because grills break and buns explode.
                    </p>

                    <nav className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href={`/${tenantRow.slug}/dashboard`}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
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

                <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Open Tickets</p>
                        <p className="mt-3 text-3xl font-bold">{openTickets}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Critical Tickets</p>
                        <p className="mt-3 text-3xl font-bold">{criticalTickets}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Overdue</p>
                        <p className="mt-3 text-3xl font-bold">{overdueTickets}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Closed / Resolved</p>
                        <p className="mt-3 text-3xl font-bold">{closedTickets}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Locations</p>
                        <p className="mt-3 text-3xl font-bold">{locations}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Vendors</p>
                        <p className="mt-3 text-3xl font-bold">{vendors}</p>
                    </div>
                </section>

                <section className="mb-8 grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
                        <div className="mb-5">
                            <h2 className="text-2xl font-semibold">Recent Incidents</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Latest ticket activity for {tenantRow.name}.
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                            Ticket
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                            Location
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                            Priority
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                            Opened
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                            Due
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {recentTickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                <div>{ticket.title}</div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {ticket.category}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {ticket.location_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {ticket.status}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {ticket.priority}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {formatDate(ticket.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {formatDate(ticket.due_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="mb-5">
                            <h2 className="text-2xl font-semibold">Top Categories</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Most common issue types for this business.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {topCategories.map((category) => (
                                <div
                                    key={category.category}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                                >
                                    <span className="text-sm font-medium text-slate-700">
                                        {category.category}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                                        {category.count}
                                    </span>
                                </div>
                            ))}

                            {topCategories.length === 0 && (
                                <p className="text-sm text-slate-500">No category data found.</p>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}