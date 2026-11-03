
import { useEffect, useMemo, useState } from "react";
import {
    Apple,
    ChevronDown,
    Clock3,
    Flame,
    Loader2,
    Plus,
    Search,
    Sparkles,
    Trash2,
    Utensils,
    X,
} from "lucide-react";

import {
    apiGet,
    apiPost,
    apiDelete,
} from "../lib/api";

import PageHeader from "../components/PageHeader";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

type Food = {
    id: string;
    name: string;
    category?: string | null;
    servingUnit: string;
    servingGrams: number;
    calories: number;
    protein: number;
    carbs?: number | null;
    fat?: number | null;
    isCustom: boolean;
};

type FoodLogItem = {
    id: string;
    grams: number;
    calories: number;
    protein: number;
    food: Food;
};

type FoodLog = {
    id: string;
    mealType: MealType;
    date: string;
    notes?: string | null;
    items: FoodLogItem[];
};

type TodayResponse = {
    date?: string;
    logs: FoodLog[];
    totals: {
        calories: number;
        protein: number;
        carbs?: number;
        fat?: number;
    };
};

type NutritionPreview = {
    grams: number;
    calories: number;
    protein: number;
    carbs: number | null;
    fat: number | null;
};

const meals: {
    type: MealType;
    label: string;
    icon: string;
    description: string;
}[] = [
        {
            type: "BREAKFAST",
            label: "Breakfast",
            icon: "☀️",
            description: "Start your day",
        },
        {
            type: "LUNCH",
            label: "Lunch",
            icon: "🥗",
            description: "Midday meal",
        },
        {
            type: "DINNER",
            label: "Dinner",
            icon: "🌙",
            description: "Evening meal",
        },
        {
            type: "SNACK",
            label: "Snack",
            icon: "🍎",
            description: "Something small",
        },
    ];

export default function FoodLog() {
    const [foods, setFoods] = useState<Food[]>([]);

    const [today, setToday] = useState<TodayResponse>({
        logs: [],
        totals: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
        },
    });

    const [search, setSearch] = useState("");

    const [selectedMeal, setSelectedMeal] =
        useState<MealType>("BREAKFAST");

    const [selectedFood, setSelectedFood] =
        useState<Food | null>(null);

    const [grams, setGrams] = useState("100");

    const [preview, setPreview] =
        useState<NutritionPreview | null>(null);

    const [loadingFoods, setLoadingFoods] = useState(true);
    const [loadingToday, setLoadingToday] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [adding, setAdding] = useState(false);

    const [deletingItemId, setDeletingItemId] =
        useState<string | null>(null);

    const [showFoodPicker, setShowFoodPicker] = useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        loadFoods();
        loadToday();
    }, []);

    // Load available foods
    async function loadFoods() {
        try {
            setLoadingFoods(true);

            const data = await apiGet<Food[]>("/api/food");

            setFoods(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load foods"
            );
        } finally {
            setLoadingFoods(false);
        }
    }

    // Load today's food logs
    async function loadToday() {
        try {
            setLoadingToday(true);

            const data = await apiGet<TodayResponse>(
                "/api/food/log/today"
            );

            setToday(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load today's food"
            );
        } finally {
            setLoadingToday(false);
        }
    }

    // Calculate nutrition based on selected grams
    async function calculateNutrition(
        food: Food,
        amount: string
    ) {
        const value = Number(amount);

        if (!Number.isFinite(value) || value <= 0) {
            setPreview(null);
            return;
        }

        try {
            setCalculating(true);

            const data = await apiPost<{
                food: Food;
                nutrition: NutritionPreview;
            }>("/api/food/calculate", {
                foodId: food.id,
                grams: value,
            });

            setPreview(data.nutrition);
        } catch (err) {
            setPreview(null);

            setError(
                err instanceof Error
                    ? err.message
                    : "Could not calculate nutrition"
            );
        } finally {
            setCalculating(false);
        }
    }

    // Select a food
    function selectFood(food: Food) {
        setSelectedFood(food);
        setGrams("100");
        setPreview(null);
        setShowFoodPicker(false);

        calculateNutrition(food, "100");
    }

    // Handle quantity changes
    function handleGramsChange(value: string) {
        setGrams(value);

        if (selectedFood) {
            setPreview(null);
            calculateNutrition(selectedFood, value);
        }
    }

    // Add food to selected meal
    async function addFood() {
        if (!selectedFood || !preview) return;

        const amount = Number(grams);

        if (
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > 10000
        ) {
            setError("Enter a valid quantity between 1 and 10000 grams.");
            return;
        }

        try {
            setAdding(true);
            setError("");

            await apiPost("/api/food/log", {
                date: getTodayDate(),
                mealType: selectedMeal,
                foodId: selectedFood.id,
                grams: amount,
            });

            setSelectedFood(null);
            setPreview(null);
            setGrams("100");

            await loadToday();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not add food"
            );
        } finally {
            setAdding(false);
        }
    }

    // Delete a logged food item
    async function deleteFoodItem(itemId: string) {
        const confirmed = window.confirm(
            "Are you sure you want to remove this food?"
        );

        if (!confirmed) return;

        try {
            setDeletingItemId(itemId);
            setError("");

            await apiDelete(
                `/api/food/log/item/${encodeURIComponent(itemId)}`
            );

            await loadToday();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not remove food"
            );
        } finally {
            setDeletingItemId(null);
        }
    }

    // Search foods
    const filteredFoods = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return foods;

        return foods.filter((food) =>
            food.name.toLowerCase().includes(query)
        );
    }, [foods, search]);

    // Group today's logs by meal
    const mealLogs = useMemo(() => {
        return meals.map((meal) => ({
            ...meal,
            log: today.logs.find(
                (log) => log.mealType === meal.type
            ),
        }));
    }, [today.logs]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Background decoration */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />
                <div className="absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-lime-100/50 blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-8">
                {/* Page Header */}
                <header className="mb-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <PageHeader
                            title="Today's Food Log"
                            description="Track what you eat and let PlateWise calculate your calories and protein automatically."
                        />

                        <div className="mb-8 rounded-2xl border border-emerald-100 bg-white px-5 py-3 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Today
                            </p>

                            <p className="mt-1 font-bold text-slate-800">
                                {formatToday()}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Error message */}
                {error && (
                    <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                        <span>{error}</span>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="rounded-lg p-1 hover:bg-red-100"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Daily summary */}
                <section className="mb-8 grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        icon={<Flame size={21} />}
                        label="Calories consumed"
                        value={`${Math.round(
                            today.totals.calories
                        )} kcal`}
                        description="Today's intake"
                    />

                    <SummaryCard
                        icon={<Sparkles size={21} />}
                        label="Protein consumed"
                        value={`${Math.round(
                            today.totals.protein
                        )} g`}
                        description="Today's protein"
                    />

                    <div className="rounded-3xl border border-emerald-100 bg-emerald-600 p-6 text-white shadow-lg shadow-emerald-600/15">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                                <Utensils size={21} />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                                    Meals logged
                                </p>

                                <p className="mt-1 text-2xl font-black">
                                    {today.logs.length} / 4
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-1.5">
                            {meals.map((meal) => {
                                const exists = today.logs.some(
                                    (log) => log.mealType === meal.type
                                );

                                return (
                                    <div
                                        key={meal.type}
                                        className={`h-2 flex-1 rounded-full ${exists
                                            ? "bg-white"
                                            : "bg-white/20"
                                            }`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* Add food section */}
                    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
                        <div className="mb-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <Plus size={21} />
                                </div>

                                <div>
                                    <h2 className="text-xl font-black">
                                        Add food
                                    </h2>

                                    <p className="text-sm font-medium text-slate-500">
                                        What did you eat?
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Meal selection */}
                        <div>
                            <label className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500">
                                Meal
                            </label>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {meals.map((meal) => (
                                    <button
                                        key={meal.type}
                                        type="button"
                                        onClick={() =>
                                            setSelectedMeal(meal.type)
                                        }
                                        className={`rounded-2xl border px-3 py-3 text-left transition ${selectedMeal === meal.type
                                            ? "border-emerald-500 bg-emerald-50 shadow-sm"
                                            : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="text-lg">
                                            {meal.icon}
                                        </div>

                                        <div
                                            className={`mt-1 text-xs font-bold ${selectedMeal === meal.type
                                                ? "text-emerald-700"
                                                : "text-slate-700"
                                                }`}
                                        >
                                            {meal.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Food picker */}
                        <div className="mt-6">
                            <label className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500">
                                Food
                            </label>

                            {!selectedFood ? (
                                <button
                                    type="button"
                                    onClick={() => setShowFoodPicker(true)}
                                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-emerald-400 hover:bg-white"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                                            <Search size={18} />
                                        </div>

                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                Search for a food
                                            </p>

                                            <p className="text-xs font-medium text-slate-400">
                                                Choose from your food database
                                            </p>
                                        </div>
                                    </div>

                                    <ChevronDown
                                        size={18}
                                        className="text-slate-400"
                                    />
                                </button>
                            ) : (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                                                <Apple size={19} />
                                            </div>

                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {selectedFood.name}
                                                </p>

                                                <p className="text-xs font-medium text-slate-500">
                                                    {selectedFood.calories} kcal /{" "}
                                                    {selectedFood.servingGrams}g
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFood(null);
                                                setPreview(null);
                                            }}
                                            className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-700"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quantity */}
                        {selectedFood && (
                            <>
                                <div className="mt-6">
                                    <label className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500">
                                        Quantity
                                    </label>

                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min="1"
                                                max="10000"
                                                value={grams}
                                                onChange={(e) =>
                                                    handleGramsChange(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pr-14 text-lg font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                                            />

                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                                                grams
                                            </span>
                                        </div>

                                        <div className="flex h-[58px] items-center rounded-2xl border border-slate-200 bg-white px-4">
                                            <span className="text-xs font-bold text-slate-400">
                                                g
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Nutrition calculation */}
                                <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                                            Nutrition estimate
                                        </span>

                                        {calculating && (
                                            <Loader2
                                                size={16}
                                                className="animate-spin text-emerald-600"
                                            />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <NutritionValue
                                            label="Calories"
                                            value={
                                                preview
                                                    ? `${Math.round(
                                                        preview.calories
                                                    )}`
                                                    : "—"
                                            }
                                            unit="kcal"
                                        />

                                        <NutritionValue
                                            label="Protein"
                                            value={
                                                preview
                                                    ? `${Math.round(
                                                        preview.protein
                                                    )}`
                                                    : "—"
                                            }
                                            unit="g"
                                        />

                                        <NutritionValue
                                            label="Carbs"
                                            value={
                                                preview?.carbs != null
                                                    ? `${Math.round(
                                                        preview.carbs
                                                    )}`
                                                    : "—"
                                            }
                                            unit="g"
                                        />
                                    </div>
                                </div>

                                {/* Add button */}
                                <button
                                    type="button"
                                    onClick={addFood}
                                    disabled={
                                        adding ||
                                        calculating ||
                                        !preview ||
                                        !selectedFood
                                    }
                                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {adding ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={18} />
                                            Add to {getMealLabel(selectedMeal)}
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </section>

                    {/* Today's meals */}
                    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black">
                                    Today's meals
                                </h2>

                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Everything you've logged today
                                </p>
                            </div>

                            <Clock3
                                size={20}
                                className="text-slate-300"
                            />
                        </div>

                        {loadingToday ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2
                                    className="animate-spin text-emerald-600"
                                    size={26}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mealLogs.map((meal) => (
                                    <MealSection
                                        key={meal.type}
                                        meal={meal}
                                        onDelete={deleteFoodItem}
                                        deletingItemId={deletingItemId}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Food picker modal */}
            {showFoodPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="border-b border-slate-100 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black">
                                        Choose a food
                                    </h3>

                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        Search your available foods
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowFoodPicker(false)}
                                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="relative mt-5">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    autoFocus
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search eggs, rice, chicken..."
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto p-3">
                            {loadingFoods ? (
                                <div className="flex justify-center py-16">
                                    <Loader2
                                        size={25}
                                        className="animate-spin text-emerald-600"
                                    />
                                </div>
                            ) : filteredFoods.length === 0 ? (
                                <div className="py-14 text-center">
                                    <Apple
                                        size={35}
                                        className="mx-auto text-slate-200"
                                    />

                                    <p className="mt-3 font-bold text-slate-700">
                                        No foods found
                                    </p>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Try a different search.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredFoods.map((food) => (
                                        <button
                                            key={food.id}
                                            type="button"
                                            onClick={() => selectFood(food)}
                                            className="flex w-full items-center justify-between rounded-2xl p-3 text-left transition hover:bg-emerald-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-emerald-600">
                                                    <Apple size={18} />
                                                </div>

                                                <div>
                                                    <p className="font-bold text-slate-800">
                                                        {food.name}
                                                    </p>

                                                    <p className="text-xs font-medium text-slate-400">
                                                        {food.category ?? "Food"}{" "}
                                                        • {food.servingGrams}g
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-800">
                                                    {food.calories} kcal
                                                </p>

                                                <p className="text-xs font-bold text-emerald-600">
                                                    {food.protein}g protein
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Summary card
function SummaryCard({
    icon,
    label,
    value,
    description,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    {icon}
                </div>

                <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Today
                </span>
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-wider text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                {value}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-400">
                {description}
            </p>
        </div>
    );
}

// Nutrition value
function NutritionValue({
    label,
    value,
    unit,
}: {
    label: string;
    value: string;
    unit: string;
}) {
    return (
        <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-lg font-black text-slate-900">
                {value}
            </p>

            <p className="text-[10px] font-bold text-slate-400">
                {unit}
            </p>
        </div>
    );
}

// Individual meal section
function MealSection({
    meal,
    onDelete,
    deletingItemId,
}: {
    meal: {
        type: MealType;
        label: string;
        icon: string;
        description: string;
        log?: FoodLog;
    };
    onDelete: (itemId: string) => void;
    deletingItemId: string | null;
}) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                        {meal.icon}
                    </div>

                    <div>
                        <p className="text-sm font-black text-slate-800">
                            {meal.label}
                        </p>

                        <p className="text-xs font-medium text-slate-400">
                            {meal.log
                                ? `${meal.log.items.length} item${meal.log.items.length !== 1 ? "s" : ""
                                }`
                                : meal.description}
                        </p>
                    </div>
                </div>

                {meal.log && (
                    <div className="text-right">
                        <p className="text-sm font-black text-slate-800">
                            {Math.round(
                                meal.log.items.reduce(
                                    (sum, item) => sum + item.calories,
                                    0
                                )
                            )}{" "}
                            kcal
                        </p>

                        <p className="text-xs font-bold text-emerald-600">
                            {Math.round(
                                meal.log.items.reduce(
                                    (sum, item) => sum + item.protein,
                                    0
                                )
                            )}
                            g protein
                        </p>
                    </div>
                )}
            </div>

            {/* Logged food items */}
            {meal.log && meal.log.items.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                    {meal.log.items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-700">
                                    {item.food.name}
                                </p>

                                <p className="text-xs font-medium text-slate-400">
                                    {item.grams} g
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-600">
                                        {Math.round(item.calories)} kcal
                                    </p>

                                    <p className="text-[11px] font-bold text-emerald-600">
                                        {Math.round(item.protein)}g
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onDelete(item.id)}
                                    disabled={deletingItemId === item.id}
                                    title="Remove food"
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deletingItemId === item.id ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Get meal label
function getMealLabel(type: MealType) {
    const meal = meals.find((item) => item.type === type);
    return meal?.label ?? "meal";
}

// Get today's date in Sri Lanka timezone
function getTodayDate() {
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

// Format today's date
function formatToday() {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Colombo",
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date());
}
