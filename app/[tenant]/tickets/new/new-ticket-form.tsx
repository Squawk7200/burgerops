'use client';

import { useMemo, useState } from 'react';

type LocationRow = {
    id: string;
    name: string;
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

type Props = {
    action: (formData: FormData) => void;
    locations: LocationRow[];
    assets: AssetRow[];
    vendors: VendorRow[];
    categoryOptions: string[];
    priorityOptions: string[];
    cancelHref: string;
};

export default function NewTicketForm({
    action,
    locations,
    assets,
    vendors,
    categoryOptions,
    priorityOptions,
    cancelHref,
}: Props) {
    const defaultLocationId = locations[0]?.id ?? '';
    const [locationId, setLocationId] = useState(defaultLocationId);

    const filteredAssets = useMemo(() => {
        return assets.filter((asset) => asset.location_id === locationId);
    }, [assets, locationId]);

    return (
        <form action={action} className="space-y-6">
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

            <div>
                <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-slate-700"
                >
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    required
                    rows={5}
                    placeholder="Describe what happened, what staff observed, and any immediate operational impact."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
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
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
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

            <div className="grid gap-6 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="asset_id"
                        className="mb-2 block text-sm font-medium text-slate-700"
                    >
                        Asset
                    </label>
                    <select
                        id="asset_id"
                        name="asset_id"
                        defaultValue=""
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
                    >
                        <option value="">No specific asset</option>
                        {filteredAssets.map((asset) => (
                            <option key={asset.id} value={asset.id}>
                                {asset.name} ({asset.asset_type})
                            </option>
                        ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-500">
                        Only assets from the selected location are shown.
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="vendor_id"
                        className="mb-2 block text-sm font-medium text-slate-700"
                    >
                        Vendor
                    </label>
                    <select
                        id="vendor_id"
                        name="vendor_id"
                        defaultValue=""
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
                    >
                        <option value="">Assign later</option>
                        {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                                {vendor.name}
                                {vendor.category ? ` — ${vendor.category}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
                <button
                    type="submit"
                    className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                    Create Ticket
                </button>

                <a
                    href={cancelHref}
                    className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                >
                    Cancel
                </a>
            </div>
        </form>
    );
}