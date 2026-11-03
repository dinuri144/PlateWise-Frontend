const API_BASE = import.meta.env.VITE_API_URL ?? "";

export type Profile = {
    id: string;
    userId: string;
    age: number | null;
    heightCm: number | null;
    currentWeight: number | null;
    activityLevel: string | null;
    goalType: string | null;
    targetWeight: number | null;
    calorieTarget: number | null;
    proteinTarget: number | null;
    weeklyBudget: number | null;
};

export type AuthUser = {
    id: string;
    email: string;
    createdAt?: string;
};

export type MeResponse = {
    user: AuthUser;
    profile: Profile | null;
    onboardingComplete: boolean;
};

export type NutritionPreview = {
    bmi: number;
    bmiCategory: string;
    bmiCategoryLabel: string;
    suggestedGoal: "gain" | "lose" | "maintain";
    goalType: "gain" | "lose" | "maintain";
    suggestedTargetWeight: number;
    targetWeight: number;
    suggestedCalories: number;
    suggestedProtein: number;
    disclaimer: string;
};

function authHeader(): HeadersInit {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJson(res: Response) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || data.message || "Request failed");
    }
    return data;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
    });
    return parseJson(res);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
    });
    return parseJson(res);
}

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { ...authHeader() },
    });
    return parseJson(res);
}

export function saveToken(token: string) {
    localStorage.setItem("token", token);
}

export function clearToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}

export function getToken() {
    return localStorage.getItem("token");
}

export async function apiDelete<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "DELETE",
        headers: { ...authHeader() },
    });

    return parseJson(res);
}
