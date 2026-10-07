// Groq client (OpenAI-compatible Chat Completions API) used by all AI features.

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Tried in order; falls through to the next model on rate-limit / overload errors.
export const GROQ_MODEL_FALLBACK_CHAIN = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
];

export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

type GroqOptions = {
    temperature?: number;
    json?: boolean;
    maxTokens?: number;
};

export class GroqError extends Error {
    constructor(message: string, public status: number) {
        super(message);
    }
}

export function isRetryableGroqError(e: unknown): boolean {
    if (e instanceof GroqError) return e.status === 429 || e.status >= 500;
    return false;
}

async function callGroq(model: string, messages: GroqMessage[], opts: GroqOptions): Promise<string> {
    const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: opts.temperature ?? 0.7,
            max_completion_tokens: opts.maxTokens ?? 2048,
            ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        let message = body;
        try {
            message = JSON.parse(body)?.error?.message ?? body;
        } catch { /* keep raw body */ }
        throw new GroqError(`Groq ${res.status}: ${message}`, res.status);
    }

    const data = await res.json();
    return (data.choices?.[0]?.message?.content ?? "").trim();
}

/** Runs a chat completion, falling back through GROQ_MODEL_FALLBACK_CHAIN on retryable errors. */
export async function groqChat(messages: GroqMessage[], opts: GroqOptions = {}, tag = "Groq"): Promise<string> {
    let lastError: unknown = null;

    for (const model of GROQ_MODEL_FALLBACK_CHAIN) {
        try {
            console.log(`[${tag}] Trying model: ${model}`);
            const text = await callGroq(model, messages, opts);
            console.log(`[${tag}] ✅ Success with model: ${model}`);
            return text;
        } catch (err) {
            lastError = err;
            console.warn(`[${tag}] Model ${model} failed: ${(err as Error).message.substring(0, 200)}`);
            if (!isRetryableGroqError(err)) throw err;
            await new Promise((r) => setTimeout(r, 400));
        }
    }

    throw lastError ?? new Error("All AI models are currently unavailable. Please try again later.");
}
