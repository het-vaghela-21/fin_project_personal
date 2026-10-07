import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Goal } from "@/models/Goal";
import { verifyAuth } from "@/lib/verifyAuth";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const uid = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = params;
        const { amountToAdd } = await req.json();

        if (!id || amountToAdd === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectMongo();

        const goal = await Goal.findOne({ _id: id, userId: uid });
        if (!goal) {
            return NextResponse.json({ error: "Goal not found or not owned by user" }, { status: 404 });
        }

        goal.currentAmount += amountToAdd;
        await goal.save();

        return NextResponse.json({
            goal: {
                id: goal._id.toString(),
                title: goal.title,
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount,
                createdAt: goal.createdAt,
            }
        });
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

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

        const goal = await Goal.findOneAndDelete({ _id: id, userId: uid });

        if (!goal) {
            return NextResponse.json({ error: "Goal not found or not owned by user" }, { status: 404 });
        }

        return NextResponse.json({ success: true, id: id });
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
