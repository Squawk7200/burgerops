import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import pool from '../../../../lib/db';
import NewTicketForm from './new-ticket-form';

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

type AssetRow = {
    id: string;
    name: string;
    asset_type: string;
    location_id: string;
    location_name: string;
};

type VendorRow = {
    id: string;
    name: string;
    category: string | null;
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

    const [locationsResult, categoriesResult, assetsResult, vendorsResult] = await Promise.all([
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
        pool.query<AssetRow>(
            `
            SELECT
              assets.id,
              assets.name,
              assets.asset_type,
              assets.location_id,
              locations.name AS location_name
            FROM assets
            JOIN locations
              ON assets.location_id = locations.id
            WHERE assets.tenant_id = $1
            ORDER BY locations.name ASC, assets.name ASC
            `,
            [tenantRow.id]
        ),
        pool.query<VendorRow>(
            `
            SELECT id, name, category
            FROM vendors
            WHERE tenant_id = $1
              AND active = TRUE
            ORDER BY category ASC NULLS LAST, name ASC
            `,
            [tenantRow.id]
        ),
    ]);

    const locations: LocationRow[] = locationsResult.rows;
    const assets: AssetRow[] = assetsResult.rows;
    const vendors: VendorRow[] = vendorsResult.rows;

    const categoryOptions =
        categoriesResult.rows.length > 0
            ? categoriesResult.rows.map((row) => row.category)
            : fallbackCategoryOptions;

    async function createTicket(formData: FormData) {
        'use server';

        const title = String(formData.get('title') ?? '').trim();
        const description = String(formData.get('description') ?? '').trim();
        const category = String(formData.get('category') ?? '').trim();
        const priority = String(formData.get('priority') ?? '').trim();
        const locationId = String(formData.get('location_id') ?? '').trim();
        const assetId = String(formData.get('asset_id') ?? '').trim();
        const vendorId = String(formData.get('vendor_id') ?? '').trim();
        const dueAtRaw = String(formData.get('due_at') ?? '').trim();

        if (!title) {
            throw new Error('Title is required.');
        }

        if (!description) {
            throw new Error('Description is required.');
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

        if (assetId) {
            const assetCheck = await pool.query<{ id: string }>(
                `
                SELECT id
                FROM assets
                WHERE id = $1
                  AND tenant_id = $2
                  AND location_id = $3
                LIMIT 1
                `,
                [assetId, tenantRow.id, locationId]
            );

            if (!assetCheck.rows[0]) {
                throw new Error('Invalid asset selection for this location.');
            }
        }

        if (vendorId) {
            const vendorCheck = await pool.query<{ id: string }>(
                `
                SELECT id
                FROM vendors
                WHERE id = $1
                  AND tenant_id = $2
                LIMIT 1
                `,
                [vendorId, tenantRow.id]
            );

            if (!vendorCheck.rows[0]) {
                throw new Error('Invalid vendor selection.');
            }
        }

        const insertResult = await pool.query<{ id: string }>(
            `
            INSERT INTO tickets (
              tenant_id,
              location_id,
              asset_id,
              vendor_id,
              title,
              description,
              status,
              priority,
              category,
              opened_at,
              due_at
            )
            VALUES (
              $1,
              $2,
              CASE WHEN $3 = '' THEN NULL ELSE $3::uuid END,
              CASE WHEN $4 = '' THEN NULL ELSE $4::uuid END,
              $5,
              $6,
              CASE
                WHEN $4 = '' THEN 'open'
                ELSE 'vendor_assigned'
              END,
              $7,
              $8,
              NOW(),
              CASE
                WHEN $9 = '' THEN NULL
                ELSE $9::timestamp
              END
            )
            RETURNING id
            `,
            [
                tenantRow.id,
                locationId,
                assetId,
                vendorId,
                title,
                description,
                priority,
                category,
                dueAtRaw,
            ]
        );

        const newTicketId = insertResult.rows[0]?.id;

        if (!newTicketId) {
            throw new Error('Ticket creation failed.');
        }

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
              'created',
              $2,
              'System'
            )
            `,
            [
                newTicketId,
                vendorId
                    ? 'Ticket created and vendor assigned during intake.'
                    : 'Ticket created and awaiting vendor assignment.',
            ]
        );

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
                            Add a new operational issue and route it into the workflow.
                        </p>
                    </div>

                    <NewTicketForm
                        action={createTicket}
                        locations={locations}
                        assets={assets}
                        vendors={vendors}
                        categoryOptions={categoryOptions}
                        priorityOptions={priorityOptions}
                        cancelHref={`/${tenantRow.slug}/tickets`}
                    />
                </section>
            </div>
        </main>
    );
}