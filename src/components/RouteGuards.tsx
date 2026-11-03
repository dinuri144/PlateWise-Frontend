import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, postAuthPath } from "../context/AuthContext";

function GateSpinner() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f6faf6]">
            <div className="rounded-2xl border border-emerald-100 bg-white px-6 py-4 text-sm font-semibold text-emerald-700 shadow-sm">
                Loading…
            </div>
        </div>
    );
}

export function GuestRoute({ children }: { children: ReactNode }) {
    const { loading, token, onboardingComplete } = useAuth();
    if (loading) return <GateSpinner />;
    if (token) return <Navigate to={postAuthPath(onboardingComplete)} replace />;
    return <>{children}</>;
}

export function RequireAuth({
    children,
    requireComplete,
}: {
    children: ReactNode;
    requireComplete?: boolean;
}) {
    const { loading, token, onboardingComplete } = useAuth();
    const location = useLocation();

    if (loading) return <GateSpinner />;
    if (!token) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    if (requireComplete && !onboardingComplete) {
        return <Navigate to="/onboarding" replace />;
    }
    if (!requireComplete && onboardingComplete) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
}
