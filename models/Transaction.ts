import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ITransaction extends Document {
    userId: string;          // Firebase UID
    type: "credit" | "debit";
    amount: number;
    category: string;
    title: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        userId: { type: String, required: true, index: true },
        type: { type: String, enum: ["credit", "debit"], required: true },
        amount: { type: Number, required: true },
        category: { type: String, required: true },
        title: { type: String, required: true },
        date: { type: Date, required: true, default: Date.now },
    },
    { timestamps: true }
);

// Compound index: satisfies `find({ userId }).sort({ date: -1 })` in one scan
TransactionSchema.index({ userId: 1, date: -1 });

export const Transaction = models.Transaction || model<ITransaction>("Transaction", TransactionSchema);
