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

async function generateWithFallback(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (const modelName of MODEL_FALLBACK_CHAIN) {
        try {
            console.log(`[Insights] Trying model: ${modelName}`);
            const response = await genAI.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                },
            });
            console.log(`[Insights] ✅ Success with model: ${modelName}`);
            return response.text?.trim() ?? "";
        } catch (err) {
            const e = err as Error;
            const shortMsg = e.message.substring(0, 200);
            console.warn(`[Insights] Model ${modelName} failed: ${shortMsg}`);
            lastError = e;
            // Continue fallback on quota/rate/overload errors only
            const isRetryable = e.message.includes("429") ||
                e.message.includes("503") ||
                e.message.includes("RESOURCE_EXHAUSTED") ||
                e.message.includes("Too Many Requests") ||
                e.message.includes("Service Unavailable");
            if (!isRetryable) throw e;
            await new Promise((r) => setTimeout(r, 500));
        }
    }

    throw lastError ?? new Error("All AI models are currently unavailable. Please try again later.");
}

export async function POST(req: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY is not configured in the environment variables." },
            { status: 500 }
        );
    }

    try {
        const { transactions } = await req.json();

        if (!transactions || !Array.isArray(transactions)) {
            return NextResponse.json({ error: "Invalid transactions array" }, { status: 400 });
        }

const systemPrompt = `
You are a top-tier Financial Advisor AI. Analyze the following user transaction data and provide exactly 3 actionable, highly specific financial insights. Also provide a portfolio 'healthScore' from 0 to 100 based on their savings rate, spending patterns, and net flow.
CRITICAL MANDATE: You MUST use the Indian Rupee symbol (₹) for ALL monetary values. DO NOT use the dollar sign ($) under any circumstances.

Transactions:
${JSON.stringify(transactions, null, 2)}

You must return your response STRICTLY as a raw JSON object (without markdown wrappers like \`\`\`json) matching this schema exactly:
{
  "healthScore": 85,
  "insightText": "A 2-sentence summary of why the score is what it is.",
  "insights": [
    {
      "id": 1,
      "type": "warning",
      "title": "Short title",
      "desc": "Detailed 2-sentence description",
      "color": "text-red-500",
      "bg": "bg-red-500/10",
      "border": "border-red-500/20"
    }
  ]
}
Valid values for type: "warning", "opportunity", "tip"
Valid values for color: "text-red-500", "text-green-500", "text-yellow-500"
Valid values for bg: "bg-red-500/10", "bg-green-500/10", "bg-yellow-500/10"
Valid values for border: "border-red-500/20", "border-green-500/20", "border-yellow-500/20"
`;

        let rawText = await generateWithFallback(systemPrompt);

        // Strip markdown code fences if present
        if (rawText.startsWith("```json")) rawText = rawText.substring(7);
        else if (rawText.startsWith("```")) rawText = rawText.substring(3);
        if (rawText.endsWith("```")) rawText = rawText.substring(0, rawText.length - 3);

        const parsed = JSON.parse(rawText.trim());
        return NextResponse.json({ data: parsed });

    } catch (error) {
        const e = error as Error;
        console.error("[Insights] Final error:", e.message.substring(0, 300));

        const retryMatch = e.message.match(/retry[^0-9]*(\d+(\.\d+)?)\s*s/i);
        if (retryMatch) {
            return NextResponse.json(
                { error: `Rate limit reached. Please retry in ${retryMatch[1]}s after some time.` },
                { status: 429 }
            );
        }
        if (e.message.includes("RESOURCE_EXHAUSTED") || e.message.includes("quota")) {
            return NextResponse.json(
                { error: "Daily AI quota exhausted. The quota resets at midnight Pacific Time (approx. 1:30 PM IST). Please try again later." },
                { status: 429 }
            );
        }
        return NextResponse.json(
            { error: e?.message?.substring(0, 300) || "An error occurred during AI processing." },
            { status: 500 }
        );
    }
}
