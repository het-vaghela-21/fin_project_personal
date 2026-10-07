import { NextResponse } from "next/server";
import { groqChat, isRetryableGroqError } from "@/lib/groq";

export async function POST(req: Request) {
    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json(
            { error: "GROQ_API_KEY is not configured in the environment variables." },
            { status: 500 }
        );
    }

    try {
        const { message, transactions } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        type TxContext = { type: string; amount: number };
        const totalDebit = transactions?.filter((t: TxContext) => t.type === 'debit').reduce((sum: number, t: TxContext) => sum + t.amount, 0) || 0;
        const totalCredit = transactions?.filter((t: TxContext) => t.type === 'credit').reduce((sum: number, t: TxContext) => sum + t.amount, 0) || 0;
        const netWorth = totalCredit - totalDebit;

        const systemInstruction = `You are FinAI, a highly advanced, professional, and strictly bounded Financial Advisor AI.
You act as an intelligence layer on top of a user's personal dashboard.

CRITICAL RULES:
1. ONLY answer questions related to finance, markets, stocks, economics, or the user's personal financial portfolio.
2. If the user asks about anything else, firmly reject the query and explain you are a specialized financial AI.
3. Be concise, professional, and analytical. Use bold formatting to highlight key numbers or insights.
4. Always complete your responses fully. Never truncate sentences.
5. You MUST format all monetary values using the Indian Rupee symbol (₹). Do NOT use ($).

USER'S CURRENT FINANCIAL CONTEXT:
- Total Cash Received (Credit): ₹${totalCredit.toFixed(2)}
- Total Cash Spent (Debit): ₹${totalDebit.toFixed(2)}
- Current Net Balance: ₹${netWorth.toFixed(2)}

Raw Transaction Data:
${JSON.stringify(transactions, null, 2)}

Only reference the above data if the user asks about their own portfolio/spending.`;

        try {
            const reply = await groqChat(
                [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: message },
                ],
                { temperature: 0.7 },
                "Chat"
            );
            return NextResponse.json({ reply: reply || "I could not generate a response." });
        } catch (err) {
            const e = err as Error;
            if (isRetryableGroqError(err)) {
                return NextResponse.json({
                    reply: "⚠️ All AI models are currently rate-limited. Please wait **a minute** and try again."
                });
            }
            return NextResponse.json(
                { error: e?.message?.substring(0, 300) || "An error occurred during AI processing." },
                { status: 500 }
            );
        }

    } catch (error) {
        const e = error as Error;
        console.error("[Chat] Unexpected error:", e);
        return NextResponse.json(
            { error: e?.message || "An error occurred during AI processing." },
            { status: 500 }
        );
    }
}
