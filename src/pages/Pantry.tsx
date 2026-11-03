
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
    apiGet,
    apiPost,
    apiPut,
    apiDelete,
} from "../lib/api";
import PageHeader from "../components/PageHeader";

type PantryItem = {
    id: string;
    name: string;
    category: string | null;
    quantity: number;
    unit: string;
    expiryDate: string | null;
};

type PantryForm = {
    name: string;
    category: string;
    quantity: string;
    unit: string;
    expiryDate: string;
};

const emptyForm: PantryForm = {
    name: "",
    category: "",
    quantity: "",
    unit: "g",
    expiryDate: "",
};

const EXPIRY_WARNING_DAYS = 7;

function getDateOnly(date: string | Date): string {
    if (typeof date === "string") {
        return date.slice(0, 10);
    }

    return date.toISOString().slice(0, 10);
}

// Get today's date according to Sri Lankan time
function getTodayDateOnly(): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    return `${year}-${month}-${day}`;
}

function getDateDifference(dateString: string): number {
    const [year, month, day] = dateString.split("-").map(Number);

    const [todayYear, todayMonth, todayDay] = getTodayDateOnly()
        .split("-")
        .map(Number);

    const expiryUTC = Date.UTC(year, month - 1, day);

    const todayUTC = Date.UTC(
        todayYear,
        todayMonth - 1,
        todayDay
    );

    return Math.round(
        (expiryUTC - todayUTC) / (24 * 60 * 60 * 1000)
    );
}

function getExpiryStatus(expiryDate: string | null): string {
    if (!expiryDate) {
        return "No expiry date";
    }

    const dateOnly = getDateOnly(expiryDate);
    const difference = getDateDifference(dateOnly);

    if (difference < 0) {
        return "Expired";
    }

    if (difference === 0) {
        return "Expires today";
    }

    if (difference === 1) {
        return "Expires tomorrow";
    }

    if (difference <= EXPIRY_WARNING_DAYS) {
        return `Expires in ${difference} days`;
    }

    const [year, month, day] = dateOnly.split("-");

    return `Expires ${day}/${month}/${year}`;
}

function getExpiryColor(expiryDate: string | null): string {
    if (!expiryDate) {
        return "text-slate-500";
    }

    const difference = getDateDifference(getDateOnly(expiryDate));

    if (difference < 0) {
        return "text-red-700";
    }

    if (difference <= 3) {
        return "text-red-600";
    }

    if (difference <= EXPIRY_WARNING_DAYS) {
        return "text-amber-600";
    }

    return "text-slate-600";
}

export default function Pantry() {
    const [items, setItems] = useState<PantryItem[]>([]);
    const [form, setForm] = useState<PantryForm>(emptyForm);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [error, setError] = useState("");

    async function loadPantry() {
        try {
            setLoading(true);

            const data = await apiGet<PantryItem[]>("/api/pantry");

            setItems(data);
            setError("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load pantry items."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPantry();
    }, []);

    function updateField(
        field: keyof PantryForm,
        value: string
    ) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
    }

    function openAddForm() {
        setError("");
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
    }

    function openEditForm(item: PantryItem) {
        setError("");
        setEditingId(item.id);

        setForm({
            name: item.name,
            category: item.category || "",
            quantity: String(item.quantity),
            unit: item.unit,
            expiryDate: item.expiryDate
                ? getDateOnly(item.expiryDate)
                : "",
        });

        setShowForm(true);
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const name = form.name.trim();
        const quantity = Number(form.quantity);

        if (!name) {
            setError("Please enter a food name.");
            return;
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            setError("Please enter a valid quantity greater than zero.");
            return;
        }

        if (!form.unit.trim()) {
            setError("Please select a unit.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                name,
                category: form.category || null,
                quantity,
                unit: form.unit,
                expiryDate: form.expiryDate || null,
            };

            if (editingId) {
                await apiPut(
                    `/api/pantry/${editingId}`,
                    payload
                );
            } else {
                await apiPost("/api/pantry", payload);
            }

            resetForm();
            await loadPantry();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not save pantry item."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this pantry item?"
        );

        if (!confirmed) return;

        try {
            setDeletingId(id);
            setError("");

            await apiDelete(`/api/pantry/${id}`);

            setItems((previous) =>
                previous.filter((item) => item.id !== id)
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not delete pantry item."
            );
        } finally {
            setDeletingId(null);
        }
    }

    // Summary calculations

    const expiredItems = items.filter((item) => {
        if (!item.expiryDate) return false;

        return getDateDifference(
            getDateOnly(item.expiryDate)
        ) < 0;
    });

    const expiringSoonItems = items.filter((item) => {
        if (!item.expiryDate) return false;

        const difference = getDateDifference(
            getDateOnly(item.expiryDate)
        );

        return (
            difference >= 0 &&
            difference <= EXPIRY_WARNING_DAYS
        );
    });

    const categoryCount = new Set(
        items
            .map((item) => item.category)
            .filter(
                (category): category is string =>
                    Boolean(category)
            )
    ).size;

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-6xl">

                {/* Page Header */}

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <PageHeader
                        title="My Pantry"
                        description="Manage your ingredients and keep track of expiry dates."
                    />

                    <button
                        type="button"
                        onClick={openAddForm}
                        className="mb-8 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                        + Add Pantry Item
                    </button>
                </div>

                {/* Summary Cards */}

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Total Items
                        </p>
                        <p className="mt-2 text-3xl font-bold text-slate-800">
                            {items.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Expiring Soon
                        </p>
                        <p className="mt-2 text-3xl font-bold text-amber-600">
                            {expiringSoonItems.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Within the next 7 days
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Expired Items
                        </p>
                        <p className="mt-2 text-3xl font-bold text-red-600">
                            {expiredItems.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Categories
                        </p>
                        <p className="mt-2 text-3xl font-bold text-emerald-600">
                            {categoryCount}
                        </p>
                    </div>
                </div>

                {/* Error Message */}

                {error && (
                    <div
                        role="alert"
                        className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {/* Add / Edit Form */}

                {showForm && (
                    <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingId ? "Edit Pantry Item" : "Add New Item"}
                            </h2>

                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-slate-400 hover:text-slate-700"
                                aria-label="Close form"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                {/* Food Name */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Food Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) =>
                                            updateField("name", e.target.value)
                                        }
                                        placeholder="e.g. Rice, Eggs, Milk"
                                        required
                                        maxLength={100}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                                    />
                                </div>

                                {/* Category */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Category
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={(e) =>
                                            updateField("category", e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                                    >
                                        <option value="">Select category</option>
                                        <option value="Grains">Grains</option>
                                        <option value="Vegetables">Vegetables</option>
                                        <option value="Fruits">Fruits</option>
                                        <option value="Dairy">Dairy</option>
                                        <option value="Meat & Fish">Meat & Fish</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Quantity */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        value={form.quantity}
                                        onChange={(e) =>
                                            updateField("quantity", e.target.value)
                                        }
                                        placeholder="e.g. 500"
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                                    />
                                </div>

                                {/* Unit */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Unit
                                    </label>
                                    <select
                                        value={form.unit}
                                        onChange={(e) =>
                                            updateField("unit", e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                                    >
                                        <option value="g">Grams (g)</option>
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="ml">Millilitres (ml)</option>
                                        <option value="L">Litres (L)</option>
                                        <option value="pcs">Pieces</option>
                                        <option value="pack">Packs</option>
                                    </select>
                                </div>

                                {/* Expiry Date */}

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Expiry Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.expiryDate}
                                        onChange={(e) =>
                                            updateField("expiryDate", e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                                    />
                                    <p className="mt-1 text-xs text-slate-400">
                                        Leave empty if the food does not have an expiry date.
                                    </p>
                                </div>
                            </div>

                            {/* Form Buttons */}

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Item"
                                            : "Save Item"}
                                </button>

                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={saving}
                                    className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Pantry Items Header */}

                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">
                        Your Ingredients
                    </h2>
                    <span className="text-sm text-slate-500">
                        {items.length} items
                    </span>
                </div>

                {/* Loading / Empty / Pantry Items */}

                {loading ? (
                    <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
                        Loading pantry items...
                    </div>
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                        <div className="mb-3 text-5xl">🥬</div>

                        <h3 className="text-lg font-semibold text-slate-800">
                            Your pantry is empty
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Add your first ingredient to start managing your food inventory.
                        </p>

                        <button
                            type="button"
                            onClick={openAddForm}
                            className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
                        >
                            + Add First Item
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => {
                            const status = getExpiryStatus(item.expiryDate);
                            const expiryColor = getExpiryColor(item.expiryDate);

                            return (
                                <div
                                    key={item.id}
                                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                                >
                                    <div className="mb-4 flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">
                                                {item.name}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {item.category || "Uncategorized"}
                                            </p>
                                        </div>

                                        <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xl">
                                            🥗
                                        </span>
                                    </div>

                                    {/* Quantity */}

                                    <div className="mb-4 rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">
                                            Available Quantity
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-slate-800">
                                            {item.quantity}{" "}
                                            <span className="text-sm font-medium text-slate-500">
                                                {item.unit}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Expiry Information */}

                                    <div className="mb-5">
                                        <p className="text-xs text-slate-500">
                                            Expiry Information
                                        </p>
                                        <p className={`mt-1 text-sm font-semibold ${expiryColor}`}>
                                            {status}
                                        </p>
                                    </div>

                                    {/* Actions */}

                                    <div className="flex gap-3 border-t border-slate-100 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => openEditForm(item)}
                                            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deletingId === item.id}
                                            className="flex-1 rounded-lg border border-red-100 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {deletingId === item.id
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
