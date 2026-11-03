
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import PageHeader from "../components/PageHeader";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

type RecipeIngredient = {
    id: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    isOptional: boolean;
};

type Recipe = {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    mealType: MealType;
    cuisine: string | null;
    servings: number;
    prepTimeMinutes: number | null;
    caloriesPerServing: number;
    proteinPerServing: number;
    carbsPerServing: number | null;
    fatPerServing: number | null;
    instructions: string;
    ingredients: RecipeIngredient[];
};

type RecommendedRecipe = Recipe & {
    matchScore: number;
    matchedIngredients: string[];
    pantryMatchPercentage: number;
    matchReasons: string[];
};

type RecommendationsResponse = {
    count: number;
    recommendations: RecommendedRecipe[];
    profileSummary: {
        goalType: string | null;
        calorieTarget: number | null;
        proteinTarget: number | null;
        allergies: string[];
        dietaryPreferences: string[];
    };
};

type RecipesResponse = {
    recipes?: Recipe[];
};

const filters = [
    { label: "All Recipes", value: "ALL" },
    { label: "Breakfast", value: "BREAKFAST" },
    { label: "Lunch", value: "LUNCH" },
    { label: "Dinner", value: "DINNER" },
    { label: "Snacks", value: "SNACK" },
];

const mealIcons: Record<MealType, string> = {
    BREAKFAST: "🌅",
    LUNCH: "☀️",
    DINNER: "🌙",
    SNACK: "🍎",
};

export default function Recipes() {
    // All recipes
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [mealType, setMealType] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    // All recipes loading and error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [recipeRefresh, setRecipeRefresh] = useState(0);

    // Personalized recommendations
    const [recommendations, setRecommendations] = useState<
        RecommendedRecipe[]
    >([]);

    const [recommendationsLoading, setRecommendationsLoading] =
        useState(true);

    const [recommendationsError, setRecommendationsError] = useState("");

    const [recommendationRefresh, setRecommendationRefresh] = useState(0);

    // Load all recipes
    useEffect(() => {
        let cancelled = false;

        async function loadRecipes() {
            try {
                setLoading(true);
                setError("");

                const params = new URLSearchParams();

                if (mealType !== "ALL") {
                    params.set("mealType", mealType);
                }

                if (search.trim()) {
                    params.set("search", search.trim());
                }

                const query = params.toString();

                const path = query
                    ? `/api/recipes?${query}`
                    : "/api/recipes";

                const response = await apiGet<
                    RecipesResponse | Recipe[]
                >(path);

                const recipeList = Array.isArray(response)
                    ? response
                    : response.recipes ?? [];

                if (!cancelled) {
                    setRecipes(recipeList);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load recipes."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadRecipes();

        return () => {
            cancelled = true;
        };
    }, [mealType, search, recipeRefresh]);

    // Load personalized recommendations
    useEffect(() => {
        let cancelled = false;

        async function loadRecommendations() {
            try {
                setRecommendationsLoading(true);
                setRecommendationsError("");

                const response = await apiGet<RecommendationsResponse>(
                    "/api/recipes/recommendations"
                );

                if (!cancelled) {
                    setRecommendations(
                        response.recommendations ?? []
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setRecommendationsError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load personalized recommendations."
                    );
                }
            } finally {
                if (!cancelled) {
                    setRecommendationsLoading(false);
                }
            }
        }

        loadRecommendations();

        return () => {
            cancelled = true;
        };
    }, [recommendationRefresh]);

    // Recipe card
    const renderRecipeCard = (recipe: Recipe) => (
        <article
            key={recipe.id}
            className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
            <div className="relative h-48 bg-gradient-to-br from-green-100 to-lime-50">
                {recipe.imageUrl ? (
                    <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-6xl">
                        {mealIcons[recipe.mealType]}
                    </div>
                )}

                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-green-800 shadow-sm">
                    {recipe.mealType.toLowerCase()}
                </span>
            </div>

            <div className="p-5">
                <h2 className="mb-2 text-lg font-bold text-slate-900">
                    {recipe.name}
                </h2>

                <p className="mb-4 min-h-10 text-sm leading-5 text-slate-500">
                    {recipe.description ||
                        "A delicious meal idea to try."}
                </p>

                <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-orange-50 p-3">
                        <p className="text-xs text-slate-500">
                            Calories
                        </p>
                        <p className="mt-1 font-bold text-orange-700">
                            {Math.round(recipe.caloriesPerServing)} kcal
                        </p>
                    </div>

                    <div className="rounded-xl bg-green-50 p-3">
                        <p className="text-xs text-slate-500">
                            Protein
                        </p>
                        <p className="mt-1 font-bold text-green-700">
                            {Math.round(recipe.proteinPerServing)} g
                        </p>
                    </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                    {recipe.prepTimeMinutes != null && (
                        <span>
                            ⏱ {recipe.prepTimeMinutes} min
                        </span>
                    )}

                    <span>
                        🍽 {recipe.servings} servings
                    </span>

                    {recipe.cuisine && (
                        <span>🌍 {recipe.cuisine}</span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setSelectedRecipe(recipe)}
                    className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                    View Recipe →
                </button>
            </div>
        </article>
    );

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <main className="mx-auto max-w-7xl">

                {/* Page Header */}

                <PageHeader
                    title="Meals & Recipes"
                    description="Discover delicious meal ideas and explore their nutritional information to help you make better food choices."
                />

                {/* Personalized Recommendations */}

                <section className="mb-14">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-emerald-700">
                                Made for your goals
                            </p>

                            <h2 className="text-2xl font-bold text-slate-900">
                                Recommended for You ✨
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Meal ideas based on your nutrition goals
                                and pantry ingredients.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setRecommendationRefresh(
                                    (current) => current + 1
                                )
                            }
                            disabled={recommendationsLoading}
                            className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    {/* Recommendation loading */}

                    {recommendationsLoading && (
                        <div className="rounded-2xl border border-emerald-100 bg-white p-10 text-center">
                            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />

                            <p className="text-sm text-slate-500">
                                Finding meals for your goals...
                            </p>
                        </div>
                    )}

                    {/* Recommendation error */}

                    {!recommendationsLoading &&
                        recommendationsError && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                                <p className="font-semibold text-red-700">
                                    Could not load recommendations
                                </p>

                                <p className="mt-2 text-sm text-red-600">
                                    {recommendationsError}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setRecommendationRefresh(
                                            (current) => current + 1
                                        )
                                    }
                                    className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                    {/* No recommendations */}

                    {!recommendationsLoading &&
                        !recommendationsError &&
                        recommendations.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center">
                                <div className="mb-3 text-4xl">
                                    🥗
                                </div>

                                <h3 className="font-bold text-slate-800">
                                    No personalized recommendations yet
                                </h3>

                                <p className="mt-2 text-sm text-slate-500">
                                    Add recipes with suitable dietary tags
                                    and ingredients, and update your pantry
                                    to get better recommendations.
                                </p>
                            </div>
                        )}

                    {/* Recommendation cards */}

                    {!recommendationsLoading &&
                        !recommendationsError &&
                        recommendations.length > 0 && (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {recommendations.map((recipe) => (
                                    <article
                                        key={recipe.id}
                                        className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <div className="relative h-48 bg-gradient-to-br from-green-100 to-lime-50">
                                            {recipe.imageUrl ? (
                                                <img
                                                    src={recipe.imageUrl}
                                                    alt={recipe.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-6xl">
                                                    {mealIcons[recipe.mealType]}
                                                </div>
                                            )}

                                            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow">
                                                ✨ Recommended
                                            </span>

                                            <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow">
                                                {recipe.matchScore}% match
                                            </span>
                                        </div>

                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-slate-900">
                                                {recipe.name}
                                            </h3>

                                            <p className="mt-1 min-h-10 text-sm text-slate-500">
                                                {recipe.description ||
                                                    "A meal suggestion based on your profile."}
                                            </p>

                                            {/* Nutrition */}

                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                <div className="rounded-xl bg-orange-50 p-3">
                                                    <p className="text-xs text-slate-500">
                                                        Calories
                                                    </p>

                                                    <p className="mt-1 font-bold text-orange-700">
                                                        {Math.round(
                                                            recipe.caloriesPerServing
                                                        )} kcal
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-green-50 p-3">
                                                    <p className="text-xs text-slate-500">
                                                        Protein
                                                    </p>

                                                    <p className="mt-1 font-bold text-green-700">
                                                        {Math.round(
                                                            recipe.proteinPerServing
                                                        )} g
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Pantry match */}

                                            <div className="mt-4">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-slate-600">
                                                        Pantry ingredients
                                                    </span>

                                                    <span className="text-xs font-bold text-emerald-700">
                                                        {recipe.pantryMatchPercentage}%
                                                    </span>
                                                </div>

                                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-600"
                                                        style={{
                                                            width: `${recipe.pantryMatchPercentage}%`,
                                                        }}
                                                    />
                                                </div>

                                                {recipe.matchedIngredients.length > 0 ? (
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Available:{" "}
                                                        {recipe.matchedIngredients.join(
                                                            ", "
                                                        )}
                                                    </p>
                                                ) : (
                                                    <p className="mt-2 text-xs text-slate-400">
                                                        No matching pantry ingredients found.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Recommendation reasons */}

                                            {recipe.matchReasons.length > 0 && (
                                                <div className="mt-4 space-y-1">
                                                    {recipe.matchReasons
                                                        .slice(0, 2)
                                                        .map((reason, index) => (
                                                            <p
                                                                key={index}
                                                                className="text-xs text-slate-500"
                                                            >
                                                                ✓ {reason}
                                                            </p>
                                                        ))}
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedRecipe(recipe)
                                                }
                                                className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                            >
                                                View Recipe →
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                </section>

                {/* All Recipes */}

                <section className="mb-6 border-t border-emerald-100 pt-10">
                    <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-700">
                        Discover more
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900">
                        All Recipes 🍲
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Explore all available meals and find your favourites.
                    </p>
                </section>

                {/* Search */}

                <section className="mb-6">
                    <div className="relative max-w-xl">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                            🔍
                        </span>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search recipes..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                </section>

                {/* Meal Type Filters */}

                <section className="mb-8 flex flex-wrap gap-3">
                    {filters.map((filter) => (
                        <button
                            type="button"
                            key={filter.value}
                            onClick={() => setMealType(filter.value)}
                            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${mealType === filter.value
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800"
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </section>

                {/* Recipe Count */}

                {!loading && !error && (
                    <p className="mb-5 text-sm text-slate-500">
                        {recipes.length}{" "}
                        {recipes.length === 1 ? "recipe" : "recipes"} found
                    </p>
                )}

                {/* All Recipes Loading */}

                {loading && (
                    <div className="flex min-h-64 items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />

                            <p className="text-sm text-slate-500">
                                Loading recipes...
                            </p>
                        </div>
                    </div>
                )}

                {/* All Recipes Error */}

                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="font-semibold text-red-700">
                            Could not load recipes
                        </p>

                        <p className="mt-2 text-sm text-red-600">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setRecipeRefresh((current) => current + 1)
                            }
                            className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* All Recipes Empty */}

                {!loading && !error && recipes.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-16 text-center">
                        <div className="mb-4 text-5xl">
                            🥗
                        </div>

                        <h2 className="text-xl font-bold text-slate-800">
                            No recipes found
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Try another search term or choose a different
                            meal category.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setMealType("ALL");
                            }}
                            className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            View all recipes
                        </button>
                    </div>
                )}

                {/* All Recipe Cards */}

                {!loading && !error && recipes.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {recipes.map((recipe) =>
                            renderRecipeCard(recipe)
                        )}
                    </div>
                )}
            </main>

            {/* Recipe Details Modal */}

            {selectedRecipe && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setSelectedRecipe(null)}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}

                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                                    {selectedRecipe.mealType.toLowerCase()}
                                </p>

                                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                                    {selectedRecipe.name}
                                </h2>

                                {selectedRecipe.description && (
                                    <p className="mt-2 text-sm text-slate-500">
                                        {selectedRecipe.description}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedRecipe(null)}
                                aria-label="Close recipe details"
                                className="rounded-full bg-slate-100 px-3 py-1.5 text-lg text-slate-600 hover:bg-slate-200"
                            >
                                ×
                            </button>
                        </div>

                        {/* Recipe Image */}

                        {selectedRecipe.imageUrl && (
                            <img
                                src={selectedRecipe.imageUrl}
                                alt={selectedRecipe.name}
                                className="mb-6 h-56 w-full rounded-2xl object-cover"
                            />
                        )}

                        {/* Nutrition Information */}

                        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-xl bg-orange-50 p-3">
                                <p className="text-xs text-slate-500">
                                    Calories
                                </p>

                                <p className="font-bold text-orange-700">
                                    {Math.round(
                                        selectedRecipe.caloriesPerServing
                                    )} kcal
                                </p>
                            </div>

                            <div className="rounded-xl bg-green-50 p-3">
                                <p className="text-xs text-slate-500">
                                    Protein
                                </p>

                                <p className="font-bold text-green-700">
                                    {Math.round(
                                        selectedRecipe.proteinPerServing
                                    )} g
                                </p>
                            </div>

                            <div className="rounded-xl bg-blue-50 p-3">
                                <p className="text-xs text-slate-500">
                                    Carbs
                                </p>

                                <p className="font-bold text-blue-700">
                                    {selectedRecipe.carbsPerServing ?? "—"} g
                                </p>
                            </div>

                            <div className="rounded-xl bg-purple-50 p-3">
                                <p className="text-xs text-slate-500">
                                    Fat
                                </p>

                                <p className="font-bold text-purple-700">
                                    {selectedRecipe.fatPerServing ?? "—"} g
                                </p>
                            </div>
                        </div>

                        {/* Ingredients */}

                        <section className="mb-6">
                            <h3 className="mb-3 text-lg font-bold text-slate-900">
                                Ingredients
                            </h3>

                            {selectedRecipe.ingredients.length > 0 ? (
                                <ul className="space-y-2">
                                    {selectedRecipe.ingredients.map(
                                        (ingredient) => (
                                            <li
                                                key={ingredient.id}
                                                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm"
                                            >
                                                <span className="text-slate-700">
                                                    {ingredient.ingredientName}

                                                    {ingredient.isOptional && (
                                                        <span className="ml-2 text-xs text-slate-400">
                                                            (Optional)
                                                        </span>
                                                    )}
                                                </span>

                                                <span className="shrink-0 font-semibold text-slate-600">
                                                    {ingredient.quantity}{" "}
                                                    {ingredient.unit}
                                                </span>
                                            </li>
                                        )
                                    )}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    Ingredient details are not available.
                                </p>
                            )}
                        </section>

                        {/* Preparation */}

                        <section>
                            <h3 className="mb-3 text-lg font-bold text-slate-900">
                                Preparation
                            </h3>

                            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                                {selectedRecipe.instructions}
                            </p>
                        </section>

                        {/* Close */}

                        <button
                            type="button"
                            onClick={() => setSelectedRecipe(null)}
                            className="mt-7 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
