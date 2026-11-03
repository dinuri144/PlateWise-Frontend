
import { useEffect, useMemo, useState } from "react";
import {
    ShoppingCart,
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
    RefreshCw,
    ChefHat,
    Search,
    PackageCheck,
    Circle,
    CheckCircle2,
    Loader2,
    Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";
import PageHeader from "../components/PageHeader";

type ShoppingItem = {
    id: string;
    name: string;
    quantity: number | null;
    unit: string;
    isPurchased: boolean;
    source: string;
    recipeNames: string[];
    createdAt: string;
};

type Recipe = {
    id: string;
    name: string;
    description?: string;
    mealType?: string;
    prepTime?: number;
    prepTimeMinutes?: number;
    servings?: number;
};

type GenerateResponse = {
    message: string;
    selectedRecipes: string[];
    generatedCount: number;
    skippedCount: number;
    generatedItems: ShoppingItem[];
    skippedItems: {
        name: string;
        reason: string;
    }[];
};

const UNIT_OPTIONS = [
    { value: "g", label: "Grams (g)" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "ml", label: "Millilitres (ml)" },
    { value: "L", label: "Litres (L)" },
    { value: "pcs", label: "Pieces (pcs)" },
    { value: "pack", label: "Packs" },
    { value: "cup", label: "Cups" },
    { value: "tbsp", label: "Tablespoons (tbsp)" },
    { value: "tsp", label: "Teaspoons (tsp)" },
    { value: "item", label: "Items" },
];

export default function ShoppingList() {
    const navigate = useNavigate();

    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [newName, setNewName] = useState("");
    const [newQuantity, setNewQuantity] = useState("");
    const [newUnit, setNewUnit] = useState("pcs");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editQuantity, setEditQuantity] = useState("");
    const [editUnit, setEditUnit] = useState("pcs");

    const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
    const [showRecipePicker, setShowRecipePicker] = useState(false);
    const [search, setSearch] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [showPurchased, setShowPurchased] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    // Load shopping items and recipes
    async function loadData() {
        setLoading(true);
        setError("");

        try {
            const [shoppingData, recipeData] = await Promise.all([
                apiGet<ShoppingItem[]>("/api/shopping-list"),
                apiGet<Recipe[]>("/api/recipes"),
            ]);

            setItems(Array.isArray(shoppingData) ? shoppingData : []);

            const recipeList = Array.isArray(recipeData)
                ? recipeData
                : (recipeData as any).recipes ?? [];

            setRecipes(recipeList);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load shopping list."
            );
        } finally {
            setLoading(false);
        }
    }

    // Add a new shopping item
    async function addItem(e: React.FormEvent) {
        e.preventDefault();

        if (!newName.trim()) return;

        if (
            newQuantity &&
            (!Number.isFinite(Number(newQuantity)) ||
                Number(newQuantity) <= 0)
        ) {
            setError("Please enter a valid quantity.");
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const result = await apiPost<{
                alreadyAvailable: boolean;
                message: string;
                item: ShoppingItem | null;
            }>("/api/shopping-list", {
                name: newName.trim(),
                quantity: newQuantity ? Number(newQuantity) : null,
                unit: newUnit,
            });

            if (result.item) {
                setItems((previous) => [result.item!, ...previous]);
            }

            setNewName("");
            setNewQuantity("");
            setNewUnit("pcs");

            setMessage(result.message);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to add item."
            );
        } finally {
            setSaving(false);
        }
    }

    // Mark item as purchased / not purchased
    async function togglePurchased(item: ShoppingItem) {
        setError("");

        try {
            const updated = await apiPut<ShoppingItem>(
                `/api/shopping-list/${item.id}`,
                {
                    isPurchased: !item.isPurchased,
                }
            );

            setItems((previous) =>
                previous.map((current) =>
                    current.id === item.id ? updated : current
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update item."
            );
        }
    }

    // Open edit form
    function startEditing(item: ShoppingItem) {
        setEditingId(item.id);
        setEditName(item.name);
        setEditQuantity(item.quantity?.toString() ?? "");
        setEditUnit(item.unit);
    }

    // Save edited item
    async function saveEdit(id: string) {
        if (!editName.trim()) {
            setError("Please enter an item name.");
            return;
        }

        if (
            editQuantity &&
            (!Number.isFinite(Number(editQuantity)) ||
                Number(editQuantity) <= 0)
        ) {
            setError("Please enter a valid quantity.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const updated = await apiPut<ShoppingItem>(
                `/api/shopping-list/${id}`,
                {
                    name: editName.trim(),
                    quantity: editQuantity
                        ? Number(editQuantity)
                        : null,
                    unit: editUnit,
                }
            );

            setItems((previous) =>
                previous.map((item) =>
                    item.id === id ? updated : item
                )
            );

            setEditingId(null);
            setMessage("Item updated successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update item."
            );
        } finally {
            setSaving(false);
        }
    }

    // Delete item
    async function deleteItem(id: string) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this item?"
        );

        if (!confirmed) return;

        setError("");

        try {
            await apiDelete(`/api/shopping-list/${id}`);

            setItems((previous) =>
                previous.filter((item) => item.id !== id)
            );

            setMessage("Item deleted successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete item."
            );
        }
    }

    // Select or deselect a recipe
    function toggleRecipe(id: string) {
        setSelectedRecipes((previous) =>
            previous.includes(id)
                ? previous.filter((recipeId) => recipeId !== id)
                : [...previous, id]
        );
    }

    // Generate shopping list from selected recipes
    async function generateShoppingList() {
        if (selectedRecipes.length === 0) {
            setError("Please select at least one recipe.");
            return;
        }

        setGenerating(true);
        setError("");
        setMessage("");

        try {
            const result = await apiPost<GenerateResponse>(
                "/api/shopping-list/generate",
                {
                    recipeIds: selectedRecipes,
                }
            );

            await loadShoppingItemsOnly();

            setMessage(
                `Shopping list generated! ${result.generatedCount} ingredients added and ${result.skippedCount} already available in your pantry.`
            );

            setSelectedRecipes([]);
            setShowRecipePicker(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to generate shopping list."
            );
        } finally {
            setGenerating(false);
        }
    }

    // Reload shopping items after generation
    async function loadShoppingItemsOnly() {
        const data = await apiGet<ShoppingItem[]>("/api/shopping-list");

        setItems(Array.isArray(data) ? data : []);
    }

    // Pending items
    const pendingItems = useMemo(
        () => items.filter((item) => !item.isPurchased),
        [items]
    );

    // Purchased items
    const purchasedItems = useMemo(
        () => items.filter((item) => item.isPurchased),
        [items]
    );

    // Search and filter
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch = item.name
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchesStatus =
                showPurchased || !item.isPurchased;

            return matchesSearch && matchesStatus;
        });
    }, [items, search, showPurchased]);

    // Shopping progress
    const progress =
        items.length > 0
            ? Math.round(
                (purchasedItems.length / items.length) * 100
            )
            : 0;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">

                {/* Page Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <PageHeader
                        title="Your Shopping List"
                        description="Keep track of what you need. Generate missing ingredients from your favourite recipes and avoid buying what you already have."
                    />

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={loading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowRecipePicker(true)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            <Sparkles size={18} />
                            Generate from Recipes
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span>{error}</span>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                {/* Success message */}
                {message && (
                    <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        <span>{message}</span>

                        <button
                            type="button"
                            onClick={() => setMessage("")}
                            aria-label="Dismiss success message"
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                {/* Summary cards */}
                <section className="mb-7 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">
                                Total Items
                            </p>
                            <ShoppingCart className="text-emerald-600" size={21} />
                        </div>

                        <p className="mt-3 text-3xl font-bold text-slate-900">
                            {items.length}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Items in your list
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">
                                To Purchase
                            </p>
                            <Circle className="text-orange-500" size={21} />
                        </div>

                        <p className="mt-3 text-3xl font-bold text-slate-900">
                            {pendingItems.length}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Items remaining
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">
                                Purchased
                            </p>
                            <PackageCheck className="text-emerald-600" size={21} />
                        </div>

                        <p className="mt-3 text-3xl font-bold text-slate-900">
                            {purchasedItems.length}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Successfully collected
                        </p>
                    </div>
                </section>

                {/* Shopping progress */}
                <section className="mb-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900">
                                Shopping progress
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Your shopping completion status
                            </p>
                        </div>

                        <span className="text-lg font-bold text-emerald-600">
                            {progress}%
                        </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </section>

                {/* Main content */}
                <div className="grid gap-7 lg:grid-cols-[1fr_320px]">

                    {/* Shopping items */}
                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Shopping Items
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Manage your grocery requirements
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPurchased((previous) => !previous)
                                }
                                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${showPurchased
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-emerald-50 text-emerald-700"
                                    }`}
                            >
                                {showPurchased
                                    ? "Hide purchased"
                                    : "Show purchased"}
                            </button>
                        </div>

                        {/* Add item form */}
                        <form
                            onSubmit={addItem}
                            className="mb-6 grid gap-2 sm:grid-cols-[1fr_100px_145px_auto]"
                        >
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Add an item (e.g. Milk)"
                                maxLength={100}
                                className="min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                required
                            />

                            <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={newQuantity}
                                onChange={(e) => setNewQuantity(e.target.value)}
                                placeholder="Quantity"
                                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
                            />

                            <select
                                value={newUnit}
                                onChange={(e) => setNewUnit(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
                            >
                                {UNIT_OPTIONS.map((unit) => (
                                    <option key={unit.value} value={unit.value}>
                                        {unit.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="submit"
                                disabled={saving || !newName.trim()}
                                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <Plus size={17} />
                                Add
                            </button>
                        </form>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search shopping items..."
                                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"
                            />
                        </div>

                        {/* Items */}
                        {loading ? (
                            <div className="flex flex-col items-center py-16 text-slate-400">
                                <Loader2
                                    className="mb-3 animate-spin"
                                    size={28}
                                />
                                <p className="text-sm">
                                    Loading your shopping list...
                                </p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-14 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <ShoppingCart size={27} />
                                </div>

                                <h4 className="font-semibold text-slate-800">
                                    {search
                                        ? "No matching items"
                                        : "Your shopping list is empty"}
                                </h4>

                                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                                    {search
                                        ? "Try another search term."
                                        : "Add grocery items manually or generate missing ingredients from your recipes."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`rounded-xl border p-3 transition ${item.isPurchased
                                            ? "border-slate-100 bg-slate-50"
                                            : "border-slate-100 bg-white hover:border-emerald-200"
                                            }`}
                                    >
                                        {editingId === item.id ? (
                                            <div className="grid gap-2 sm:grid-cols-[1fr_90px_130px_auto_auto]">
                                                <input
                                                    value={editName}
                                                    onChange={(e) =>
                                                        setEditName(e.target.value)
                                                    }
                                                    className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                                />

                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="any"
                                                    value={editQuantity}
                                                    onChange={(e) =>
                                                        setEditQuantity(e.target.value)
                                                    }
                                                    placeholder="Qty"
                                                    className="rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-emerald-500"
                                                />

                                                <select
                                                    value={editUnit}
                                                    onChange={(e) =>
                                                        setEditUnit(e.target.value)
                                                    }
                                                    className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-emerald-500"
                                                >
                                                    {UNIT_OPTIONS.map((unit) => (
                                                        <option
                                                            key={unit.value}
                                                            value={unit.value}
                                                        >
                                                            {unit.label}
                                                        </option>
                                                    ))}

                                                    {!UNIT_OPTIONS.some(
                                                        (unit) => unit.value === editUnit
                                                    ) && (
                                                            <option value={editUnit}>
                                                                {editUnit}
                                                            </option>
                                                        )}
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={() => saveEdit(item.id)}
                                                    disabled={saving}
                                                    className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                                                    aria-label="Save changes"
                                                >
                                                    <Check size={17} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setEditingId(null)}
                                                    className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                                                    aria-label="Cancel editing"
                                                >
                                                    <X size={17} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => togglePurchased(item)}
                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${item.isPurchased
                                                        ? "text-emerald-600"
                                                        : "text-slate-300 hover:text-emerald-600"
                                                        }`}
                                                    aria-label={
                                                        item.isPurchased
                                                            ? "Mark as not purchased"
                                                            : "Mark as purchased"
                                                    }
                                                >
                                                    {item.isPurchased ? (
                                                        <CheckCircle2 size={23} />
                                                    ) : (
                                                        <Circle size={23} />
                                                    )}
                                                </button>

                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`truncate text-sm font-semibold ${item.isPurchased
                                                            ? "text-slate-400 line-through"
                                                            : "text-slate-800"
                                                            }`}
                                                    >
                                                        {item.name}
                                                    </p>

                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                        <span className="text-xs text-slate-500">
                                                            {item.quantity !== null
                                                                ? `${item.quantity} ${item.unit}`
                                                                : item.unit}
                                                        </span>

                                                        {item.source === "RECIPE" && (
                                                            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                                                                RECIPE
                                                            </span>
                                                        )}

                                                        {item.recipeNames?.length > 0 && (
                                                            <span className="truncate text-[10px] text-slate-400">
                                                                {item.recipeNames.join(", ")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(item)}
                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                                                    aria-label="Edit item"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => deleteItem(item.id)}
                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                    aria-label="Delete item"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Right sidebar */}
                    <aside className="space-y-5">
                        {/* Generate from recipes */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                                <ChefHat size={22} />
                            </div>

                            <h3 className="font-bold text-slate-900">
                                Generate from Recipes
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Select your planned recipes. PlateWise compares
                                their ingredients with your pantry and adds
                                only what you need.
                            </p>

                            <button
                                type="button"
                                onClick={() => setShowRecipePicker(true)}
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
                            >
                                <Sparkles size={17} />
                                Select Recipes
                            </button>
                        </div>

                        {/* Shopping tip */}
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                            <div className="flex items-center gap-2 text-emerald-800">
                                <PackageCheck size={19} />
                                <h3 className="font-semibold">
                                    Smart Shopping Tip
                                </h3>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-emerald-800/80">
                                Check your pantry before shopping. PlateWise
                                can identify ingredients you already have and
                                reduce unnecessary purchases.
                            </p>
                        </div>

                        {/* Shopping summary */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <h3 className="mb-3 font-semibold text-slate-900">
                                Shopping Summary
                            </h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">
                                        Pending
                                    </span>
                                    <span className="font-semibold text-orange-600">
                                        {pendingItems.length}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-500">
                                        Purchased
                                    </span>
                                    <span className="font-semibold text-emerald-700">
                                        {purchasedItems.length}
                                    </span>
                                </div>

                                <div className="flex justify-between border-t border-slate-100 pt-3">
                                    <span className="font-medium text-slate-700">
                                        Completion
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {progress}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Recipe selection modal */}
            {showRecipePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                        {/* Modal header */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Select Recipes
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Choose recipes to generate missing ingredients
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowRecipePicker(false)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Recipe list */}
                        <div className="max-h-[55vh] overflow-y-auto p-5">
                            {recipes.length === 0 ? (
                                <div className="py-12 text-center">
                                    <ChefHat
                                        className="mx-auto mb-3 text-slate-300"
                                        size={35}
                                    />

                                    <p className="font-semibold text-slate-800">
                                        No recipes available
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Add or browse recipes before generating your list.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/recipes")}
                                        className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                        Browse Recipes
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recipes.map((recipe) => {
                                        const selected =
                                            selectedRecipes.includes(recipe.id);

                                        return (
                                            <button
                                                type="button"
                                                key={recipe.id}
                                                onClick={() => toggleRecipe(recipe.id)}
                                                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${selected
                                                    ? "border-emerald-500 bg-emerald-50"
                                                    : "border-slate-200 hover:border-emerald-300"
                                                    }`}
                                            >
                                                <div
                                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected
                                                        ? "border-emerald-600 bg-emerald-600 text-white"
                                                        : "border-slate-300"
                                                        }`}
                                                >
                                                    {selected && <Check size={14} />}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-slate-900">
                                                        {recipe.name}
                                                    </p>

                                                    {recipe.description && (
                                                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                                            {recipe.description}
                                                        </p>
                                                    )}

                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {recipe.mealType && (
                                                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                                                                {recipe.mealType}
                                                            </span>
                                                        )}

                                                        {(recipe.prepTimeMinutes ??
                                                            recipe.prepTime) && (
                                                                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
                                                                    {recipe.prepTimeMinutes ??
                                                                        recipe.prepTime}{" "}
                                                                    min
                                                                </span>
                                                            )}

                                                        {recipe.servings && (
                                                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
                                                                {recipe.servings} servings
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal footer */}
                        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
                            <p className="text-sm text-slate-500">
                                {selectedRecipes.length} recipe(s) selected
                            </p>

                            <button
                                type="button"
                                onClick={generateShoppingList}
                                disabled={
                                    generating ||
                                    selectedRecipes.length === 0
                                }
                                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {generating ? (
                                    <>
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={17} />
                                        Generate Shopping List
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
