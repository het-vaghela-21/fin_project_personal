"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BarChart3,
    ReceiptText,
    Bot,
    Newspaper,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Zap,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const sidebarNavItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Charts", href: "/dashboard/charts", icon: BarChart3 },
    { title: "Transactions", href: "/dashboard/transactions", icon: ReceiptText },
    { title: "AI Suggestions", href: "/dashboard/ai-suggestions", icon: Bot },
    { title: "Newsletter", href: "/dashboard/newsletter", icon: Newspaper },
];

export const DashboardSidebar = memo(function DashboardSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, userRole, logout } = useAuth();

    return (
        <aside
            className={cn(
                "sticky top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-white/5 bg-black/40 backdrop-blur-sm flex flex-col flex-shrink-0",
                isCollapsed ? "w-[80px]" : "w-[260px]"
            )}
        >
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                <div className={cn("flex items-center gap-2 text-white font-bold text-xl tracking-tight transition-all", isCollapsed && "opacity-0 invisible w-0")}>
                    <Zap className="w-6 h-6 text-primary flex-shrink-0" /> FinAI
                </div>
                {isCollapsed && (
                    <div className="absolute left-6 h-full flex items-center top-0 justify-center">
                        <Zap className="w-6 h-6 text-primary" />
                    </div>
                )}
            </div>

            <div className="flex-1 py-4 px-4 space-y-1.5 overflow-y-auto">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">Menu</div>
                {sidebarNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group relative",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-zinc-400 group-hover:text-white")} />
                            <span className={cn("transition-all duration-300 whitespace-nowrap", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
                                {item.title}
                            </span>
                            {isActive && !isCollapsed && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_#f97316]"></div>
                            )}
                            {isActive && isCollapsed && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_#f97316]"></div>
                            )}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                    {item.title}
                                </div>
                            )}
                        </Link>
                    )
                })}

                {/* Admin Link - only shown for admins */}
                {userRole === "admin" && (
                    <Link
                        href="/admin"
                        className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group relative mt-3",
                            pathname === "/admin"
                                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                : "text-zinc-400 hover:text-orange-400 hover:bg-orange-500/5 border border-transparent"
                        )}
                    >
                        <Shield className={cn("w-5 h-5 flex-shrink-0", pathname === "/admin" ? "text-orange-400" : "text-zinc-400 group-hover:text-orange-400")} />
                        <span className={cn("transition-all duration-300 whitespace-nowrap", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
                            Admin Panel
                        </span>
                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-orange-400 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                Admin Panel
                            </div>
                        )}
                    </Link>
                )}
            </div>

            <div className="mt-auto"></div>

            {/* User Info */}
            {!isCollapsed && user && (
                <div className="px-4 py-3 mx-4 mb-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-white text-sm font-medium truncate">{user.displayName || "User"}</p>
                    <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                </div>
            )}

            <div className="p-4 border-t border-white/5">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent"
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : (
                        <>
                            <ChevronLeft className="w-5 h-5" /> Collapse
                        </>
                    )}
                </button>
            </div>

            <div className="p-4 pb-6">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors group relative border border-transparent"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className={cn("transition-all duration-300 whitespace-nowrap", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
                        Sign Out
                    </span>
                    {isCollapsed && (
                        <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap text-red-400">
                            Sign Out
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
});
