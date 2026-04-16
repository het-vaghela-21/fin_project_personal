"use client";

import { useState } from "react";
import { useDashboard, TransactionCategory, TransactionType } from "@/components/DashboardProvider";
import { PlusCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function AddTransactionForm() {
    const { addTransaction } = useDashboard();

    const [amount, setAmount] = useState("");
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<string>("Food");
    const [type, setType] = useState<TransactionType>("debit");

    const debitCategories = ["Food", "Shopping", "Jewellery", "Travel", "Utilities", "Health", "Miscellaneous"];
    const creditCategories = ["Salary", "Freelance", "Investments", "Refunds", "Gifts", "Other Income"];

    const currentCategories = type === "credit" ? creditCategories : debitCategories;

    const handleTypeChange = (newType: TransactionType) => {
        setType(newType);
        setCategory(newType === "credit" ? creditCategories[0] : debitCategories[0]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !title) return;

        addTransaction({
            amount: parseFloat(amount),
            title,
            category,
            type,
            date: new Date() // Use current time
        });

        setAmount("");
        setTitle("");
        setCategory(type === "credit" ? creditCategories[0] : debitCategories[0]);
    };

    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" /> New Transaction
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Toggle */}
                <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                    <button
                        type="button"
                        onClick={() => handleTypeChange("debit")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${type === "debit" ? "bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "text-zinc-500 hover:text-white"}`}
                    >
                        <ArrowDownRight className="w-4 h-4" /> Debit
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTypeChange("credit")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${type === "credit" ? "bg-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "text-zinc-500 hover:text-white"}`}
                    >
                        <ArrowUpRight className="w-4 h-4" /> Credit
                    </button>
                </div>

                <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Amount (₹)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 outline-none focus:border-primary/50 transition-colors"
                    />
                </div>

                <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Description</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Amazon Purchase"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 outline-none focus:border-primary/50 transition-colors"
                    />
                </div>

                <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors cursor-pointer appearance-none"
                    >
                        {currentCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-primary hover:bg-orange-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] mt-2"
                >
                    Add Transaction
                </button>
            </form>
        </div>
    );
}
