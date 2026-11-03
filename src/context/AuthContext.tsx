import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiGet, clearToken, getToken, type AuthUser, type MeResponse, type Profile } from "../lib/api";

type AuthState = {
    loading: boolean;
    token: string | null;
    user: AuthUser | null;
    profile: Profile | null;
    onboardingComplete: boolean;
    refreshMe: () => Promise<MeResponse | null>;
    applyAuthPayload: (payload: { token: string } & Partial<MeResponse>) => Promise<MeResponse | null>;
    logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(() => getToken());
    const [user, setUser] = useState<AuthUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [onboardingComplete, setOnboardingComplete] = useState(false);

    const applyMe = useCallback((data: MeResponse) => {
        setUser(data.user);
        setProfile(data.profile);
        setOnboardingComplete(Boolean(data.onboardingComplete));
        localStorage.setItem("user", JSON.stringify(data.user));
    }, []);

    const refreshMe = useCallback(async () => {
        const current = getToken();
        if (!current) {
            setUser(null);
            setProfile(null);
            setOnboardingComplete(false);
            setToken(null);
            return null;
        }
        try {
            const data = await apiGet<MeResponse>("/api/auth/me");
            setToken(current);
            applyMe(data);
            return data;
        } catch {
            clearToken();
            setToken(null);
            setUser(null);
            setProfile(null);
            setOnboardingComplete(false);
            return null;
        }
    }, [applyMe]);

    const applyAuthPayload = useCallback(
        async (payload: { token: string } & Partial<MeResponse>) => {
            localStorage.setItem("token", payload.token);
            setToken(payload.token);
            if (payload.user && typeof payload.onboardingComplete === "boolean") {
                applyMe({
                    user: payload.user,
                    profile: payload.profile ?? null,
                    onboardingComplete: payload.onboardingComplete,
                });
                return {
                    user: payload.user,
                    profile: payload.profile ?? null,
                    onboardingComplete: payload.onboardingComplete,
                };
            }
            return refreshMe();
        },
        [applyMe, refreshMe]
    );

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
        setUser(null);
        setProfile(null);
        setOnboardingComplete(false);
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            if (getToken()) {
                await refreshMe();
            }
            if (!cancelled) setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [refreshMe]);

    const value = useMemo(
        () => ({
            loading,
            token,
            user,
            profile,
            onboardingComplete,
            refreshMe,
            applyAuthPayload,
            logout,
        }),
        [loading, token, user, profile, onboardingComplete, refreshMe, applyAuthPayload, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

export function postAuthPath(onboardingComplete: boolean) {
    return onboardingComplete ? "/dashboard" : "/onboarding";
}
