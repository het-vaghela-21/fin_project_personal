import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ITransaction extends Document {
    userId: string;          // Firebase UID
    type: "credit" | "debit";
    amount: number;
    category: string;
    title: string;
    date: Date;
    // Gmail UPI sync metadata — optional, only present for auto-imported entries
    source: "manual" | "gmail_upi";
    gmailMessageId?: string;  // Gmail message ID — used for deduplication
    merchant?: string;        // e.g., "Swiggy", "Amazon Pay"
    upiRef?: string;          // UTR / UPI reference number
    bankName?: string;        // e.g., "HDFC Bank"
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
        // Gmail UPI fields
        source: { type: String, enum: ["manual", "gmail_upi"], default: "manual" },
        gmailMessageId: { type: String, default: undefined },
        merchant: { type: String, default: undefined },
        upiRef: { type: String, default: undefined },
        bankName: { type: String, default: undefined },
    },
    { timestamps: true }
);

// Compound index: satisfies `find({ userId }).sort({ date: -1 })` in one scan
TransactionSchema.index({ userId: 1, date: -1 });
// Index for fast dedup lookup on gmailMessageId
TransactionSchema.index({ userId: 1, gmailMessageId: 1 }, { sparse: true });

export const Transaction = models.Transaction || model<ITransaction>("Transaction", TransactionSchema);
