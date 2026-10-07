import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { verifyAuth } from "@/lib/verifyAuth";
import { CREDIT_CATEGORIES, DEBIT_CATEGORIES } from "@/lib/categories";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const uid = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = params;
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await connectMongo();

        // Ensure the transaction belongs to the user
        const tx = await Transaction.findOneAndDelete({ _id: id, userId: uid });

        if (!tx) {
            return NextResponse.json({ error: "Transaction not found or not owned by user" }, { status: 404 });
        }

        return NextResponse.json({ success: true, id: id });
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// Currently only the category can be changed (used to correct AI-scanned bills).
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const uid = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { category } = await req.json();
        const allowed: readonly string[] = [...DEBIT_CATEGORIES, ...CREDIT_CATEGORIES];
        if (typeof category !== "string" || !allowed.includes(category)) {
            return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        await connectMongo();
        const tx = await Transaction.findOneAndUpdate(
            { _id: params.id, userId: uid },
            { $set: { category } },
            { new: true }
        );
        if (!tx) {
            return NextResponse.json({ error: "Transaction not found or not owned by user" }, { status: 404 });
        }

        return NextResponse.json({ success: true, id: params.id, category: tx.category });
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
