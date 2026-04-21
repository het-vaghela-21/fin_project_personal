import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Goal } from "@/models/Goal";

const verifyAuth = (req: NextRequest) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    return authHeader.split(" ")[1];
};

export async function GET(req: NextRequest) {
    const uid = verifyAuth(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await connectMongo();
        const goals = await Goal.find({ userId: uid }).sort({ createdAt: -1 }).lean();

        type GoalContext = { _id: { toString: () => string }; title: string; targetAmount: number; currentAmount: number; createdAt: Date };
        
        const mapped = goals.map((g: GoalContext) => ({
            id: g._id.toString(),
            title: g.title,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount,
            createdAt: g.createdAt,
        }));

        return NextResponse.json(
            { goals: mapped },
            {
                headers: {
                    "Cache-Control": "private, max-age=0, must-revalidate",
                },
            }
        );
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const uid = verifyAuth(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { title, targetAmount } = body;

        if (!title || !targetAmount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectMongo();
        const newGoal = await Goal.create({
            userId: uid,
            title,
            targetAmount,
            currentAmount: 0,
        });

        return NextResponse.json({
            goal: {
                id: newGoal._id.toString(),
                title: newGoal.title,
                targetAmount: newGoal.targetAmount,
                currentAmount: newGoal.currentAmount,
                createdAt: newGoal.createdAt,
            }
        }, { status: 201 });
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
