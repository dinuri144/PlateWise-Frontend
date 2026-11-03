
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiGet } from "../lib/api";
import {
    Activity,
    ArrowRight,
    CalendarDays,
    ChevronRight,
    CircleCheck,
    Flame,
    Plus,
    ShoppingBasket,
    ShoppingCart,
    Sparkles,
    Target,
    Utensils,
    Weight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface TodayFoodItem {
    id: string;
    grams: number;
    calories: number;
    protein: number;
    food: {
        name: string;
    };
}

interface TodayFoodLog {
    id: string;
    mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
    items: TodayFoodItem[];
}

interface TodayResponse {
    date: string;
    logs: TodayFoodLog[];
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

interface PantryItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    expiryDate: string | null;
}

interface ShoppingItem {
    id: string;
    name: string;
    isPurchased: boolean;
}

export default function Dashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    // User name
    const firstName = useMemo(() => {
        const email = user?.email ?? "";
        const name = email.split("@")[0];

        return name
            ? name.charAt(0).toUpperCase() + name.slice(1)
            : "there";
    }, [user?.email]);

    // Nutrition targets
    const calorieTarget = profile?.calorieTarget ?? 0;
    const proteinTarget = profile?.proteinTarget ?? 0;

    // Today's food data
    const [todayData, setTodayData] =
        useState<TodayResponse | null>(null);

    const [loadingToday, setLoadingToday] = useState(true);
    const [todayError, setTodayError] = useState("");

    // Pantry and shopping list data
    const [pantryItems, setPantryItems] =
        useState<PantryItem[]>([]);

    const [shoppingItems, setShoppingItems] =
        useState<ShoppingItem[]>([]);

    const [loadingPantry, setLoadingPantry] = useState(true);

    // Load today's food logs
    useEffect(() => {
        const loadTodayData = async () => {
            try {
                setLoadingToday(true);
                setTodayError("");

                const data = await apiGet<TodayResponse>(
                    "/api/food/log/today"
                );

                setTodayData(data);
            } catch (error) {
                console.error(
                    "Failed to load today's food data:",
                    error
                );

                setTodayError(
                    "Unable to load today's nutrition data."
                );
            } finally {
                setLoadingToday(false);
            }
        };

        loadTodayData();
    }, []);

    // Load pantry and shopping list data
    useEffect(() => {
        const loadPantryAndShoppingData = async () => {
            setLoadingPantry(true);

            // Load both independently so one failed request
            // does not prevent the other from displaying data.
            const [pantryResult, shoppingResult] =
                await Promise.allSettled([
                    apiGet<PantryItem[]>("/api/pantry"),
                    apiGet<ShoppingItem[]>("/api/shopping-list"),
                ]);

            if (pantryResult.status === "fulfilled") {
                setPantryItems(pantryResult.value);
            } else {
                console.error(
                    "Failed to load pantry data:",
                    pantryResult.reason
                );
            }

            if (shoppingResult.status === "fulfilled") {
                setShoppingItems(shoppingResult.value);
            } else {
                console.error(
                    "Failed to load shopping list data:",
                    shoppingResult.reason
                );
            }

            setLoadingPantry(false);
        };

        loadPantryAndShoppingData();
    }, []);

    // Nutrition calculations
    const caloriesConsumed =
        todayData?.totals.calories ?? 0;

    const proteinConsumed =
        todayData?.totals.protein ?? 0;

    const todayLogs = todayData?.logs ?? [];

    const calorieProgress =
        calorieTarget > 0
            ? Math.min(
                (caloriesConsumed / calorieTarget) * 100,
                100
            )
            : 0;

    const proteinProgress =
        proteinTarget > 0
            ? Math.min(
                (proteinConsumed / proteinTarget) * 100,
                100
            )
            : 0;

    const caloriesRemaining = Math.max(
        calorieTarget - caloriesConsumed,
        0
    );

    const proteinRemaining = Math.max(
        proteinTarget - proteinConsumed,
        0
    );

    // Pantry calculations
    const totalPantryItems = pantryItems.length;

    // Use local calendar dates to calculate expiry days.
    // This avoids UTC date differences in Sri Lanka.
    const getDaysUntilExpiry = (expiryDate: string) => {
        const datePart = expiryDate.slice(0, 10);
        const [year, month, day] = datePart
            .split("-")
            .map(Number);

        const expiryTime = Date.UTC(
            year,
            month - 1,
            day
        );

        const now = new Date();

        const todayTime = Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        return Math.floor(
            (expiryTime - todayTime) / (1000 * 60 * 60 * 24)
        );
    };

    const expiredItems = pantryItems.filter((item) => {
        if (!item.expiryDate) return false;

        return getDaysUntilExpiry(item.expiryDate) < 0;
    });

    const expiringSoonItems = pantryItems.filter((item) => {
        if (!item.expiryDate) return false;

        const days = getDaysUntilExpiry(item.expiryDate);

        return days >= 0 && days <= 7;
    });

    const pendingShoppingItems = shoppingItems.filter(
        (item) => !item.isPurchased
    ).length;

    // Weight goal information
    const currentWeight = profile?.currentWeight ?? null;
    const targetWeight = profile?.targetWeight ?? null;
    const goalType = profile?.goalType ?? "maintain";

    const weightDifference =
        currentWeight !== null && targetWeight !== null
            ? Math.abs(targetWeight - currentWeight)
            : null;

    // Actual weight progress requires weight history tracking.
    const weightProgress = 0;

    // Today's date
    const today = new Date();

    const formattedDate = today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    return (
        <div className="min-h-screen bg-[#f7faf8] text-slate-900">

            {/* Background decoration */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />
                <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-lime-100/50 blur-3xl" />
            </div>

            {/* Main content */}
            <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">

                {/* Greeting */}
                <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                    <div>
                        <div className="mb-2 flex items-center gap-2">

                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                                Today
                            </span>

                            <span className="text-xs font-medium text-slate-500">
                                <CalendarDays
                                    className="mr-1 inline"
                                    size={13}
                                />
                                {formattedDate}
                            </span>
                        </div>

                        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                            Good morning,{" "}
                            <span className="text-emerald-600">
                                {firstName}
                            </span>{" "}
                            👋
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                            Stay on track with your nutrition goals.
                            Here's your progress and what you can focus
                            on today.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/food-log")}
                        className="group flex w-fit items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                        <Plus size={18} />
                        Log food

                        <ArrowRight
                            size={16}
                            className="transition group-hover:translate-x-0.5"
                        />
                    </button>
                </section>

                {/* Nutrition target cards */}
                <section className="mt-8 grid gap-4 md:grid-cols-3">

                    <ProgressCard
                        icon={<Flame size={21} />}
                        iconClass="bg-orange-50 text-orange-600"
                        title="Calories"
                        value={
                            loadingToday
                                ? "..."
                                : caloriesConsumed.toLocaleString()
                        }
                        target={calorieTarget}
                        unit="kcal"
                        progress={calorieProgress}
                        remaining={
                            loadingToday
                                ? "Loading..."
                                : `${caloriesRemaining.toLocaleString()} kcal remaining`
                        }
                        progressClass="bg-orange-500"
                    />

                    <ProgressCard
                        icon={<Activity size={21} />}
                        iconClass="bg-emerald-50 text-emerald-600"
                        title="Protein"
                        value={
                            loadingToday
                                ? "..."
                                : proteinConsumed.toFixed(1)
                        }
                        target={proteinTarget}
                        unit="g"
                        progress={proteinProgress}
                        remaining={
                            loadingToday
                                ? "Loading..."
                                : `${proteinRemaining.toFixed(1)} g remaining`
                        }
                        progressClass="bg-emerald-600"
                    />

                    <GoalCard
                        goalType={goalType}
                        currentWeight={currentWeight}
                        targetWeight={targetWeight}
                        weightProgress={weightProgress}
                        difference={weightDifference}
                    />

                </section>

                {/* Today's meals and Quick Actions */}
                <section className="mt-6 grid gap-6 lg:grid-cols-3">

                    {/* Today's meals */}
                    <div className="lg:col-span-2">

                        <SectionCard
                            title="Today's meals"
                            subtitle="Track what you eat throughout the day"
                            actionLabel="View food log"
                            onAction={() => navigate("/food-log")}
                            icon={<Utensils size={18} />}
                        >

                            {todayError && (
                                <p className="mb-3 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">
                                    {todayError}
                                </p>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">

                                {[
                                    {
                                        meal: "Breakfast",
                                        type: "BREAKFAST",
                                        icon: "🌅",
                                    },
                                    {
                                        meal: "Lunch",
                                        type: "LUNCH",
                                        icon: "☀️",
                                    },
                                    {
                                        meal: "Dinner",
                                        type: "DINNER",
                                        icon: "🌙",
                                    },
                                    {
                                        meal: "Snack",
                                        type: "SNACK",
                                        icon: "🍎",
                                    },
                                ].map((meal) => {

                                    const log = todayLogs.find(
                                        (item) =>
                                            item.mealType === meal.type
                                    );

                                    const foodNames =
                                        log?.items
                                            .map((item) => item.food.name)
                                            .join(", ") ?? "";

                                    return (
                                        <MealRow
                                            key={meal.type}
                                            meal={meal.meal}
                                            icon={meal.icon}
                                            foodNames={foodNames}
                                            loading={loadingToday}
                                            onClick={() =>
                                                navigate("/food-log")
                                            }
                                        />
                                    );
                                })}

                            </div>
                        </SectionCard>
                    </div>

                    {/* Quick actions */}
                    <SectionCard
                        title="Quick actions"
                        subtitle="Jump into your daily tools"
                        icon={<Sparkles size={18} />}
                    >

                        <div className="space-y-2.5">

                            <QuickAction
                                icon={<Plus size={18} />}
                                title="Log a meal"
                                description="Record what you ate"
                                onClick={() =>
                                    navigate("/food-log")
                                }
                            />

                            <QuickAction
                                icon={<ShoppingBasket size={18} />}
                                title="Add pantry item"
                                description="Update your ingredients"
                                onClick={() =>
                                    navigate("/pantry")
                                }
                            />

                            <QuickAction
                                icon={<Utensils size={18} />}
                                title="Find a meal"
                                description="Use what you already have"
                                onClick={() =>
                                    navigate("/recipes")
                                }
                            />

                            <QuickAction
                                icon={<ShoppingCart size={18} />}
                                title="Shopping list"
                                description="Plan what you need to buy"
                                onClick={() =>
                                    navigate("/shopping-list")
                                }
                            />

                            <QuickAction
                                icon={<Activity size={18} />}
                                title="View insights"
                                description="See your weekly progress"
                                onClick={() =>
                                    navigate("/insights")
                                }
                            />

                        </div>
                    </SectionCard>
                </section>

                {/* Recommendations and Pantry */}
                <section className="mt-6 grid gap-6 lg:grid-cols-2">

                    {/* Meal recommendations */}
                    <SectionCard
                        title="Suggested for you"
                        subtitle="Meals that can fit your nutrition goals"
                        actionLabel="Explore meals"
                        onAction={() => navigate("/recipes")}
                        icon={<Sparkles size={18} />}
                    >

                        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6">

                            <div className="flex items-start gap-4">

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                                    🍳
                                </div>

                                <div className="min-w-0">

                                    <p className="font-extrabold text-slate-900">
                                        Discover your next meal
                                    </p>

                                    <p className="mt-1 text-sm leading-5 text-slate-600">
                                        PlateWise can match recipes with
                                        your pantry ingredients, protein
                                        target and dietary preferences.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate("/recipes")
                                        }
                                        className="mt-4 flex items-center gap-1 text-sm font-extrabold text-emerald-700 hover:text-emerald-800"
                                    >
                                        Find meals
                                        <ChevronRight size={16} />
                                    </button>

                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Dynamic pantry summary */}
                    <SectionCard
                        title="Pantry at a glance"
                        subtitle="Keep track of ingredients before they go to waste"
                        actionLabel="Open pantry"
                        onAction={() => navigate("/pantry")}
                        icon={<ShoppingBasket size={18} />}
                    >

                        <div className="grid grid-cols-2 gap-3">

                            <MiniInfoCard
                                icon="🥕"
                                label="Pantry items"
                                value={
                                    loadingPantry
                                        ? "..."
                                        : String(totalPantryItems)
                                }
                                description="items stored"
                            />

                            <MiniInfoCard
                                icon="⏳"
                                label="Expiring soon"
                                value={
                                    loadingPantry
                                        ? "..."
                                        : String(expiringSoonItems.length)
                                }
                                description="within 7 days"
                            />

                            <MiniInfoCard
                                icon="⚠️"
                                label="Expired items"
                                value={
                                    loadingPantry
                                        ? "..."
                                        : String(expiredItems.length)
                                }
                                description="need attention"
                            />

                            <MiniInfoCard
                                icon="🛒"
                                label="To purchase"
                                value={
                                    loadingPantry
                                        ? "..."
                                        : String(pendingShoppingItems)
                                }
                                description="pending items"
                            />

                        </div>

                        {/* Expired food warning */}
                        {!loadingPantry &&
                            expiredItems.length > 0 && (
                                <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
                                    <span>⚠️</span>
                                    {expiredItems.length} expired
                                    {expiredItems.length === 1
                                        ? " item"
                                        : " items"}{" "}
                                    need attention.
                                </div>
                            )}

                        {/* Expiring soon warning */}
                        {!loadingPantry &&
                            expiringSoonItems.length > 0 && (
                                <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                                    <span>⏳</span>
                                    {expiringSoonItems.length} item(s)
                                    expiring within 7 days.
                                </div>
                            )}

                        <button
                            type="button"
                            onClick={() => navigate("/pantry")}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                            <Plus size={16} />
                            Manage pantry
                        </button>

                    </SectionCard>
                </section>

                {/* Shopping list */}
                <section className="mt-6">

                    <SectionCard
                        title="Smart shopping list"
                        subtitle="Plan your purchases based on your meal ingredients"
                        actionLabel="View shopping list"
                        onAction={() => navigate("/shopping-list")}
                        icon={<ShoppingCart size={18} />}
                    >

                        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-5 sm:p-6">

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                <div className="flex items-start gap-4">

                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                                        <ShoppingBasket size={24} />
                                    </div>

                                    <div>
                                        <h3 className="font-extrabold text-slate-900">
                                            Your shopping list starts here!
                                        </h3>

                                        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                                            Generate a shopping list from
                                            your selected recipes. PlateWise
                                            will help you identify ingredients
                                            that are missing from your pantry.
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">

                                            <span className="flex items-center gap-1">
                                                <CircleCheck
                                                    size={14}
                                                    className="text-emerald-600"
                                                />
                                                Find missing ingredients
                                            </span>

                                            <span className="flex items-center gap-1">
                                                <CircleCheck
                                                    size={14}
                                                    className="text-emerald-600"
                                                />
                                                Track purchased items
                                            </span>

                                        </div>

                                        <p className="mt-3 text-xs font-bold text-emerald-700">
                                            {loadingPantry
                                                ? "Loading shopping list..."
                                                : `${pendingShoppingItems} item(s) waiting to be purchased`}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/shopping-list")
                                    }
                                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
                                >
                                    View list
                                    <ArrowRight size={16} />
                                </button>

                            </div>
                        </div>
                    </SectionCard>
                </section>

                {/* Today's focus */}
                <section className="mt-6">

                    <div className="overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">

                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                            <div className="flex items-start gap-4">

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                                    <Target
                                        size={23}
                                        className="text-emerald-300"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-300">
                                        Today's focus
                                    </p>

                                    <h2 className="mt-1 text-xl font-black">
                                        {getFocusTitle(
                                            goalType,
                                            proteinRemaining
                                        )}
                                    </h2>

                                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">
                                        {getFocusDescription(
                                            goalType,
                                            proteinRemaining
                                        )}
                                    </p>
                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/food-log")
                                }
                                className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-emerald-50"
                            >
                                Start tracking
                                <ArrowRight size={16} />
                            </button>

                        </div>
                    </div>
                </section>

                {/* Disclaimer */}
                <p className="mx-auto mt-7 max-w-3xl text-center text-[11px] leading-5 text-slate-400">
                    PlateWise provides general nutrition tracking and
                    estimates for personal use. It is not medical advice,
                    diagnosis, or a substitute for professional care.
                </p>

            </div>
        </div>
    );
}

/* =========================================================
   PROGRESS CARD
========================================================= */

function ProgressCard({
    icon,
    iconClass,
    title,
    value,
    target,
    unit,
    progress,
    remaining,
    progressClass,
}: {
    icon: ReactNode;
    iconClass: string;
    title: string;
    value: string;
    target: number;
    unit: string;
    progress: number;
    remaining: string;
    progressClass: string;
}) {
    return (
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">

            <div className="flex items-start justify-between">

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
                >
                    {icon}
                </div>

                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Daily
                </span>

            </div>

            <p className="mt-5 text-sm font-bold text-slate-500">
                {title}
            </p>

            <div className="mt-1 flex items-baseline gap-1">

                <span className="text-3xl font-black tracking-tight text-slate-950">
                    {value}
                </span>

                <span className="text-sm font-bold text-slate-400">
                    / {target || "—"} {unit}
                </span>

            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">

                <div
                    className={`h-full rounded-full transition-all duration-500 ${progressClass}`}
                    style={{ width: `${progress}%` }}
                />

            </div>

            <div className="mt-2 flex items-center justify-between">

                <span className="text-xs font-bold text-slate-500">
                    {Math.round(progress)}% complete
                </span>

                <span className="text-xs font-semibold text-slate-400">
                    {remaining}
                </span>

            </div>
        </div>
    );
}

/* =========================================================
   GOAL CARD
========================================================= */

function GoalCard({
    goalType,
    currentWeight,
    targetWeight,
    weightProgress,
    difference,
}: {
    goalType: string;
    currentWeight: number | null;
    targetWeight: number | null;
    weightProgress: number;
    difference: number | null;
}) {
    const goalLabel =
        goalType === "gain"
            ? "Weight gain"
            : goalType === "lose"
                ? "Weight loss"
                : "Maintain weight";

    return (
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">

            <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <Weight size={21} />
                </div>

                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-600">
                    Goal
                </span>

            </div>

            <p className="mt-5 text-sm font-bold text-slate-500">
                {goalLabel}
            </p>

            <div className="mt-1 flex items-baseline gap-2">

                <span className="text-3xl font-black tracking-tight text-slate-950">
                    {currentWeight ?? "—"}
                </span>

                <span className="text-sm font-bold text-slate-400">
                    kg
                </span>

                {targetWeight !== null && (
                    <>
                        <ArrowRight
                            size={15}
                            className="text-slate-300"
                        />

                        <span className="text-lg font-black text-violet-600">
                            {targetWeight} kg
                        </span>
                    </>
                )}

            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">

                <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-500"
                    style={{
                        width:
                            goalType === "maintain"
                                ? "100%"
                                : `${weightProgress}%`,
                    }}
                />

            </div>

            <div className="mt-2 flex justify-between">

                <span className="text-xs font-bold text-slate-500">
                    {goalType === "maintain"
                        ? "Maintenance goal"
                        : difference !== null
                            ? `${difference.toFixed(1)} kg to target`
                            : "Target not set"}
                </span>

                <span className="text-xs font-bold text-violet-600">
                    {goalType === "maintain"
                        ? "Active"
                        : "Tracking soon"}
                </span>

            </div>
        </div>
    );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
    title,
    subtitle,
    actionLabel,
    onAction,
    icon,
    children,
}: {
    title: string;
    subtitle: string;
    actionLabel?: string;
    onAction?: () => void;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 flex items-start justify-between gap-4">

                <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        {icon}
                    </div>

                    <div>
                        <h2 className="font-black text-slate-900">
                            {title}
                        </h2>

                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                            {subtitle}
                        </p>
                    </div>

                </div>

                {actionLabel && onAction && (
                    <button
                        type="button"
                        onClick={onAction}
                        className="hidden items-center gap-1 text-xs font-extrabold text-emerald-700 hover:text-emerald-800 sm:flex"
                    >
                        {actionLabel}
                        <ChevronRight size={15} />
                    </button>
                )}

            </div>

            {children}

        </div>
    );
}

/* =========================================================
   MEAL ROW
========================================================= */

function MealRow({
    meal,
    icon,
    foodNames,
    loading,
    onClick,
}: {
    meal: string;
    icon: string;
    foodNames: string;
    loading: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
        >

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                {icon}
            </div>

            <div className="min-w-0 flex-1">

                <p className="text-sm font-extrabold text-slate-900">
                    {meal}
                </p>

                <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                    {loading
                        ? "Loading..."
                        : foodNames || "Nothing logged yet"}
                </p>

            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm transition group-hover:text-emerald-600">
                <Plus size={15} />
            </div>

        </button>
    );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
    icon,
    title,
    description,
    onClick,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
        >

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                {icon}
            </div>

            <div className="min-w-0 flex-1">

                <p className="text-sm font-extrabold text-slate-900">
                    {title}
                </p>

                <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    {description}
                </p>

            </div>

            <ChevronRight
                size={16}
                className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
            />

        </button>
    );
}

/* =========================================================
   MINI INFO CARD
========================================================= */

function MiniInfoCard({
    icon,
    label,
    value,
    description,
}: {
    icon: string;
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">

            <div className="flex items-center gap-2">

                <span className="text-lg">
                    {icon}
                </span>

                <span className="text-xs font-bold text-slate-500">
                    {label}
                </span>

            </div>

            <p className="mt-2 text-2xl font-black text-slate-900">
                {value}
            </p>

            <p className="text-[11px] font-medium text-slate-400">
                {description}
            </p>

        </div>
    );
}

/* =========================================================
   FOCUS HELPERS
========================================================= */

function getFocusTitle(
    goalType: string,
    proteinRemaining: number
) {
    if (proteinRemaining > 0) {
        return `You have ${proteinRemaining.toFixed(1)} g of protein left today`;
    }

    if (goalType === "gain") {
        return "Focus on meeting your protein target";
    }

    if (goalType === "lose") {
        return "Choose filling, protein-rich meals";
    }

    return "Keep your meals balanced today";
}

function getFocusDescription(
    goalType: string,
    proteinRemaining: number
) {
    if (proteinRemaining > 0) {
        return "Log your meals as you go and PlateWise will keep your daily progress up to date.";
    }

    if (goalType === "gain") {
        return "Choose nutrient-dense meals and use your pantry ingredients to build balanced meals.";
    }

    if (goalType === "lose") {
        return "Prioritize protein-rich, filling foods while keeping your daily targets in view.";
    }

    return "Keep tracking your meals and make use of the ingredients already available in your pantry.";
}
