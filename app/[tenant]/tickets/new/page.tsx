import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import pool from '../../../../lib/db';

type TenantRow = {
    id: string;
    name: string;
    slug: string;
};

type LocationRow = {
    id: string;
    name: string;
};

type CategoryRow = {
    category: string;
};

const priorityOptions = ['low', 'medium', 'high', 'critical'];

const fallbackCategoryOptions = [
    'facility_issue',
    'equipment_failure',
    'cleanliness',
    'safety',
    'inventory',
    'staffing',
];

export default async function NewTicketPage({
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

    const [locationsResult, categoriesResult] = await Promise.all([
        pool.query<LocationRow>(
            `
      SELECT id, name
      FROM locations
      WHERE tenant_id = $1
      ORDER BY name ASC
      `,
            [tenantRow.id]
        ),
        pool.query<CategoryRow>(
            `
      SELECT DISTINCT category
      FROM tickets
      WHERE tenant_id = $1
        AND category IS NOT NULL
      ORDER BY category ASC
      `,
            [tenantRow.id]
        ),
    ]);

    const locations: LocationRow[] = locationsResult.rows;
    const categoryOptions =
        categoriesResult.rows.length > 0
            ? categoriesResult.rows.map((row) => row.category)
            : fallbackCategoryOptions;

    async function createTicket(formData: FormData) {
        'use server';

        const title = String(formData.get('title') ?? '').trim();
        const category = String(formData.get('category') ?? '').trim();
        const priority = String(formData.get('priority') ?? '').trim();
        const locationId = String(formData.get('location_id') ?? '').trim();
        const dueAtRaw = String(formData.get('due_at') ?? '').trim();

        if (!title) {
            throw new Error('Title is required.');
        }

        if (!category) {
            throw new Error('Category is required.');
        }

        if (!priorityOptions.includes(priority)) {
            throw new Error('Invalid priority value.');
        }

        if (!locationId) {
            throw new Error('Location is required.');
        }

        const locationCheck = await pool.query<{ id: string }>(
            `
      SELECT id
      FROM locations
      WHERE id = $1
        AND tenant_id = $2
      LIMIT 1
      `,
            [locationId, tenantRow.id]
        );

        if (!locationCheck.rows[0]) {
            throw new Error('Invalid location selection.');
        }

        const insertResult = await pool.query<{ id: string }>(
            `
      INSERT INTO tickets (
        tenant_id,
        location_id,
        title,
        status,
        priority,
        category,
        due_at
      )
      VALUES (
        $1,
        $2,
        $3,
        'open',
        $4,
        $5,
        CASE
          WHEN $6 = '' THEN NULL
          ELSE $6::timestamp
        END
      )
      RETURNING id
      `,
            [tenantRow.id, locationId, title, priority, category, dueAtRaw]
        );

        const newTicketId = insertResult.rows[0]?.id;

        if (!newTicketId) {
            throw new Error('Ticket creation failed.');
        }

        redirect(`/${tenantRow.slug}/tickets/${newTicketId}`);
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
                    <Link
                        href="/"
                        className="font-medium text-slate-500 hover:text-slate-900"
                    >
                        Businesses
                    </Link>

                    <span className="text-slate-400">/</span>

                    <Link
                        href={`/${tenantRow.slug}/dashboard`}
                        className="font-medium text-slate-500 hover:text-slate-900"
                    >
                        {tenantRow.name}
                    </Link>

                    <span className="text-slate-400">/</span>

                    <Link
                        href={`/${tenantRow.slug}/tickets`}
                        className="font-medium text-slate-500 hover:text-slate-900"
                    >
                        Tickets
                    </Link>

                    <span className="text-slate-400">/</span>

                    <span className="font-medium text-slate-900">New Ticket</span>
                </div>

                <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                    <div className="mb-6">
                        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Create Ticket
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight">
                            New Incident for {tenantRow.name}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Add a new operational issue and send it into the workflow.
                        </p>
                    </div>

                    <form action={createTicket} className="space-y-6">
                        <div>
                            <label
                                htmlFor="title"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Title
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                placeholder="Walk-in cooler leaking near rear door"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
                            />
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="category"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Category
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    required
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
                                >
                                    {categoryOptions.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="priority"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Priority
                                </label>
                                <select
                                    id="priority"
                                    name="priority"
                                    defaultValue="medium"
                                    required
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
                                >
                                    {priorityOptions.map((priority) => (
                                        <option key={priority} value={priority}>
                                            {priority}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="location_id"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Location
                                </label>
                                <select
                                    id="location_id"
                                    name="location_id"
                                    required
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
                                >
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="due_at"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Due Date
                                </label>
                                <input
                                    id="due_at"
                                    name="due_at"
                                    type="datetime-local"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <button
                                type="submit"
                                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                            >
                                Create Ticket
                            </button>

                            <Link
                                href={`/${tenantRow.slug}/tickets`}
                                className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}