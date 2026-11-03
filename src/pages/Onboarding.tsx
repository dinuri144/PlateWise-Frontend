
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
    Leaf,
    ArrowRight,
    ArrowLeft,
    Calculator,
    Target,
    Flame,
    Dumbbell,
    Check,
    Sparkles,
    Scale,
    Beef,
    Wallet,
    CircleCheck,
    AlertCircle,
} from "lucide-react";
import { apiPost, apiPut, type NutritionPreview } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const TOTAL_STEPS = 6;

const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

type GoalType = "gain" | "lose" | "maintain";

type ActivityLevel = {
    value: string;
    title: string;
    description: string;
    days: string;
};

const activityLevels: ActivityLevel[] = [
    {
        value: "sedentary",
        title: "Sedentary",
        description: "Little or no exercise",
        days: "Mostly sitting",
    },
    {
        value: "light",
        title: "Lightly active",
        description: "Exercise 1–3 days/week",
        days: "Light activity",
    },
    {
        value: "moderate",
        title: "Moderately active",
        description: "Exercise 3–5 days/week",
        days: "Regular activity",
    },
    {
        value: "active",
        title: "Very active",
        description: "Exercise 6–7 days/week",
        days: "High activity",
    },
];

const commonAllergies = [
    "Peanuts",
    "Tree nuts",
    "Dairy",
    "Eggs",
    "Soy",
    "Wheat",
    "Fish",
    "Shellfish",
];

const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Pescatarian",
    "Gluten-free",
    "Dairy-free",
    "Halal",
];

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [preview, setPreview] = useState<NutritionPreview | null>(null);

    const { refreshMe } = useAuth();
    const navigate = useNavigate();

    // Personal information
    const [age, setAge] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [currentWeight, setCurrentWeight] = useState("");
    const [activityLevel, setActivityLevel] = useState("moderate");

    // Weight goal
    const [goalType, setGoalType] = useState<GoalType>("maintain");
    const [targetWeight, setTargetWeight] = useState("");

    // Nutrition targets
    const [calorieTarget, setCalorieTarget] = useState("");
    const [proteinTarget, setProteinTarget] = useState("");
    const [weeklyBudget, setWeeklyBudget] = useState("");

    // Food preferences
    const [allergies, setAllergies] = useState<string[]>([]);
    const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
    const [customAllergy, setCustomAllergy] = useState("");

    const selectedActivity = activityLevels.find(
        (item) => item.value === activityLevel
    );

    const bmiStyle = useMemo(() => {
        switch (preview?.bmiCategory) {
            case "underweight":
                return {
                    badge: "bg-amber-50 text-amber-700 border-amber-200",
                    accent: "text-amber-600",
                };

            case "normal":
                return {
                    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    accent: "text-emerald-600",
                };

            case "overweight":
                return {
                    badge: "bg-orange-50 text-orange-700 border-orange-200",
                    accent: "text-orange-600",
                };

            case "obese":
                return {
                    badge: "bg-red-50 text-red-700 border-red-200",
                    accent: "text-red-600",
                };

            default:
                return {
                    badge: "bg-slate-50 text-slate-700 border-slate-200",
                    accent: "text-slate-600",
                };
        }
    }, [preview?.bmiCategory]);

    const toggleAllergy = (value: string) => {
        setAllergies((previous) =>
            previous.includes(value)
                ? previous.filter((item) => item !== value)
                : [...previous, value]
        );
    };

    const toggleDietaryPreference = (value: string) => {
        setDietaryPreferences((previous) =>
            previous.includes(value)
                ? previous.filter((item) => item !== value)
                : [...previous, value]
        );
    };

    const addCustomAllergy = () => {
        const value = customAllergy.trim();

        if (!value) return;

        const alreadyExists = allergies.some(
            (item) => item.toLowerCase() === value.toLowerCase()
        );

        if (!alreadyExists) {
            setAllergies((previous) => [...previous, value]);
        }

        setCustomAllergy("");
    };

    const removeAllergy = (value: string) => {
        setAllergies((previous) =>
            previous.filter((item) => item !== value)
        );
    };

    const fetchPreview = async (goal?: GoalType) => {
        const data = await apiPost<NutritionPreview>(
            "/api/profile/preview",
            {
                age: Number(age),
                heightCm: Number(heightCm),
                currentWeight: Number(currentWeight),
                activityLevel,
                ...(goal ? { goalType: goal } : {}),
                ...(targetWeight
                    ? { targetWeight: Number(targetWeight) }
                    : {}),
            }
        );

        setPreview(data);
        setGoalType(data.goalType);
        setTargetWeight(String(data.targetWeight));
        setCalorieTarget(String(data.suggestedCalories));
        setProteinTarget(String(data.suggestedProtein));

        return data;
    };

    const validateStepOne = () => {
        const ageValue = Number(age);
        const heightValue = Number(heightCm);
        const weightValue = Number(currentWeight);

        if (!age || !heightCm || !currentWeight) {
            setError("Please enter your age, height, and current weight.");
            return false;
        }

        if (!Number.isFinite(ageValue) || ageValue < 13 || ageValue > 120) {
            setError("Please enter a valid age between 13 and 120.");
            return false;
        }

        if (!Number.isFinite(heightValue) || heightValue < 100 || heightValue > 250) {
            setError("Please enter a valid height between 100 and 250 cm.");
            return false;
        }

        if (!Number.isFinite(weightValue) || weightValue < 30 || weightValue > 300) {
            setError("Please enter a valid weight between 30 and 300 kg.");
            return false;
        }

        return true;
    };

    const goNext = async () => {
        setError("");

        try {
            if (step === 1) {
                if (!validateStepOne()) return;

                setLoading(true);

                const data = await fetchPreview();

                setGoalType(data.suggestedGoal);
                setStep(2);
                return;
            }

            if (step === 2) {
                setLoading(true);
                await fetchPreview(goalType);
                setStep(3);
                return;
            }

            if (step === 3) {
                const target = Number(targetWeight);
                const current = Number(currentWeight);

                if (!targetWeight || !Number.isFinite(target) || target < 30 || target > 300) {
                    setError("Please enter a valid target weight.");
                    return;
                }

                if (goalType === "gain" && target <= current) {
                    setError("For a weight-gain goal, your target should be higher than your current weight.");
                    return;
                }

                if (goalType === "lose" && target >= current) {
                    setError("For a weight-loss goal, your target should be lower than your current weight.");
                    return;
                }

                if (goalType === "maintain" && Math.abs(target - current) > 2) {
                    setError("For a maintenance goal, choose a target close to your current weight.");
                    return;
                }

                setLoading(true);
                await fetchPreview(goalType);
                setStep(4);
                return;
            }

            if (step === 4) {
                const calories = Number(calorieTarget);
                const protein = Number(proteinTarget);
                const budget = weeklyBudget === "" ? null : Number(weeklyBudget);

                if (
                    !calorieTarget ||
                    !Number.isFinite(calories) ||
                    calories < 800 ||
                    calories > 10000
                ) {
                    setError("Please enter a valid daily calorie target.");
                    return;
                }

                if (
                    !proteinTarget ||
                    !Number.isFinite(protein) ||
                    protein < 20 ||
                    protein > 500
                ) {
                    setError("Please enter a valid daily protein target.");
                    return;
                }

                if (
                    budget !== null &&
                    (!Number.isFinite(budget) || budget < 0)
                ) {
                    setError("Please enter a valid weekly food budget.");
                    return;
                }

                setStep(5);
                return;
            }

            if (step === 5) {
                setStep(6);
            }
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not calculate your nutrition estimates."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setError("");
        setLoading(true);

        try {
            const result = await apiPut<{
                onboardingComplete: boolean;
            }>("/api/profile", {
                age: Number(age),
                heightCm: Number(heightCm),
                currentWeight: Number(currentWeight),
                activityLevel,
                goalType,
                targetWeight: Number(targetWeight),
                calorieTarget: Number(calorieTarget),
                proteinTarget: Number(proteinTarget),
                weeklyBudget: weeklyBudget
                    ? Number(weeklyBudget)
                    : null,
                allergies,
                dietaryPreferences,
            });

            await refreshMe();

            if (result.onboardingComplete) {
                navigate("/dashboard", { replace: true });
            } else {
                setError(
                    "Profile saved, but some required information is still missing."
                );
            }
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not save your profile."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f7fbf8] text-slate-900">
            {/* Background decoration */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-emerald-100/60 blur-3xl" />
                <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-lime-100/50 blur-3xl" />
                <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                            <Leaf className="h-6 w-6" strokeWidth={2.5} />
                        </div>

                        <div>
                            <div className="text-2xl font-black tracking-tight text-slate-900">
                                Plate<span className="text-emerald-600">Wise</span>
                            </div>
                            <p className="hidden text-xs font-semibold text-slate-500 sm:block">
                                Your smarter nutrition journey
                            </p>
                        </div>
                    </div>

                    <div className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
                        Step {step} of {TOTAL_STEPS}
                    </div>
                </header>

                {/* Progress */}
                <div className="mx-auto mt-8 w-full max-w-4xl">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">
                            {getStepTitle(step)}
                        </span>

                        <span className="text-sm font-bold text-slate-500">
                            {Math.round((step / TOTAL_STEPS) * 100)}%
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
                            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Main card */}
                <main className="mx-auto my-8 w-full max-w-4xl flex-1">
                    <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
                        <div className="p-6 sm:p-10 lg:p-12">
                            {error && (
                                <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-600">
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {step === 1 && (
                                <StepOne
                                    age={age}
                                    setAge={setAge}
                                    heightCm={heightCm}
                                    setHeightCm={setHeightCm}
                                    currentWeight={currentWeight}
                                    setCurrentWeight={setCurrentWeight}
                                    activityLevel={activityLevel}
                                    setActivityLevel={setActivityLevel}
                                    selectedActivity={selectedActivity}
                                />
                            )}

                            {step === 2 && preview && (
                                <StepTwo
                                    preview={preview}
                                    bmiStyle={bmiStyle}
                                    goalType={goalType}
                                    setGoalType={setGoalType}
                                />
                            )}

                            {step === 3 && (
                                <StepThree
                                    preview={preview}
                                    targetWeight={targetWeight}
                                    setTargetWeight={setTargetWeight}
                                    currentWeight={currentWeight}
                                    goalType={goalType}
                                />
                            )}

                            {step === 4 && (
                                <StepFour
                                    calorieTarget={calorieTarget}
                                    setCalorieTarget={setCalorieTarget}
                                    proteinTarget={proteinTarget}
                                    setProteinTarget={setProteinTarget}
                                    weeklyBudget={weeklyBudget}
                                    setWeeklyBudget={setWeeklyBudget}
                                />
                            )}

                            {step === 5 && (
                                <StepFive
                                    allergies={allergies}
                                    toggleAllergy={toggleAllergy}
                                    removeAllergy={removeAllergy}
                                    customAllergy={customAllergy}
                                    setCustomAllergy={setCustomAllergy}
                                    addCustomAllergy={addCustomAllergy}
                                    dietaryPreferences={dietaryPreferences}
                                    toggleDietaryPreference={toggleDietaryPreference}
                                />
                            )}

                            {step === 6 && (
                                <StepSix
                                    goalType={goalType}
                                    targetWeight={targetWeight}
                                    calorieTarget={calorieTarget}
                                    proteinTarget={proteinTarget}
                                    weeklyBudget={weeklyBudget}
                                    allergies={allergies}
                                    dietaryPreferences={dietaryPreferences}
                                />
                            )}

                            <div className="mt-8 border-t border-slate-100 pt-5">
                                <p className="text-center text-xs leading-relaxed text-slate-500">
                                    PlateWise provides estimates for personal
                                    tracking and planning. These results are
                                    not medical advice, diagnosis, or a
                                    substitute for professional healthcare.
                                </p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:px-10 lg:px-12">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError("");
                                        setStep((previous) => previous - 1);
                                    }}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                            ) : (
                                <div />
                            )}

                            {step < TOTAL_STEPS ? (
                                <button
                                    type="button"
                                    onClick={goNext}
                                    disabled={loading}
                                    className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? "Calculating..." : "Continue"}

                                    {!loading && (
                                        <ArrowRight
                                            size={18}
                                            className="transition-transform group-hover:translate-x-0.5"
                                        />
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : "Save & continue"}
                                    {!loading && <Check size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="mt-5 text-center text-xs font-semibold text-slate-400">
                        Your information stays private and is used only to
                        personalize your PlateWise experience.
                    </p>
                </main>
            </div>
        </div>
    );
}

/* =========================================================
   STEP 1 - PERSONAL INFORMATION
========================================================= */

function StepOne({
    age,
    setAge,
    heightCm,
    setHeightCm,
    currentWeight,
    setCurrentWeight,
    activityLevel,
    setActivityLevel,
    selectedActivity,
}: {
    age: string;
    setAge: (value: string) => void;
    heightCm: string;
    setHeightCm: (value: string) => void;
    currentWeight: string;
    setCurrentWeight: (value: string) => void;
    activityLevel: string;
    setActivityLevel: (value: string) => void;
    selectedActivity?: ActivityLevel;
}) {
    return (
        <div>
            <SectionHeading
                eyebrow="LET'S GET STARTED"
                title="Tell us about yourself"
                description="We'll use these details to create a personalized starting plan for you."
            />

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <MeasurementInput
                    label="Age"
                    unit="yrs"
                    value={age}
                    onChange={setAge}
                    placeholder="25"
                    min={13}
                    max={120}
                />

                <MeasurementInput
                    label="Height"
                    unit="cm"
                    value={heightCm}
                    onChange={setHeightCm}
                    placeholder="170"
                    min={100}
                    max={250}
                />

                <MeasurementInput
                    label="Current weight"
                    unit="kg"
                    value={currentWeight}
                    onChange={setCurrentWeight}
                    placeholder="65"
                    min={30}
                    max={300}
                />
            </div>

            <div className="mt-10">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Dumbbell size={19} />
                    </div>

                    <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                            Your activity level
                        </h3>
                        <p className="text-sm font-medium text-slate-500">
                            Choose the option that best matches your usual routine.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {activityLevels.map((activity) => {
                        const selected = activityLevel === activity.value;

                        return (
                            <button
                                key={activity.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setActivityLevel(activity.value)}
                                className={`group relative rounded-2xl border p-4 text-left transition-all duration-200 ${selected
                                    ? "border-emerald-500 bg-emerald-50/70 shadow-md shadow-emerald-500/10"
                                    : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${selected
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                                                }`}
                                        >
                                            <Dumbbell size={18} />
                                        </div>

                                        <div>
                                            <p
                                                className={`font-extrabold ${selected
                                                    ? "text-emerald-800"
                                                    : "text-slate-800"
                                                    }`}
                                            >
                                                {activity.title}
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-500">
                                                {activity.description}
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-slate-400">
                                                {activity.days}
                                            </p>
                                        </div>
                                    </div>

                                    {selected && (
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {selectedActivity && (
                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                        <p className="text-sm font-semibold text-emerald-800">
                            Selected: {selectedActivity.title}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* =========================================================
   STEP 2 - BMI AND GOAL
========================================================= */

function StepTwo({
    preview,
    bmiStyle,
    goalType,
    setGoalType,
}: {
    preview: NutritionPreview;
    bmiStyle: { badge: string; accent: string };
    goalType: GoalType;
    setGoalType: (goal: GoalType) => void;
}) {
    return (
        <div>
            <SectionHeading
                eyebrow="YOUR STARTING POINT"
                title="Understand your current position"
                description="We've calculated your BMI and suggested a starting direction. You can choose what feels right for you."
            />

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                            <Calculator size={21} />
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                Your BMI
                            </p>
                            <p className="text-sm font-semibold text-slate-500">
                                A simple screening measure
                            </p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <span className="text-6xl font-black tracking-tight text-slate-900">
                            {preview.bmi}
                        </span>
                    </div>

                    <div
                        className={`mt-5 inline-flex rounded-full border px-4 py-2 text-sm font-extrabold ${bmiStyle.badge}`}
                    >
                        {preview.bmiCategoryLabel}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                            <Target size={21} />
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                Recommended direction
                            </p>
                            <p className="text-sm font-semibold text-slate-500">
                                You are always in control
                            </p>
                        </div>
                    </div>

                    <div className="mt-7">
                        <p className="text-2xl font-black capitalize text-slate-900">
                            {preview.suggestedGoal}
                        </p>

                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            Based on your information, PlateWise suggests
                            this as a starting direction. You can change it
                            below.
                        </p>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-2">
                        {(["gain", "lose", "maintain"] as GoalType[]).map(
                            (goal) => {
                                const selected = goalType === goal;

                                return (
                                    <button
                                        key={goal}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => setGoalType(goal)}
                                        className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize transition ${selected
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                                            }`}
                                    >
                                        {goal}
                                    </button>
                                );
                            }
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   STEP 3 - TARGET WEIGHT
========================================================= */

function StepThree({
    preview,
    targetWeight,
    setTargetWeight,
    currentWeight,
    goalType,
}: {
    preview: NutritionPreview | null;
    targetWeight: string;
    setTargetWeight: (value: string) => void;
    currentWeight: string;
    goalType: GoalType;
}) {
    const difference =
        targetWeight && currentWeight
            ? Math.abs(Number(targetWeight) - Number(currentWeight)).toFixed(1)
            : "0";

    return (
        <div>
            <SectionHeading
                eyebrow="SET YOUR TARGET"
                title="Choose your target weight"
                description="We've suggested a starting target based on your selected goal. You can adjust it before continuing."
            />

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                        <Target size={22} />
                    </div>

                    <p className="mt-6 text-sm font-bold text-slate-500">
                        Suggested target
                    </p>

                    <p className="mt-1 text-4xl font-black text-slate-900">
                        {preview?.suggestedTargetWeight ?? "—"}
                        <span className="ml-1 text-lg font-bold text-slate-500">
                            kg
                        </span>
                    </p>

                    <p className="mt-4 text-sm leading-relaxed text-slate-500">
                        This is a starting estimate based on your current
                        information and selected goal.
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-7">
                    <label className="text-sm font-extrabold text-slate-800">
                        Your target weight
                    </label>

                    <div className="relative mt-4">
                        <input
                            type="number"
                            min={30}
                            max={300}
                            step="0.1"
                            value={targetWeight}
                            onChange={(event) =>
                                setTargetWeight(event.target.value)
                            }
                            className={`${inputClass} pr-16 text-2xl`}
                        />

                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                            kg
                        </span>
                    </div>

                    {Number(targetWeight) > 0 && (
                        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                            <Scale size={18} className="text-emerald-600" />

                            <p className="text-sm font-semibold text-slate-600">
                                {goalType === "maintain"
                                    ? "Your target matches your maintenance goal."
                                    : `${difference} kg ${goalType === "gain" ? "to gain" : "to lose"
                                    } from your current weight.`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   STEP 4 - NUTRITION TARGETS
========================================================= */

function StepFour({
    calorieTarget,
    setCalorieTarget,
    proteinTarget,
    setProteinTarget,
    weeklyBudget,
    setWeeklyBudget,
}: {
    calorieTarget: string;
    setCalorieTarget: (value: string) => void;
    proteinTarget: string;
    setProteinTarget: (value: string) => void;
    weeklyBudget: string;
    setWeeklyBudget: (value: string) => void;
}) {
    return (
        <div>
            <SectionHeading
                eyebrow="YOUR DAILY PLAN"
                title="Set your nutrition targets"
                description="PlateWise suggests starting targets from your profile. You can fine-tune them to suit your routine."
            />

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TargetInput
                    icon={<Flame size={20} />}
                    label="Daily calories"
                    description="Estimated energy target"
                    value={calorieTarget}
                    onChange={setCalorieTarget}
                    unit="kcal"
                    min={800}
                    max={10000}
                />

                <TargetInput
                    icon={<Beef size={20} />}
                    label="Daily protein"
                    description="Protein target for the day"
                    value={proteinTarget}
                    onChange={setProteinTarget}
                    unit="g"
                    min={20}
                    max={500}
                />
            </div>

            <div className="mt-5">
                <TargetInput
                    icon={<Wallet size={20} />}
                    label="Weekly food budget"
                    description="Optional budget for your meals"
                    value={weeklyBudget}
                    onChange={setWeeklyBudget}
                    unit="Rs"
                    min={0}
                    placeholder="e.g. 8000"
                />
            </div>

            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <Sparkles size={19} className="mt-0.5 shrink-0 text-emerald-600" />

                <p className="text-sm leading-relaxed text-emerald-800">
                    These targets will power your PlateWise dashboard,
                    meal suggestions, daily food log, protein tracking,
                    and weekly insights.
                </p>
            </div>
        </div>
    );
}

/* =========================================================
   STEP 5 - FOOD PREFERENCES
========================================================= */

function StepFive({
    allergies,
    toggleAllergy,
    removeAllergy,
    customAllergy,
    setCustomAllergy,
    addCustomAllergy,
    dietaryPreferences,
    toggleDietaryPreference,
}: {
    allergies: string[];
    toggleAllergy: (value: string) => void;
    removeAllergy: (value: string) => void;
    customAllergy: string;
    setCustomAllergy: (value: string) => void;
    addCustomAllergy: () => void;
    dietaryPreferences: string[];
    toggleDietaryPreference: (value: string) => void;
}) {
    return (
        <div>
            <SectionHeading
                eyebrow="FOOD PREFERENCES"
                title="Personalize your meals"
                description="Select any allergies and dietary preferences so your meal recommendations can better suit you."
            />

            {/* Allergies */}
            <div className="mt-10">
                <h3 className="mb-2 text-sm font-extrabold text-slate-800">
                    Food allergies
                </h3>

                <p className="mb-4 text-sm text-slate-500">
                    Select all foods you need to avoid.
                </p>

                <div className="flex flex-wrap gap-2">
                    {commonAllergies.map((allergy) => {
                        const selected = allergies.includes(allergy);

                        return (
                            <button
                                key={allergy}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => toggleAllergy(allergy)}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selected
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                                    }`}
                            >
                                {selected ? "✓ " : "+ "}
                                {allergy}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5 flex gap-2">
                    <input
                        value={customAllergy}
                        onChange={(event) => setCustomAllergy(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                addCustomAllergy();
                            }
                        }}
                        placeholder="Add another allergy"
                        className={`${inputClass} py-3`}
                    />

                    <button
                        type="button"
                        onClick={addCustomAllergy}
                        disabled={!customAllergy.trim()}
                        className="shrink-0 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>

                {allergies.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                            Selected allergies
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {allergies.map((allergy) => (
                                <button
                                    key={allergy}
                                    type="button"
                                    onClick={() => removeAllergy(allergy)}
                                    title={`Remove ${allergy}`}
                                    className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-red-50 hover:text-red-600"
                                >
                                    {allergy} ×
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Dietary preferences */}
            <div className="mt-9">
                <h3 className="mb-2 text-sm font-extrabold text-slate-800">
                    Dietary preferences
                </h3>

                <p className="mb-4 text-sm text-slate-500">
                    Choose any dietary patterns you follow. This section is optional.
                </p>

                <div className="flex flex-wrap gap-2">
                    {dietaryOptions.map((preference) => {
                        const selected = dietaryPreferences.includes(preference);

                        return (
                            <button
                                key={preference}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                    toggleDietaryPreference(preference)
                                }
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selected
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                                    }`}
                            >
                                {selected ? "✓ " : "+ "}
                                {preference}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-7 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm leading-relaxed text-amber-800">
                    <strong>Important:</strong> Please enter all relevant
                    allergies accurately. Food recommendations should not
                    replace professional advice about food allergies.
                </p>
            </div>
        </div>
    );
}

/* =========================================================
   STEP 6 - REVIEW
========================================================= */

function StepSix({
    goalType,
    targetWeight,
    calorieTarget,
    proteinTarget,
    weeklyBudget,
    allergies,
    dietaryPreferences,
}: {
    goalType: GoalType;
    targetWeight: string;
    calorieTarget: string;
    proteinTarget: string;
    weeklyBudget: string;
    allergies: string[];
    dietaryPreferences: string[];
}) {
    return (
        <div>
            <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                    <Check size={30} strokeWidth={2.5} />
                </div>

                <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-600">
                    You're almost ready
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    Your PlateWise plan is ready
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-500">
                    Review your starting targets below. You can update
                    them anytime from your profile.
                </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SummaryCard
                    icon={<Target size={20} />}
                    label="Goal"
                    value={capitalize(goalType)}
                />

                <SummaryCard
                    icon={<Scale size={20} />}
                    label="Target weight"
                    value={`${targetWeight} kg`}
                />

                <SummaryCard
                    icon={<Flame size={20} />}
                    label="Daily calories"
                    value={`${calorieTarget} kcal`}
                />

                <SummaryCard
                    icon={<Beef size={20} />}
                    label="Daily protein"
                    value={`${proteinTarget} g`}
                />

                {weeklyBudget !== "" && (
                    <div className="sm:col-span-2">
                        <SummaryCard
                            icon={<Wallet size={20} />}
                            label="Weekly food budget"
                            value={`Rs ${weeklyBudget}`}
                        />
                    </div>
                )}

                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Food preferences
                    </p>

                    <div className="mt-3 space-y-3">
                        <div>
                            <p className="text-xs font-bold text-slate-500">
                                Allergies
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {allergies.length > 0
                                    ? allergies.join(", ")
                                    : "No allergies selected"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-500">
                                Dietary preferences
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {dietaryPreferences.length > 0
                                    ? dietaryPreferences.join(", ")
                                    : "No preferences selected"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex gap-3">
                    <CircleCheck
                        size={20}
                        className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>
                        <p className="font-bold text-slate-800">
                            What happens next?
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-slate-500">
                            Your dashboard will use these targets to track
                            your daily progress, recommend suitable meals,
                            analyze your food log, and generate weekly
                            insights.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function SectionHeading({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="text-center">
            <p className="text-xs font-extrabold tracking-[0.22em] text-emerald-600">
                {eyebrow}
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {title}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
                {description}
            </p>
        </div>
    );
}

function MeasurementInput({
    label,
    unit,
    value,
    onChange,
    placeholder,
    min,
    max,
}: {
    label: string;
    unit: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    min?: number;
    max?: number;
}) {
    return (
        <div>
            <label className="mb-2.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                {label}
            </label>

            <div className="relative">
                <input
                    type="number"
                    min={min}
                    max={max}
                    step="any"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className={`${inputClass} pr-16`}
                />

                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    {unit}
                </span>
            </div>
        </div>
    );
}

function TargetInput({
    icon,
    label,
    description,
    value,
    onChange,
    unit,
    min,
    max,
    placeholder,
}: {
    icon: ReactNode;
    label: string;
    description: string;
    value: string;
    onChange: (value: string) => void;
    unit: string;
    min?: number;
    max?: number;
    placeholder?: string;
}) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-emerald-200">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    {icon}
                </div>

                <div>
                    <p className="font-extrabold text-slate-900">{label}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                        {description}
                    </p>
                </div>
            </div>

            <div className="relative mt-5">
                <input
                    type="number"
                    min={min}
                    max={max}
                    step="any"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className={`${inputClass} pr-16 text-xl`}
                />

                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    {unit}
                </span>
            </div>
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                {icon}
            </div>

            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </p>

                <p className="mt-1 text-lg font-black text-slate-900">
                    {value}
                </p>
            </div>
        </div>
    );
}

function getStepTitle(step: number) {
    switch (step) {
        case 1:
            return "About you";
        case 2:
            return "Your starting point";
        case 3:
            return "Your target";
        case 4:
            return "Daily nutrition";
        case 5:
            return "Food preferences";
        case 6:
            return "Review & finish";
        default:
            return "Getting started";
    }
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
