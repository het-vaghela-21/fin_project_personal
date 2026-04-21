import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// v1beta endpoint supports gemini-1.5-flash which has a separate quota pool
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
});

const MODEL_FALLBACK_CHAIN = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
];

export async function POST(req: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY is not configured in the environment variables." },
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

        let lastError: Error | null = null;

        for (const modelName of MODEL_FALLBACK_CHAIN) {
            try {
                console.log(`[Chat] Trying model: ${modelName}`);
                const response = await genAI.models.generateContent({
                    model: modelName,
                    contents: message,
                    config: {
                        systemInstruction,
                        temperature: 0.7,
                    },
                });
                console.log(`[Chat] ✅ Success with model: ${modelName}`);
                return NextResponse.json({ reply: response.text ?? "I could not generate a response." });
            } catch (err) {
                const e = err as Error;
                console.warn(`[Chat] Model ${modelName} failed: ${e.message.substring(0, 200)}`);
                lastError = e;
                const isRetryable = e.message.includes("429") ||
                    e.message.includes("503") ||
                    e.message.includes("RESOURCE_EXHAUSTED") ||
                    e.message.includes("Too Many Requests");
                if (!isRetryable) break;
                await new Promise((r) => setTimeout(r, 300));
            }
        }

        // All models failed — return friendly message in chat format
        const e = lastError as Error;
        if (e.message.includes("RESOURCE_EXHAUSTED") || e.message.includes("quota") || e.message.includes("429")) {
            const retryMatch = e.message.match(/retry[^0-9]*(\d+(\.\d+)?)\s*s/i);
            const waitSecs = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;
            const waitMsg = waitSecs
                ? `Please wait **${waitSecs} seconds** and try again.`
                : "Your daily free-tier quota may be exhausted. The quota resets at **midnight Pacific Time (≈1:30 PM IST)**. Please try again later.";
            return NextResponse.json({
                reply: `⚠️ All AI models are currently rate-limited. ${waitMsg}`
            });
        }

        return NextResponse.json(
            { error: e?.message?.substring(0, 300) || "An error occurred during AI processing." },
            { status: 500 }
        );

    } catch (error) {
        const e = error as Error;
        console.error("[Chat] Unexpected error:", e);
        return NextResponse.json(
            { error: e?.message || "An error occurred during AI processing." },
            { status: 500 }
        );
    }
}
