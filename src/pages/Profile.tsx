import { useEffect, useState } from "react";
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Heart,
    Leaf,
    Loader2,
    Save,
    Target,
    UserRound,
    Wallet,
    X,
} from "lucide-react";

import { apiGet, apiPut } from "../lib/api";
import PageHeader from "../components/PageHeader";

type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
type GoalType = "gain" | "lose" | "maintain";

type DietaryPreference =
    | "vegetarian"
    | "vegan"
    | "gluten-free"
    | "dairy-free"
    | "pescatarian";

interface ProfileData {
    age: number | null;
    heightCm: number | null;
    currentWeight: number | null;
    activityLevel: ActivityLevel | null;
    goalType: GoalType | null;
    targetWeight: number | null;
    calorieTarget: number | null;
    proteinTarget: number | null;
    weeklyBudget: number | null;
    allergies: string[];
    dietaryPreferences: DietaryPreference[];
}

interface ProfileResponse {
    profile: ProfileData | null;
    onboardingComplete: boolean;
    bmi: number | null;
    bmiCategory: string | null;
    bmiCategoryLabel: string | null;
}

interface ProfileForm {
    age: string;
    heightCm: string;
    currentWeight: string;
    activityLevel: ActivityLevel | "";
    goalType: GoalType | "";
    targetWeight: string;
    calorieTarget: string;
    proteinTarget: string;
    weeklyBudget: string;
    allergies: string;
    dietaryPreferences: DietaryPreference[];
}

const emptyForm: ProfileForm = {
    age: "",
    heightCm: "",
    currentWeight: "",
    activityLevel: "",
    goalType: "",
    targetWeight: "",
    calorieTarget: "",
    proteinTarget: "",
    weeklyBudget: "",
    allergies: "",
    dietaryPreferences: [],
};

const preferenceOptions: {
    value: DietaryPreference;
    label: string;
}[] = [
        { value: "vegetarian", label: "Vegetarian" },
        { value: "vegan", label: "Vegan" },
        { value: "gluten-free", label: "Gluten-free" },
        { value: "dairy-free", label: "Dairy-free" },
        { value: "pescatarian", label: "Pescatarian" },
    ];

function toNumberOrNull(value: string): number | null {
    if (value.trim() === "") return null;

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function getProfileForm(profile: ProfileData | null): ProfileForm {
    if (!profile) return { ...emptyForm };

    return {
        age: profile.age?.toString() ?? "",
        heightCm: profile.heightCm?.toString() ?? "",
        currentWeight: profile.currentWeight?.toString() ?? "",
        activityLevel: profile.activityLevel ?? "",
        goalType: profile.goalType ?? "",
        targetWeight: profile.targetWeight?.toString() ?? "",
        calorieTarget: profile.calorieTarget?.toString() ?? "",
        proteinTarget: profile.proteinTarget?.toString() ?? "",
        weeklyBudget: profile.weeklyBudget?.toString() ?? "",
        allergies: profile.allergies?.join(", ") ?? "",
        dietaryPreferences: profile.dietaryPreferences ?? [],
    };
}

export default function Profile() {
    const [form, setForm] = useState<ProfileForm>(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const [bmi, setBmi] = useState<number | null>(null);
    const [bmiCategoryLabel, setBmiCategoryLabel] = useState<string | null>(null);
    const [onboardingComplete, setOnboardingComplete] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load profile details from backend
    const loadProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const result = await apiGet<ProfileResponse>("/api/profile");

            setForm(getProfileForm(result.profile));
            setBmi(result.bmi);
            setBmiCategoryLabel(result.bmiCategoryLabel);
            setOnboardingComplete(result.onboardingComplete);
        } catch (err) {
            console.error("Failed to load profile:", err);
            setError("Unable to load your profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleChange = (field: keyof ProfileForm, value: string) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        setSuccess("");
    };

    const togglePreference = (preference: DietaryPreference) => {
        setForm((previous) => {
            const exists = previous.dietaryPreferences.includes(preference);

            return {
                ...previous,
                dietaryPreferences: exists
                    ? previous.dietaryPreferences.filter((item) => item !== preference)
                    : [...previous.dietaryPreferences, preference],
            };
        });

        setSuccess("");
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");

        const age = toNumberOrNull(form.age);
        const heightCm = toNumberOrNull(form.heightCm);
        const currentWeight = toNumberOrNull(form.currentWeight);
        const targetWeight = toNumberOrNull(form.targetWeight);
        const calorieTarget = toNumberOrNull(form.calorieTarget);
        const proteinTarget = toNumberOrNull(form.proteinTarget);
        const weeklyBudget = toNumberOrNull(form.weeklyBudget);

        // Basic validation
        if (form.age && (age === null || age < 13 || age > 120 || !Number.isInteger(age))) {
            setError("Please enter a valid age between 13 and 120.");
            return;
        }

        if (form.heightCm && (heightCm === null || heightCm <= 0)) {
            setError("Please enter a valid height.");
            return;
        }

        if (form.currentWeight && (currentWeight === null || currentWeight <= 0)) {
            setError("Please enter a valid current weight.");
            return;
        }

        if (form.targetWeight && (targetWeight === null || targetWeight <= 0)) {
            setError("Please enter a valid target weight.");
            return;
        }

        if (
            form.calorieTarget &&
            (calorieTarget === null ||
                !Number.isInteger(calorieTarget) ||
                calorieTarget < 800 ||
                calorieTarget > 8000)
        ) {
            setError("Calorie target must be between 800 and 8000 kcal.");
            return;
        }

        if (
            form.proteinTarget &&
            (proteinTarget === null ||
                !Number.isInteger(proteinTarget) ||
                proteinTarget < 20 ||
                proteinTarget > 400)
        ) {
            setError("Protein target must be between 20 and 400 grams.");
            return;
        }

        if (
            form.weeklyBudget &&
            (weeklyBudget === null ||
                !Number.isInteger(weeklyBudget) ||
                weeklyBudget < 0)
        ) {
            setError("Please enter a valid weekly budget.");
            return;
        }

        const allergies = form.allergies
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        if (allergies.some((item) => item.length > 50)) {
            setError("Each allergy name must be 50 characters or fewer.");
            return;
        }

        const payload = {
            age,
            heightCm,
            currentWeight,
            activityLevel: form.activityLevel || null,
            goalType: form.goalType || null,
            targetWeight,
            calorieTarget,
            proteinTarget,
            weeklyBudget,
            allergies,
            dietaryPreferences: form.dietaryPreferences,
        };

        try {
            setSaving(true);

            const result = await apiPut<ProfileResponse>("/api/profile", payload);

            setForm(getProfileForm(result.profile));
            setBmi(result.bmi);
            setBmiCategoryLabel(result.bmiCategoryLabel);
            setOnboardingComplete(result.onboardingComplete);

            setEditing(false);
            setSuccess("Your profile has been updated successfully.");
        } catch (err) {
            console.error("Failed to save profile:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save your profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        setError("");
        setSuccess("");
        await loadProfile();
        setEditing(false);
    };

    const inputClass =
        "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500";

    const labelClass = "text-sm font-semibold text-slate-700";

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="flex min-h-[60vh] items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="mx-auto animate-spin text-emerald-600" size={36} />
                            <p className="mt-4 text-sm text-slate-500">
                                Loading your profile...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="space-y-7 pb-10">
                    {/* Page Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <PageHeader
                            title="My Profile"
                            description="Manage your personal information, nutrition goals and dietary preferences."
                        />

                        <div className="flex shrink-0 gap-2">
                            {editing ? (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <X size={16} />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {saving ? (
                                            <Loader2 size={17} className="animate-spin" />
                                        ) : (
                                            <Save size={17} />
                                        )}
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        setEditing(true);
                                        setError("");
                                        setSuccess("");
                                    }}
                                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                >
                                    <UserRound size={17} />
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                            <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                            <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-600" />
                            <p className="text-sm text-emerald-700">{success}</p>
                        </div>
                    )}

                    {/* Profile Status */}
                    {!onboardingComplete && (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <p className="text-sm font-semibold text-amber-800">
                                Complete your nutrition profile
                            </p>
                            <p className="mt-1 text-sm text-amber-700">
                                Add your age, height, weight and activity level to get personalized nutrition estimates.
                            </p>
                        </div>
                    )}

                    {/* BMI Overview */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                    <Activity size={22} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Body Mass Index</p>
                                    <h3 className="mt-1 text-2xl font-bold text-slate-800">
                                        {bmi !== null ? bmi.toFixed(1) : "--"}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                    <Heart size={22} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">BMI Category</p>
                                    <h3 className="mt-1 text-xl font-bold text-slate-800">
                                        {bmiCategoryLabel || "Not available"}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                                    <Target size={22} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Nutrition Goal</p>
                                    <h3 className="mt-1 text-xl font-bold capitalize text-slate-800">
                                        {form.goalType === "gain"
                                            ? "Weight Gain"
                                            : form.goalType === "lose"
                                                ? "Weight Loss"
                                                : form.goalType === "maintain"
                                                    ? "Maintain Weight"
                                                    : "Not set"}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <UserRound size={21} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Personal Information
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Your basic personal details
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Age (years)</label>
                                <input
                                    type="number"
                                    min="13"
                                    max="120"
                                    value={form.age}
                                    disabled={!editing}
                                    onChange={(e) => handleChange("age", e.target.value)}
                                    placeholder="Enter your age"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Activity Level</label>
                                <select
                                    value={form.activityLevel}
                                    disabled={!editing}
                                    onChange={(e) => handleChange("activityLevel", e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select activity level</option>
                                    <option value="sedentary">Sedentary - Little or no exercise</option>
                                    <option value="light">Light - Exercise 1-3 days/week</option>
                                    <option value="moderate">Moderate - Exercise 3-5 days/week</option>
                                    <option value="active">Active - Exercise 6-7 days/week</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Body Measurements */}
                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <Activity size={21} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Body Measurements
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Update your height and weight details
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Height (cm)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    value={form.heightCm}
                                    disabled={!editing}
                                    onChange={(e) => handleChange("heightCm", e.target.value)}
                                    placeholder="e.g. 165"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Current Weight (kg)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    value={form.currentWeight}
                                    disabled={!editing}
                                    onChange={(e) => handleChange("currentWeight", e.target.value)}
                                    placeholder="e.g. 60"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Nutrition Goals */}
                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                                <Target size={21} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Nutrition Goals
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Set your personal health and nutrition targets
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Weight Goal</label>
                                <select
                                    value={form.goalType}
                                    disabled={!editing}
                                    onChange={(e) => handleChange("goalType", e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select your goal</option>
                                    <option value="gain">Gain Weight</option>
                                    <option value="lose">Lose Weight</option>
                                    <option value="maintain">Maintain Weight</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Target Weight (kg)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    value={form.targetWeight}
                                    disabled={!editing}
                                    onChange={(e) => handleChange("targetWeight", e.target.value)}
                                    placeholder="Enter target weight"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Daily Calorie Target (kcal)</label>
                                <input
                                    type="number"
                                    min="800"
                                    max="8000"
                                    value={form.calorieTarget}
                                    disabled={!editing}
                                    onChange={(e) => handleChange("calorieTarget", e.target.value)}
                                    placeholder="e.g. 2000"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Daily Protein Target (g)</label>
                                <input
                                    type="number"
                                    min="20"
                                    max="400"
                                    value={form.proteinTarget}
                                    disabled={!editing}
                                    onChange={(e) => handleChange("proteinTarget", e.target.value)}
                                    placeholder="e.g. 100"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Dietary Preferences */}
                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                                <Leaf size={21} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Dietary Preferences
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Select the food preferences that apply to you
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {preferenceOptions.map((option) => {
                                const selected = form.dietaryPreferences.includes(option.value);

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        disabled={!editing}
                                        onClick={() => togglePreference(option.value)}
                                        className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition ${selected
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                                            } disabled:cursor-not-allowed`}
                                    >
                                        <span
                                            className={`flex h-5 w-5 items-center justify-center rounded-md border ${selected
                                                ? "border-emerald-600 bg-emerald-600 text-white"
                                                : "border-slate-300 bg-white"
                                                }`}
                                        >
                                            {selected && <CheckCircle2 size={15} />}
                                        </span>
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Allergies */}
                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                <Heart size={21} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Food Allergies
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Tell us which foods you are allergic to
                                </p>
                            </div>
                        </div>

                        <label className={labelClass}>Allergies</label>
                        <input
                            type="text"
                            value={form.allergies}
                            disabled={!editing}
                            onChange={(e) => handleChange("allergies", e.target.value)}
                            placeholder="e.g. Peanuts, Milk, Eggs"
                            className={inputClass}
                        />
                        <p className="mt-2 text-xs text-slate-400">
                            Separate multiple allergies with commas.
                        </p>
                    </section>

                    {/* Weekly Budget */}
                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                <Wallet size={21} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Weekly Food Budget
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Set a weekly budget for your food expenses
                                </p>
                            </div>
                        </div>

                        <div className="max-w-md">
                            <label className={labelClass}>Weekly Budget (LKR)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                    Rs.
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.weeklyBudget}
                                    disabled={!editing}
                                    onChange={(e) => handleChange("weeklyBudget", e.target.value)}
                                    placeholder="e.g. 8000"
                                    className={`${inputClass} pl-12`}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Bottom Save Button */}
                    {editing && (
                        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? (
                                    <Loader2 size={17} className="animate-spin" />
                                ) : (
                                    <Save size={17} />
                                )}
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}

                    {/* Footer Note */}
                    <p className="text-center text-xs leading-5 text-slate-400">
                        Your nutrition information is used to personalize your PlateWise experience.
                        Nutrition estimates are for personal tracking and are not a substitute for professional medical advice.
                    </p>
                </div>
            </div>
        </div>
    );
}
