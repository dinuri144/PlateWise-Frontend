
import { useState } from "react";
import {
    NavLink,
    Outlet,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
    Activity,
    ChefHat,
    LayoutDashboard,
    Leaf,
    LogOut,
    Menu,
    NotebookPen,
    PanelLeftClose,
    PanelLeftOpen,
    Refrigerator,
    ShoppingCart,
    UserRound,
    X,
} from "lucide-react";

const navigation = [
    {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "My Pantry",
        path: "/pantry",
        icon: Refrigerator,
    },
    {
        label: "Meals & Recipes",
        path: "/recipes",
        icon: ChefHat,
    },
    {
        label: "Shopping List",
        path: "/shopping-list",
        icon: ShoppingCart,
    },
    {
        label: "Food Log",
        path: "/food-log",
        icon: NotebookPen,
    },
    {
        label: "Weekly Insights",
        path: "/insights",
        icon: Activity,
    },
];

export default function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    const firstName = user?.email?.split("@")[0] || "User";

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    // Sidebar content
    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-white">

            {/* Logo */}
            <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
                <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-3 text-left"
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                        <Leaf size={23} strokeWidth={2.5} />
                    </div>

                    <div>
                        <h1 className="text-xl font-black tracking-tight">
                            <span className="text-slate-900">
                                Plate
                            </span>
                            <span className="text-emerald-600">
                                Wise
                            </span>
                        </h1>

                        <p className="text-[11px] font-medium text-slate-500">
                            Smart nutrition, made simple
                        </p>
                    </div>
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 py-6">

                <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                    Main menu
                </p>

                <nav className="space-y-1.5">
                    {navigation.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === "/dashboard"}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition-all duration-200 ${isActive
                                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon
                                            size={19}
                                            className={`shrink-0 transition ${isActive
                                                ? "text-emerald-600"
                                                : "text-slate-400 group-hover:text-emerald-600"
                                                }`}
                                        />

                                        <span>{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Account section */}
                <div className="my-6 border-t border-slate-100" />

                <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                    Account
                </p>

                {/* My Profile Navigation */}
                <NavLink
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition-all duration-200 ${isActive
                            ? "bg-emerald-50 text-emerald-700 shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <UserRound
                                size={19}
                                className={`shrink-0 transition ${isActive
                                    ? "text-emerald-600"
                                    : "text-slate-400 group-hover:text-emerald-600"
                                    }`}
                            />

                            <span>My Profile</span>
                        </>
                    )}
                </NavLink>
            </div>

            {/* User information and logout */}
            <div className="border-t border-slate-100 p-4">


                <button
                    type="button"
                    onClick={() => {
                        setMobileOpen(false);
                        navigate("/profile");
                    }}
                    className="mb-3 flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-emerald-50"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
                        {firstName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                            {firstName}
                        </p>

                        <p className="text-xs text-slate-500">
                            View my profile
                        </p>
                    </div>

                    <UserRound size={18} className="text-slate-400" />
                </button>


                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                    <LogOut size={18} />
                    Log out
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f7faf8]">

            {/* DESKTOP SIDEBAR */}
            {sidebarOpen && (
                <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/70 bg-white lg:block">
                    <SidebarContent />
                </aside>
            )}

            {/* MOBILE TOP HEADER */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:hidden">

                <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-2"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                        <Leaf size={19} />
                    </div>

                    <span className="text-lg font-black tracking-tight">
                        Plate
                        <span className="text-emerald-600">
                            Wise
                        </span>
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                    aria-label="Open navigation menu"
                >
                    <Menu size={21} />
                </button>
            </header>

            {/* MOBILE SIDEBAR */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">

                    {/* Background overlay */}
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setMobileOpen(false)}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    {/* Sidebar drawer */}
                    <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="absolute right-3 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                            aria-label="Close sidebar"
                        >
                            <X size={19} />
                        </button>

                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div
                className={`min-h-screen transition-all duration-300 ${sidebarOpen ? "lg:pl-64" : "lg:pl-0"
                    }`}
            >

                {/* Desktop top toolbar */}
                <div className="sticky top-0 z-20 hidden h-16 items-center border-b border-slate-200 bg-white/95 px-6 backdrop-blur lg:flex">

                    {/* Sidebar toggle */}
                    <button
                        type="button"
                        onClick={() =>
                            setSidebarOpen((previous) => !previous)
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        title={
                            sidebarOpen
                                ? "Hide sidebar"
                                : "Show sidebar"
                        }
                        aria-label={
                            sidebarOpen
                                ? "Hide sidebar"
                                : "Show sidebar"
                        }
                    >
                        {sidebarOpen ? (
                            <PanelLeftClose size={20} />
                        ) : (
                            <PanelLeftOpen size={20} />
                        )}
                    </button>

                    <div className="ml-4">
                        <p className="text-sm font-semibold text-slate-500">
                            Smart nutrition, made simple
                        </p>
                    </div>


                    <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        className="ml-auto flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-emerald-50"
                        title="View my profile"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
                            {firstName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-800">
                                {firstName}
                            </p>

                            <p className="text-[10px] text-slate-500">
                                My PlateWise
                            </p>
                        </div>
                    </button>

                </div>

                {/* Current page */}
                <main className="min-h-screen">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
