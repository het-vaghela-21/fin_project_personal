"use client";

import { useMemo } from "react";
import { useDashboard } from "@/components/DashboardProvider";
import { AddTransactionForm } from "@/components/dashboard/AddTransactionForm";
import { CashflowChart } from "@/components/dashboard/CashflowChart";
import { LiveStocksWidget } from "@/components/dashboard/LiveStocksWidget";
import { FinanceNewsWidget } from "@/components/dashboard/FinanceNewsWidget";
import { PieChart, ListFilter, Zap } from "lucide-react";

export default function DashboardPage() {
    const { transactions } = useDashboard();

    // Memoize all computed stats to avoid recomputing on every render
    const { totalBalance, totalCredit, totalDebit } = useMemo(() => {
        let credit = 0;
        let debit = 0;
        for (const t of transactions) {
            if (t.type === 'credit') {
                credit += t.amount;
            } else {
                debit += t.amount;
            }
        }
        return {
            totalBalance: credit - debit,
            totalCredit: credit,
            totalDebit: debit,
        };
    }, [transactions]);

    // Memoize category calculations — single pass instead of double computation
    const categoryData = useMemo(() => {
        const catMap = new Map<string, number>();
        for (const t of transactions) {
            catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
        }
        return Array.from(catMap.entries()).map(([category, total]) => ({
            category,
            total,
        }));
    }, [transactions]);

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 relative z-10">
            {/* Header Area */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tighter">Command Center</h1>
                    <p className="text-zinc-400">Total balance and cashflow summary.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Net Worth</div>
                        <div className={`text-2xl font-bold tracking-tighter ${totalBalance >= 0 ? "text-white" : "text-red-400"}`}>
                            ₹{Math.abs(totalBalance).toFixed(2)}
                            {totalBalance < 0 && "-"}
                        </div>
                    </div>
                </div>
            </header>

            {/* Top Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm flex items-center justify-between">
                    <div>
                        <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Credited</div>
                        <div className="text-2xl font-bold text-green-500 tracking-tight">₹{totalCredit.toFixed(2)}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-green-500" />
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm flex items-center justify-between">
                    <div>
                        <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Debited</div>
                        <div className="text-2xl font-bold text-red-500 tracking-tight">₹{totalDebit.toFixed(2)}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <ListFilter className="w-6 h-6 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Charts & Overview */}
                <div className="lg:col-span-8 space-y-6">
                    <CashflowChart />

                    {/* Top Categories Row */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-primary" /> Top Categories
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {categoryData.length > 0 ? (
                                categoryData.map(({ category, total }) => (
                                    <div key={category} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors">
                                        <div className="text-xs text-zinc-400 font-semibold mb-1">{category}</div>
                                        <div className="text-lg font-bold text-white">₹{total.toFixed(2)}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-zinc-500 text-sm py-4">No categories recorded yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Add tx & Stocks */}
                <div className="lg:col-span-4 space-y-6">
                    <AddTransactionForm />
                    <LiveStocksWidget />
                    <FinanceNewsWidget />
                </div>
            </div>
        </div>
    );
}
