import { useEffect, useRef, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { apiGet, apiPost } from "../lib/api";
import PageHeader from "../components/PageHeader";

interface DailyData {
    date: string;
    day: string;
    calories: number;
    protein: number;
    mealsLogged: number;
}

interface WeeklyResponse {
    summary: {
        totalCalories: number;
        totalProtein: number;
        averageCalories: number;
        averageProtein: number;
        loggedDays: number;
    };
    goals: {
        calorieTarget: number | null;
        proteinTarget: number | null;
        calorieGoalDays: number;
        proteinGoalDays: number;
    };
    dailyData: DailyData[];
    mealBreakdown: {
        BREAKFAST: number;
        LUNCH: number;
        DINNER: number;
        SNACK: number;
    };
}

interface AIInsights {
    weeklyOverview: string;
    strengths: string[];
    areasToImprove: string[];
    recommendations: string[];
    sriLankanFoodSuggestions: string[];
    nextWeekPlan: string[];
    disclaimer: string;
}

interface AIResponse {
    success: boolean;
    period: {
        startDate: string;
        endDate: string;
        days: number;
    };
    insights: AIInsights;
}

const COLORS = ["#84CC16", "#22C55E", "#14B8A6", "#F59E0B"];

export default function Insights() {
    const [data, setData] = useState<WeeklyResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // AI Advisor states
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    // Prevent duplicate AI requests
    const aiRequestRef = useRef(false);

    // Load weekly insights
    useEffect(() => {
        const loadInsights = async () => {
            try {
                setLoading(true);
                setError("");

                const result = await apiGet<WeeklyResponse>("/api/food-logs/weekly");
                setData(result);
            } catch (err) {
                console.error("Failed to load insights:", err);
                setError("Unable to load your weekly insights. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadInsights();
    }, []);

    // Generate Gemini AI nutrition insights
    const generateAIInsights = async () => {
        // Prevent multiple simultaneous requests
        if (aiRequestRef.current) return;

        aiRequestRef.current = true;

        try {
            setAiLoading(true);
            setAiError("");

            const result = await apiPost<AIResponse>("/api/ai-insights/weekly", {});

            if (!result.success || !result.insights) {
                throw new Error("Invalid AI response. Please try again.");
            }

            setAiInsights(result.insights);
        } catch (err) {
            console.error("Failed to generate AI insights:", err);
            setAiError(
                err instanceof Error
                    ? err.message
                    : "Unable to generate AI insights. Please try again."
            );
        } finally {
            setAiLoading(false);
            aiRequestRef.current = false;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="flex min-h-[60vh] items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-green-600" />
                            <p className="mt-4 text-sm text-gray-500">
                                Preparing your weekly insights...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                        <p className="font-medium text-red-700">
                            {error || "No insights available."}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { summary, goals, dailyData, mealBreakdown } = data;

    const mealData = [
        { name: "Breakfast", value: mealBreakdown.BREAKFAST },
        { name: "Lunch", value: mealBreakdown.LUNCH },
        { name: "Dinner", value: mealBreakdown.DINNER },
        { name: "Snacks", value: mealBreakdown.SNACK },
    ].filter((meal) => meal.value > 0);

    const calorieProgress = goals.calorieTarget
        ? Math.min((summary.averageCalories / goals.calorieTarget) * 100, 100)
        : 0;

    const proteinProgress = goals.proteinTarget
        ? Math.min((summary.averageProtein / goals.proteinTarget) * 100, 100)
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="space-y-7 pb-10">
                    {/* Page Header */}
                    <PageHeader
                        title="Weekly Insights"
                        description="Understand your nutrition habits, monitor your progress, and discover ways to build healthier eating habits."
                    />

                    {/* AI Nutrition Advisor */}
                    <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 sm:p-7">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-4">

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-bold text-gray-800">
                                                AI Nutrition Advisor
                                            </h2>

                                        </div>
                                        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                                            Get personalized nutrition insights based on your weekly food logs, goals and dietary preferences.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={generateAIInsights}
                                    disabled={aiLoading}
                                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {aiLoading ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            ✨
                                            {aiInsights ? "Regenerate Insights" : "Generate AI Insights"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* AI Loading */}
                        {aiLoading && (
                            <div className="p-8 text-center">
                                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-green-100 border-t-green-600" />
                                <p className="mt-4 font-medium text-gray-700">
                                    Analyzing your nutrition data...
                                </p>
                                <p className="mt-1 text-sm text-gray-400">
                                    Your personalized recommendations are being prepared.
                                </p>
                                <p className="mt-2 text-xs text-gray-400">
                                    Please wait while Gemini analyzes your weekly data.
                                </p>
                            </div>
                        )}

                        {/* AI Error */}
                        {aiError && !aiLoading && (
                            <div className="m-5 rounded-xl border border-red-100 bg-red-50 p-4">
                                <p className="text-sm text-red-700">{aiError}</p>
                                <button
                                    onClick={generateAIInsights}
                                    disabled={aiLoading}
                                    className="mt-3 text-sm font-semibold text-red-700 underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* AI Results */}
                        {aiInsights && !aiLoading && (
                            <div className="space-y-6 p-5 sm:p-7">
                                <div>
                                    <h3 className="flex items-center gap-2 font-bold text-gray-800">
                                        <span className="text-xl">📊</span>
                                        Weekly Overview
                                    </h3>
                                    <p className="mt-3 rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-600">
                                        {aiInsights.weeklyOverview}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <AIListCard
                                        title="Your Strengths"
                                        icon="💚"
                                        items={aiInsights.strengths}
                                        color="green"
                                    />
                                    <AIListCard
                                        title="Areas to Improve"
                                        icon="🎯"
                                        items={aiInsights.areasToImprove}
                                        color="orange"
                                    />
                                </div>

                                <AIListCard
                                    title="Personalized Recommendations"
                                    icon="💡"
                                    items={aiInsights.recommendations}
                                    color="blue"
                                />

                                <AIListCard
                                    title="Sri Lankan Food Suggestions"
                                    icon="🍛"
                                    items={aiInsights.sriLankanFoodSuggestions}
                                    color="green"
                                />

                                <AIListCard
                                    title="Your Next Week Plan"
                                    icon="📅"
                                    items={aiInsights.nextWeekPlan}
                                    color="purple"
                                />

                                <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4">
                                    <p className="text-xs leading-6 text-yellow-800">
                                        <strong>Important: </strong>
                                        {aiInsights.disclaimer}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Initial State */}
                        {!aiInsights && !aiLoading && !aiError && (
                            <div className="p-7 text-center">
                                <p className="text-3xl">🌱</p>
                                <p className="mt-3 font-semibold text-gray-700">
                                    Ready to understand your nutrition better?
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Generate your personalized AI nutrition report.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            title="Average Calories"
                            value={summary.averageCalories.toLocaleString()}
                            unit="kcal / day"
                            icon="🔥"
                            color="bg-orange-50"
                            iconColor="text-orange-600"
                        />
                        <SummaryCard
                            title="Average Protein"
                            value={`${summary.averageProtein}`}
                            unit="g / day"
                            icon="💪"
                            color="bg-blue-50"
                            iconColor="text-blue-600"
                        />
                        <SummaryCard
                            title="Total Calories"
                            value={summary.totalCalories.toLocaleString()}
                            unit="kcal this week"
                            icon="⚡"
                            color="bg-yellow-50"
                            iconColor="text-yellow-600"
                        />
                        <SummaryCard
                            title="Active Logging Days"
                            value={`${summary.loggedDays}/7`}
                            unit="days logged"
                            icon="📅"
                            color="bg-green-50"
                            iconColor="text-green-600"
                        />
                    </div>

                    {/* Daily Calories Chart */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-800">
                                Daily Calorie Intake
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Track your calorie intake over the last 7 days.
                            </p>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="calories"
                                        name="Calories"
                                        fill="#84CC16"
                                        radius={[7, 7, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {goals.calorieTarget && (
                            <p className="mt-3 text-sm text-gray-500">
                                Daily calorie target:{" "}
                                <span className="font-semibold text-green-700">
                                    {goals.calorieTarget} kcal
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Protein Chart */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-800">
                                Daily Protein Intake
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                See how consistently you meet your protein needs.
                            </p>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="protein"
                                        name="Protein (g)"
                                        stroke="#0D9488"
                                        strokeWidth={3}
                                        dot={{ r: 5 }}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        {goals.proteinTarget && (
                            <p className="mt-3 text-sm text-gray-500">
                                Daily protein target:{" "}
                                <span className="font-semibold text-teal-700">
                                    {goals.proteinTarget} g
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Goals and Meal Breakdown */}
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800">
                                Goal Achievement
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Your progress towards daily nutrition targets.
                            </p>
                            <div className="mt-7 space-y-7">
                                <GoalProgress
                                    title="Calorie Goal"
                                    achieved={goals.calorieGoalDays}
                                    target={7}
                                    progress={calorieProgress}
                                    color="bg-orange-500"
                                    goalValue={
                                        goals.calorieTarget
                                            ? `${goals.calorieTarget} kcal/day`
                                            : "Not set"
                                    }
                                />
                                <GoalProgress
                                    title="Protein Goal"
                                    achieved={goals.proteinGoalDays}
                                    target={7}
                                    progress={proteinProgress}
                                    color="bg-teal-500"
                                    goalValue={
                                        goals.proteinTarget
                                            ? `${goals.proteinTarget} g/day`
                                            : "Not set"
                                    }
                                />
                            </div>
                            <div className="mt-7 rounded-xl bg-green-50 p-4">
                                <p className="text-sm font-medium text-green-800">
                                    Keep building healthy habits!
                                </p>
                                <p className="mt-1 text-xs text-green-700">
                                    Consistent food logging helps you understand your nutrition patterns over time.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800">
                                Meal Breakdown
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Calories contributed by each meal type.
                            </p>
                            {mealData.length > 0 ? (
                                <>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={mealData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={95}
                                                    paddingAngle={4}
                                                >
                                                    {mealData.map((entry, index) => (
                                                        <Cell
                                                            key={entry.name}
                                                            fill={COLORS[index % COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3">
                                        {mealData.map((meal, index) => (
                                            <div
                                                key={meal.name}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="h-3 w-3 rounded-full"
                                                        style={{
                                                            backgroundColor: COLORS[index % COLORS.length],
                                                        }}
                                                    />
                                                    <span className="text-gray-600">{meal.name}</span>
                                                </div>
                                                <span className="font-semibold text-gray-800">
                                                    {meal.value.toLocaleString()} kcal
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                                    No meal data available for this week.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Weekly Summary */}
                    <div className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 p-6 text-white shadow-sm">
                        <p className="text-sm font-medium text-green-100">
                            YOUR WEEKLY SUMMARY
                        </p>
                        <h2 className="mt-2 text-2xl font-bold">
                            {summary.loggedDays === 7
                                ? "Amazing consistency! 🎉"
                                : summary.loggedDays >= 4
                                    ? "Great progress! 🌱"
                                    : summary.loggedDays > 0
                                        ? "Keep going! 💚"
                                        : "Start your nutrition journey! 🌿"}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-green-50">
                            You logged your meals on {summary.loggedDays} out of 7 days.
                            Continue tracking your meals to better understand your nutrition habits and progress.
                        </p>
                    </div>

                    <p className="text-center text-xs text-gray-400">
                        Nutrition estimates are for personal tracking and are not a substitute for professional medical advice.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ----------------------------------
   AI List Card
---------------------------------- */

function AIListCard({
    title,
    icon,
    items,
    color,
}: {
    title: string;
    icon: string;
    items: string[];
    color: "green" | "orange" | "blue" | "purple";
}) {
    const colorStyles = {
        green: "bg-green-50 border-green-100",
        orange: "bg-orange-50 border-orange-100",
        blue: "bg-blue-50 border-blue-100",
        purple: "bg-purple-50 border-purple-100",
    };

    return (
        <div className={`rounded-xl border p-5 ${colorStyles[color]}`}>
            <h3 className="flex items-center gap-2 font-bold text-gray-800">
                <span className="text-xl">{icon}</span>
                {title}
            </h3>
            {items.length > 0 ? (
                <ul className="mt-4 space-y-3">
                    {items.map((item, index) => (
                        <li
                            key={index}
                            className="flex items-start gap-2 text-sm leading-6 text-gray-700"
                        >
                            <span className="mt-1 text-green-600">✓</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-sm text-gray-500">
                    No information available.
                </p>
            )}
        </div>
    );
}

/* ----------------------------------
   Summary Card
---------------------------------- */

function SummaryCard({
    title,
    value,
    unit,
    icon,
    color,
    iconColor,
}: {
    title: string;
    value: string;
    unit: string;
    icon: string;
    color: string;
    iconColor: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold text-gray-800">
                        {value}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">{unit}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                    <span className={`text-2xl ${iconColor}`}>{icon}</span>
                </div>
            </div>
        </div>
    );
}

/* ----------------------------------
   Goal Progress
---------------------------------- */

function GoalProgress({
    title,
    achieved,
    target,
    progress,
    color,
    goalValue,
}: {
    title: string;
    achieved: number;
    target: number;
    progress: number;
    color: string;
    goalValue: string;
}) {
    return (
        <div>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-gray-800">{title}</p>
                    <p className="mt-1 text-xs text-gray-400">{goalValue}</p>
                </div>
                <span className="text-sm font-bold text-gray-700">
                    {achieved}/{target} days
                </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
