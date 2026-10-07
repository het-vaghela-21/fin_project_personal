import { connectMongo } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

export type AITransaction = {
    title: string;
    amount: number;
    type: "credit" | "debit";
    category: string;
    date: string; // YYYY-MM-DD
};

/** Most recent first; capped so a long history can't blow up the prompt size. */
const MAX_TRANSACTIONS = 300;

export type AIContext = {
    transactions: AITransaction[];
    /** Totals over the user's whole history, not just the capped list above. */
    totalCredit: number;
    totalDebit: number;
};

/** Loads the caller's own transactions (compact shape for AI prompts) plus all-time totals. */
export async function loadAIContext(uid: string): Promise<AIContext> {
    await connectMongo();
    const totals = await Transaction.aggregate<{ _id: "credit" | "debit"; sum: number }>([
        { $match: { userId: uid } },
        { $group: { _id: "$type", sum: { $sum: "$amount" } } },
    ]);
    const rows = await Transaction.find({ userId: uid })
        .sort({ date: -1 })
        .limit(MAX_TRANSACTIONS)
        .select({ title: 1, amount: 1, type: 1, category: 1, date: 1 })
        .lean<{ title: string; amount: number; type: "credit" | "debit"; category: string; date: Date }[]>();

    return {
        transactions: rows.map((t) => ({
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: new Date(t.date).toISOString().slice(0, 10),
        })),
        totalCredit: totals.find((t) => t._id === "credit")?.sum ?? 0,
        totalDebit: totals.find((t) => t._id === "debit")?.sum ?? 0,
    };
}
