import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '../../../../lib/db';

type TicketDetailRow = {
    id: string;
    title: string;
    status: string;
    priority: string;
    category: string;
    created_at: string;
    due_at: string | null;
    resolved_at: string | null;
    location_name: string;
    tenant_name: string;
    tenant_slug: string;
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

    return 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default async function TicketDetailPage({
    params,
}: {
    params: Promise<{ tenant: string; id: string }>;
}) {
    const { tenant, id } = await params;

    const result = await pool.query<TicketDetailRow>(
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
      tenants.name AS tenant_name,
      tenants.slug AS tenant_slug
    FROM tickets
    JOIN locations
      ON tickets.location_id = locations.id
    JOIN tenants
      ON tickets.tenant_id = tenants.id
    WHERE tenants.slug = $1
      AND tickets.id = $2
    LIMIT 1
    `,
        [tenant, id]
    );

    const ticket = result.rows[0];

    if (!ticket) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-5xl px-6 py-10">
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
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
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