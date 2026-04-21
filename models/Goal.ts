import mongoose from "mongoose";

const GoalSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true }
});

// Avoid re-compiling the model if it already exists
export const Goal = mongoose.models.Goal || mongoose.model("Goal", GoalSchema);
