import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import pool from '../../../../lib/db';

type TicketDetailRow = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    category: string;
    created_at: string;
    opened_at: string | null;
    due_at: string | null;
    resolved_at: string | null;
    location_name: string;
    tenant_name: string;
    tenant_slug: string;
    vendor_id: string | null;
    vendor_name: string | null;
    vendor_category: string | null;
    asset_id: string | null;
    asset_name: string | null;
    asset_type: string | null;
};

type VendorRow = {
    id: string;
    name: string;
    category: string | null;
};

type TicketUpdateRow = {
    id: string;
    update_type: string;
    note: string | null;
    created_by: string | null;
    created_at: string;
};

function formatDate(value: string | null) {
    if (!value) return '—';
    return new Date(value).toLocaleString();
}

function badgeClasses(value: string) {
    const normalized = value.toLowerCase();

    if (normalized === 'critical') {
        return 'bg-red-100 text-red-800 ring-red-200';
    }

    if (
        normalized === 'high' ||
        normalized === 'in_progress' ||
        normalized === 'in progress'
    ) {
        return 'bg-amber-100 text-amber-800 ring-amber-200';
    }

    if (normalized === 'resolved' || normalized === 'closed') {
        return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
    }

    if (normalized === 'vendor_assigned' || normalized === 'scheduled') {
        return 'bg-blue-100 text-blue-800 ring-blue-200';
    }

    return 'bg-slate-100 text-slate-700 ring-slate-200';
}

const statusOptions = [
    'open',
    'vendor_assigned',
    'scheduled',
    'in_progress',
    'resolved',
    'closed',
];

export default async function TicketDetailPage({
    params,
}: {
    params: Promise<{ tenant: string; id: string }>;
}) {
    const { tenant, id } = await params;

    const [ticketResult, vendorsResult, updatesResult] = await Promise.all([
        pool.query<TicketDetailRow>(
            `
            SELECT
              tickets.id,
              tickets.title,
              tickets.description,
              tickets.status,
              tickets.priority,
              tickets.category,
              tickets.created_at,
              tickets.opened_at,
              tickets.due_at,
              tickets.resolved_at,
              tickets.vendor_id,
              tickets.asset_id,
              locations.name AS location_name,
              tenants.name AS tenant_name,
              tenants.slug AS tenant_slug,
              vendors.name AS vendor_name,
              vendors.category AS vendor_category,
              assets.name AS asset_name,
              assets.asset_type AS asset_type
            FROM tickets
            JOIN locations
              ON tickets.location_id = locations.id
            JOIN tenants
              ON tickets.tenant_id = tenants.id
            LEFT JOIN vendors
              ON tickets.vendor_id = vendors.id
            LEFT JOIN assets
              ON tickets.asset_id = assets.id
            WHERE tenants.slug = $1
              AND tickets.id = $2
            LIMIT 1
            `,
            [tenant, id]
        ),
        pool.query<VendorRow>(
            `
            SELECT id, name, category
            FROM vendors
            WHERE tenant_id = (
              SELECT id
              FROM tenants
              WHERE slug = $1
              LIMIT 1
            )
              AND active = TRUE
            ORDER BY category ASC NULLS LAST, name ASC
            `,
            [tenant]
        ),
        pool.query<TicketUpdateRow>(
            `
            SELECT
              id,
              update_type,
              note,
              created_by,
              created_at
            FROM ticket_updates
            WHERE ticket_id = $1
            ORDER BY created_at DESC
            `,
            [id]
        ),
    ]);

    const ticket = ticketResult.rows[0];

    if (!ticket) {
        notFound();
    }

    const vendors: VendorRow[] = vendorsResult.rows;
    const updates: TicketUpdateRow[] = updatesResult.rows;

    async function updateTicketStatus(formData: FormData) {
        'use server';

        const newStatus = String(formData.get('status') ?? '').trim();

        if (!statusOptions.includes(newStatus)) {
            throw new Error('Invalid status value.');
        }

        await pool.query(
            `
            UPDATE tickets
            SET
              status = $1,
              resolved_at = CASE
                WHEN $2::text IN ('resolved', 'closed') AND resolved_at IS NULL THEN NOW()
                WHEN $3::text NOT IN ('resolved', 'closed') THEN NULL
                ELSE resolved_at
              END
            WHERE id = $4
            `,
            [newStatus, newStatus, newStatus, ticket.id]
        );

        await pool.query(
            `
            INSERT INTO ticket_updates (
              ticket_id,
              update_type,
              note,
              created_by
            )
            VALUES (
              $1,
              'status_change',
              $2,
              'System'
            )
            `,
            [ticket.id, `Status changed to ${newStatus}.`]
        );

        revalidatePath(`/${ticket.tenant_slug}/dashboard`);
        revalidatePath(`/${ticket.tenant_slug}/tickets`);
        revalidatePath(`/${ticket.tenant_slug}/tickets/${ticket.id}`);

        redirect(`/${ticket.tenant_slug}/tickets/${ticket.id}`);
    }

    async function updateTicketVendor(formData: FormData) {
        'use server';

        const vendorId = String(formData.get('vendor_id') ?? '').trim();

        if (vendorId === '') {
            await pool.query(
                `
                UPDATE tickets
                SET vendor_id = NULL
                WHERE id = $1
                `,
                [ticket.id]
            );

            await pool.query(
                `
                INSERT INTO ticket_updates (
                  ticket_id,
                  update_type,
                  note,
                  created_by
                )
                VALUES (
                  $1,
                  'vendor_unassigned',
                  'Vendor assignment cleared.',
                  'System'
                )
                `,
                [ticket.id]
            );
        } else {
            const vendorCheck = await pool.query<{ id: string; name: string }>(
                `
                SELECT vendors.id, vendors.name
                FROM vendors
                JOIN tenants ON vendors.tenant_id = tenants.id
                WHERE vendors.id = $1
                  AND tenants.slug = $2
                LIMIT 1
                `,
                [vendorId, ticket.tenant_slug]
            );

            const validVendor = vendorCheck.rows[0];

            if (!validVendor) {
                throw new Error('Invalid vendor selection.');
            }

            await pool.query(
                `
                UPDATE tickets
                SET vendor_id = $1
                WHERE id = $2
                `,
                [vendorId, ticket.id]
            );

            await pool.query(
                `
                INSERT INTO ticket_updates (
                  ticket_id,
                  update_type,
                  note,
                  created_by
                )
                VALUES (
                  $1,
                  'vendor_assigned',
                  $2,
                  'System'
                )
                `,
                [ticket.id, `Vendor assigned: ${validVendor.name}.`]
            );
        }

        revalidatePath(`/${ticket.tenant_slug}/dashboard`);
        revalidatePath(`/${ticket.tenant_slug}/tickets`);
        revalidatePath(`/${ticket.tenant_slug}/tickets/${ticket.id}`);

        redirect(`/${ticket.tenant_slug}/tickets/${ticket.id}`);
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
                    <Link
                        href="/"
                        className="font-medium text-slate-500 hover:text-slate-900"
                    >
                        Businesses
                    </Link>

                    <span className="text-slate-400">/</span>

                    <Link
                        href={`/${ticket.tenant_slug}/dashboard`}
                        className="font-medium text-slate-500 hover:text-slate-900"
                    >
                        {ticket.tenant_name}
                    </Link>

                    <span className="text-slate-400">/</span>

                    <Link
                        href={`/${ticket.tenant_slug}/tickets`}
                        className="font-medium text-slate-500 hover:text-slate-900"
                    >
                        Tickets
                    </Link>

                    <span className="text-slate-400">/</span>

                    <span className="font-medium text-slate-900">{ticket.title}</span>
                </div>

                <header className="mb-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Ticket Detail
                            </p>

                            <h1 className="text-3xl font-bold tracking-tight">
                                {ticket.title}
                            </h1>

                            <p className="mt-3 text-sm text-slate-500">
                                Ticket ID:{' '}
                                <span className="font-medium text-slate-700">{ticket.id}</span>
                            </p>

                            <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                                <p className="text-sm font-medium text-slate-500">Description</p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                    {ticket.description ?? 'No description provided.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${badgeClasses(
                                    ticket.status
                                )}`}
                            >
                                {ticket.status}
                            </span>

                            <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${badgeClasses(
                                    ticket.priority
                                )}`}
                            >
                                {ticket.priority}
                            </span>
                        </div>
                    </div>
                </header>

                <section className="mb-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <h2 className="mb-4 text-xl font-semibold">Update Status</h2>

                        <form
                            action={updateTicketStatus}
                            className="flex flex-col gap-4 sm:flex-row sm:items-end"
                        >
                            <div className="w-full max-w-xs">
                                <label
                                    htmlFor="status"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Status
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    defaultValue={ticket.status}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
                                >
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                            >
                                Update Status
                            </button>
                        </form>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <h2 className="mb-4 text-xl font-semibold">Assign Vendor</h2>

                        <form
                            action={updateTicketVendor}
                            className="flex flex-col gap-4 sm:flex-row sm:items-end"
                        >
                            <div className="w-full max-w-xs">
                                <label
                                    htmlFor="vendor_id"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Vendor
                                </label>
                                <select
                                    id="vendor_id"
                                    name="vendor_id"
                                    defaultValue={ticket.vendor_id ?? ''}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
                                >
                                    <option value="">Unassigned</option>
                                    {vendors.map((vendor) => (
                                        <option key={vendor.id} value={vendor.id}>
                                            {vendor.name}
                                            {vendor.category ? ` — ${vendor.category}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                            >
                                Save Vendor
                            </button>
                        </form>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <h2 className="mb-4 text-xl font-semibold">Ticket Information</h2>

                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-slate-500">Category</dt>
                                <dd className="mt-1 text-base text-slate-900">
                                    {ticket.category}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">Location</dt>
                                <dd className="mt-1 text-base text-slate-900">
                                    {ticket.location_name}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">Asset</dt>
                                <dd className="mt-1 text-base text-slate-900">
                                    {ticket.asset_name
                                        ? `${ticket.asset_name}${ticket.asset_type ? ` (${ticket.asset_type})` : ''
                                        }`
                                        : 'No asset linked'}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">Vendor</dt>
                                <dd className="mt-1 text-base text-slate-900">
                                    {ticket.vendor_name ?? 'Unassigned'}
                                    {ticket.vendor_category
                                        ? ` — ${ticket.vendor_category}`
                                        : ''}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">Status</dt>
                                <dd className="mt-1 text-base text-slate-900">{ticket.status}</dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">Priority</dt>
                                <dd className="mt-1 text-base text-slate-900">
                                    {ticket.priority}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <h2 className="mb-4 text-xl font-semibold">Timeline</h2>

                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-slate-500">Created</dt>
                                <dd className="mt-1 text-base text-slate-900">
                                    {formatDate(ticket.created_at)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">Opened</dt>
                                <dd className="mt-1 text-base text-slate-900">
                                    {formatDate(ticket.opened_at)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">Due</dt>
                                <dd className="mt-1 text-base text-slate-900">
                                    {formatDate(ticket.due_at)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">Resolved</dt>
                                <dd className="mt-1 text-base text-slate-900">
                                    {formatDate(ticket.resolved_at)}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold">Activity Timeline</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Recorded updates and workflow activity for this ticket.
                        </p>
                    </div>

                    {updates.length === 0 ? (
                        <p className="text-sm text-slate-500">No activity recorded yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {updates.map((update) => (
                                <div
                                    key={update.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                                                {update.update_type}
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">
                                                {update.created_by ?? 'Unknown'}
                                            </span>
                                        </div>

                                        <span className="text-xs text-slate-500">
                                            {formatDate(update.created_at)}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-slate-700">
                                        {update.note ?? 'No note provided.'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="mt-8">
                    <Link
                        href={`/${ticket.tenant_slug}/tickets`}
                        className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                        Back to Tickets
                    </Link>
                </div>
            </div>
        </main>
    );
}