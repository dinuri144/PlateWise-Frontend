import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, postAuthPath } from "../context/AuthContext";
import { apiPost, type MeResponse } from "../lib/api";
import plateLogin from "../assets/plate login.png";
import {
    Mail,
    Lock,
    Heart,
    Activity,
    Leaf,
    Wallet,
    ArrowRight,
    Eye,
    EyeOff,
} from "lucide-react";

export default function AuthPage() {
    const location = useLocation();
    const isLogin = location.pathname !== "/register";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { applyAuthPayload } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

        try {
            const data = await apiPost<MeResponse & { token: string }>(endpoint, {
                email,
                password,
            });
            const me = await applyAuthPayload(data);
            navigate(postAuthPath(me?.onboardingComplete ?? false), { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 min-h-screen w-screen overflow-y-auto bg-[#f6faf6]">
            {/* Soft accents — full screen */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-10 top-16 h-56 w-56 rounded-full bg-emerald-100/70 blur-3xl" />
                <div className="absolute bottom-20 left-10 h-40 w-40 rounded-full bg-lime-100/60 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10 lg:px-10">
                <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2">
                    {/* LEFT PANEL */}
                    <div className="order-2 space-y-6 text-left lg:order-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                                <Leaf className="h-5 w-5" strokeWidth={2.4} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold leading-none tracking-tight sm:text-4xl">
                                    <span className="text-slate-900">Plate</span>
                                    <span className="text-emerald-600">Wise</span>
                                </div>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    Better Food . Healthier You . A Greener Tomorrow
                                </p>
                            </div>
                        </div>

                        <h2 className="pt-2 text-5xl font-extrabold leading-[1.1] tracking-tight lg:text-6xl">
                            <span className="text-slate-900">Smart Meals.</span>
                            <br />
                            <span className="text-emerald-600">Real Progress.</span>
                        </h2>

                        <p className="max-w-md py-1 text-[15px] leading-relaxed text-slate-600 lg:text-base">
                            PlateWise helps you plan nutritious meals, track your goals, manage
                            your pantry, reduce food waste and stay within your budget.
                        </p>

                        <div className="flex flex-wrap gap-x-6 gap-y-4 py-1">
                            <Feature icon={<Heart className="h-4 w-4" />} label="Personalized Meal Plans" />
                            <Feature icon={<Activity className="h-4 w-4" />} label="Track Your Nutrition" />
                            <Feature icon={<Leaf className="h-4 w-4" />} label="Reduce Food Waste" />
                            <Feature icon={<Wallet className="h-4 w-4" />} label="Stay Within Budget" />
                        </div>

                        <div className="mt-2 max-w-md overflow-hidden rounded-3xl bg-emerald-50/50 p-2 shadow-md shadow-slate-200/80 ring-1 ring-emerald-100">
                            <img
                                src={plateLogin}
                                alt="Healthy meal"
                                className="h-48 w-full rounded-2xl object-contain sm:h-56"
                            />
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="order-1 lg:order-2">
                        <div className="mx-auto w-full max-w-[420px] rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
                            <div className="mb-7 text-center sm:text-left">
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {isLogin ? "Welcome Back!" : "Create Account"}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    {isLogin
                                        ? "Log in to your PlateWise account"
                                        : "Start your health journey today"}
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                            <Mail size={17} />
                                        </span>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                            <Lock size={17} />
                                        </span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {loading ? (
                                        "Please wait..."
                                    ) : (
                                        <>
                                            {isLogin ? "Log In" : "Sign Up"} <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm text-slate-600">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError("");
                                        navigate(isLogin ? "/register" : "/login");
                                    }}
                                    className="font-semibold text-emerald-700 hover:underline"
                                >
                                    {isLogin ? "Sign up" : "Log in"}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Feature({
    icon,
    label,
}: {
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                {icon}
            </div>
            <span className="text-xs font-semibold leading-snug text-slate-700">
                {label}
            </span>
        </div>
    );
}