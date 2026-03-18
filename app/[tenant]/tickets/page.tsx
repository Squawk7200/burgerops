import Link from 'next/link';
import pool from '../../../lib/db';
import { notFound } from 'next/navigation';

type TenantRow = {
    id: string;
    name: string;
    slug: string;
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
    vendor_name: string | null;
};

function formatDate(value: string | null) {
    if (!value) return '—';
    return new Date(value).toISOString().slice(0, 10);
}

export default async function TicketsPage({
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

    const ticketsResult = await pool.query<TicketRow>(
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
      locations.name AS location_name,
      vendors.name AS vendor_name
    FROM tickets
    JOIN locations ON tickets.location_id = locations.id
    LEFT JOIN vendors ON tickets.vendor_id = vendors.id
    WHERE tickets.tenant_id = $1
    ORDER BY tickets.created_at DESC
    `,
        [tenantRow.id]
    );

    const tickets: TicketRow[] = ticketsResult.rows;

    return (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold">Incident Queue</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Open and historical incidents for {tenantRow.name}.
                    </p>
                </div>

                <Link
                    href={`/${tenantRow.slug}/tickets/new`}
                    className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                    New Ticket
                </Link>
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
                                Category
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                Vendor
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
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                Resolved
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                        {tickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                    <Link
                                        href={`/${tenantRow.slug}/tickets/${ticket.id}`}
                                        className="hover:text-slate-700 hover:underline"
                                    >
                                        {ticket.title}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {ticket.location_name}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {ticket.category}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {ticket.vendor_name ?? 'Unassigned'}
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
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {formatDate(ticket.resolved_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}