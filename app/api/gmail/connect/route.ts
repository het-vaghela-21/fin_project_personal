/**
 * GET /api/gmail/connect
 *
 * Generates the Google OAuth2 consent URL and redirects the user to it.
 * The user must be authenticated (Bearer token = Firebase UID).
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const authUrl = getAuthUrl();
        // Return URL to the client — client will do the redirect
        return NextResponse.json({ authUrl });
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
