"use client";

import { useState, useMemo } from "react";
import { useDashboard } from "@/components/DashboardProvider";
import dynamic from "next/dynamic";
import { format, subDays, subMonths, isAfter } from "date-fns";
import { BarChart3, Clock, PieChart as PieChartIcon, Smartphone } from "lucide-react";

type TimeRange = "7D" | "1M" | "6M" | "1Y" | "ALL";

const COLORS = ["#006C49", "#008A5E", "#15B886", "#52D1AA", "#8FDFBD", "#CEF0D4"];

const tooltipStyle = {
    backgroundColor: "var(--surface-container-lowest)",
    borderColor: "currentColor",
    color: "var(--on-surface)",
    borderRadius: "12px",
    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
};

// ── Chart skeleton shared by all loading states ──
function ChartSkeleton({ height = 400 }: { height?: number }) {
    return (
        <div className="w-full flex items-end gap-1.5 px-2" style={{ height }}>
            {[30, 55, 40, 75, 50, 90, 35, 60, 80, 45, 70, 95].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm animate-pulse"
                    style={{ height: `${h}%`, background: i % 2 === 0 ? "rgba(0,108,73,0.1)" : "rgba(0,108,73,0.05)", animationDelay: `${i * 60}ms` }} />
            ))}
        </div>
    );
}

// ── Dynamically import all three Recharts chart types ──
const DynamicLineChart = dynamic(
    () => import("recharts").then((m) => {
        const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = m;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function LC({ data }: { data: any[] }) {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                        <XAxis dataKey="date" stroke="#8E8E9E" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#8E8E9E" fontSize={12} tickFormatter={v => `₹${v}`} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend iconType="circle" />
                        <Line type="monotone" dataKey="debit" name="Debit" stroke="#D62A2A" strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: "#D62A2A" }} />
                        <Line type="monotone" dataKey="credit" name="Credit" stroke="#006C49" strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: "#006C49" }} />
                    </LineChart>
                </ResponsiveContainer>
            );
        }
        return LC;
    }),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

const DynamicBarChart = dynamic(
    () => import("recharts").then((m) => {
        const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = m;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function BC({ data }: { data: any[] }) {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                        <XAxis dataKey="date" stroke="#8E8E9E" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#8E8E9E" fontSize={12} tickFormatter={v => `₹${v}`} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={tooltipStyle} />
                        <Legend iconType="circle" />
                        <Bar dataKey="debit" name="Debit" fill="#D62A2A" radius={[4, 4, 0, 0]} barSize={12} />
                        <Bar dataKey="credit" name="Credit" fill="#006C49" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                </ResponsiveContainer>
            );
        }
        return BC;
    }),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

const DynamicPieChart = dynamic(
    () => import("recharts").then((m) => {
        const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = m;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function PC({ data }: { data: { name: string; value: number }[] }) {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="var(--surface-container-lowest)" strokeWidth={2}>
                            {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Tooltip formatter={(v: any) => `₹${Number(v).toFixed(2)}`} contentStyle={tooltipStyle} />
                    </PieChart>
                </ResponsiveContainer>
            );
        }
        return PC;
    }),
    { ssr: false, loading: () => <ChartSkeleton height={250} /> }
);

export default function ChartsPage() {
    const { transactions } = useDashboard();
    const [timeRange, setRange] = useState<TimeRange>("1M");

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const cutoff =
            timeRange === "7D" ? subDays(now, 7) :
            timeRange === "1M" ? subMonths(now, 1) :
            timeRange === "6M" ? subMonths(now, 6) :
            timeRange === "1Y" ? subMonths(now, 12) : new Date(0);
        return transactions.filter(t => isAfter(t.date, cutoff));
    }, [transactions, timeRange]);

    const timeSeriesData = useMemo(() => {
        const grouped: Record<string, { date: string; timestamp: number; debit: number; credit: number }> = {};
        filteredTransactions.forEach(t => {
            const dateStr = format(t.date, "MMM dd");
            if (!grouped[dateStr]) grouped[dateStr] = { date: dateStr, timestamp: t.date.getTime(), debit: 0, credit: 0 };
            if (t.type === "debit") grouped[dateStr].debit += t.amount;
            else grouped[dateStr].credit += t.amount;
        });
        const data = Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp);
        if (data.length === 0) data.push({ date: format(new Date(), "MMM dd"), timestamp: Date.now(), debit: 0, credit: 0 });
        return data;
    }, [filteredTransactions]);

    const categoryData = useMemo(() => {
        const grouped: Record<string, number> = {};
        filteredTransactions.forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + t.amount; });
        return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    const upiRangeData = useMemo(() => {
        const ranges: Record<string, number> = {
            "₹10 - ₹500": 0,
            "₹501 - ₹1000": 0,
            "₹1001+": 0,
        };
        filteredTransactions.forEach(t => {
            if (t.source === "gmail_upi" && t.type === "debit") {
                if (t.amount >= 10 && t.amount <= 500) ranges["₹10 - ₹500"] += t.amount;
                else if (t.amount >= 501 && t.amount <= 1000) ranges["₹501 - ₹1000"] += t.amount;
                else if (t.amount >= 1001) ranges["₹1001+"] += t.amount;
            }
        });
        return Object.entries(ranges)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({ name, value }));
    }, [filteredTransactions]);

    const totalDebitForPeriod = filteredTransactions.reduce((acc, t) => t.type === "debit" ? acc + t.amount : acc, 0);
    const totalCreditForPeriod = filteredTransactions.reduce((acc, t) => t.type === "credit" ? acc + t.amount : acc, 0);

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 relative z-10 pb-20">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-on-surface tracking-tighter flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary" /> Deep Analytics
                    </h1>
                    <p className="text-on-surface-variant mt-0.5">Advanced cashflow and categorization visualizations.</p>
                </div>
                <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
                    <Clock className="w-4 h-4 text-outline ml-2" />
                    {(["7D", "1M", "6M", "1Y", "ALL"] as TimeRange[]).map(range => (
                        <button key={range} onClick={() => setRange(range)}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={timeRange === range ? {
                                background: "var(--primary-container)", color: "var(--on-primary-container)",
                                border: "1px solid rgba(0,108,73,0.2)", boxShadow: "0 1px 3px rgba(0,108,73,0.1)",
                            } : { color: "var(--on-surface-variant)", border: "1px solid transparent" }}
                            onMouseEnter={e => { if (timeRange !== range) (e.currentTarget.style.color = "var(--on-surface)"); }}
                            onMouseLeave={e => { if (timeRange !== range) (e.currentTarget.style.color = "var(--on-surface-variant)"); }}>
                            {range}
                        </button>
                    ))}
                </div>
            </header>

            {/* Stat row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Period Debits",  value: `₹${totalDebitForPeriod.toFixed(2)}`,  color: "var(--error)", border: "var(--error-container)" },
                    { label: "Period Credits", value: `₹${totalCreditForPeriod.toFixed(2)}`, color: "var(--primary)", border: "var(--primary-container)" },
                    { label: "Net Diff",       value: `₹${Math.abs(totalCreditForPeriod - totalDebitForPeriod).toFixed(2)}`,
                      color: totalCreditForPeriod >= totalDebitForPeriod ? "var(--primary)" : "var(--error)",
                      border: totalCreditForPeriod >= totalDebitForPeriod ? "var(--primary-container)" : "var(--error-container)" },
                    { label: "Transactions",   value: String(filteredTransactions.length),   color: "var(--on-surface)", border: "var(--surface-variant)" },
                ].map(s => (
                    <div key={s.label} className="p-4 rounded-2xl bg-surface-container-lowest ghost-border ambient-shadow transition-transform hover:-translate-y-1"
                        style={{ borderLeft: `4px solid ${s.border}` }}>
                        <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1 mt-1">{s.label}</div>
                        <div className="text-xl font-bold bg-clip-text" style={{ color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <div className="p-6 h-[400px] flex flex-col bg-surface-container-lowest ghost-border ambient-shadow rounded-[1.5rem]">
                        <h2 className="text-xl font-bold text-on-surface mb-6">Debit vs Credit (Trend)</h2>
                        <div className="flex-1 w-full min-h-0"><DynamicLineChart data={timeSeriesData} /></div>
                    </div>
                    <div className="p-6 h-[400px] flex flex-col bg-surface-container-lowest ghost-border ambient-shadow rounded-[1.5rem]">
                        <h2 className="text-xl font-bold text-on-surface mb-6">Gross Volume per Day</h2>
                        <div className="flex-1 w-full min-h-0"><DynamicBarChart data={timeSeriesData} /></div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="p-6 flex flex-col bg-surface-container-lowest ghost-border ambient-shadow rounded-[1.5rem]">
                        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2 mb-2">
                            <PieChartIcon className="w-5 h-5 text-primary" /> Spending Distribution
                        </h2>
                        <div className="h-[250px] w-full">
                            {categoryData.length > 0
                                ? <DynamicPieChart data={categoryData} />
                                : <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">No expenses for this period.</div>}
                        </div>
                        <div className="space-y-3 mt-4">
                            {categoryData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-surface-variant/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3.5 h-3.5 rounded-full ring-2 ring-surface-container-lowest" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-sm font-medium text-on-surface-variant hover:text-on-surface">{entry.name}</span>
                                    </div>
                                    <div className="text-sm font-bold text-on-surface">₹{entry.value.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 flex flex-col bg-surface-container-lowest ghost-border ambient-shadow rounded-[1.5rem]">
                        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2 mb-2">
                            <Smartphone className="w-5 h-5 text-primary" /> UPI Payment Volumes
                        </h2>
                        <div className="h-[250px] w-full">
                            {upiRangeData.length > 0
                                ? <DynamicPieChart data={upiRangeData} />
                                : <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm text-center">No UPI payments in this range.</div>}
                        </div>
                        <div className="space-y-3 mt-4">
                            {upiRangeData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-surface-variant/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3.5 h-3.5 rounded-full ring-2 ring-surface-container-lowest" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                                        <span className="text-sm font-medium text-on-surface-variant hover:text-on-surface">{entry.name}</span>
                                    </div>
                                    <div className="text-sm font-bold text-on-surface">₹{entry.value.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
