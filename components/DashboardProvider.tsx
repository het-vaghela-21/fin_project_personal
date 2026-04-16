"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

export type TransactionCategory = string;
export type TransactionType = 'credit' | 'debit';

export interface Transaction {
    id: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    date: Date;
    title: string;
}

interface DashboardContextType {
    transactions: Transaction[];
    loadingTransactions: boolean;
    addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) {
                setTransactions([]);
                setLoadingTransactions(false);
                return;
            }
            try {
                setLoadingTransactions(true);
                const token = user.uid;
                const res = await fetch("/api/transactions", {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const txs = (data.transactions || []).map((t: any) => ({
                        ...t,
                        date: new Date(t.date)
                    }));
                    setTransactions(txs);
                } else {
                    console.error("Failed to fetch transactions");
                }
            } catch (err) {
                console.error("Error fetching transactions:", err);
            } finally {
                setLoadingTransactions(false);
            }
        };

        fetchTransactions();
    }, [user]);

    const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
        if (!user) return;
        try {
            const token = user.uid;
            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: tx.amount,
                    type: tx.type,
                    category: tx.category,
                    title: tx.title,
                    date: tx.date.toISOString(),
                })
            });
            if (res.ok) {
                const data = await res.json();
                const newTx: Transaction = {
                    ...data.transaction,
                    date: new Date(data.transaction.date)
                };
                setTransactions(prev => [newTx, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));
            }
        } catch (err) {
            console.error("Error adding transaction:", err);
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user) return;
        try {
            const token = user.uid;
            const res = await fetch(`/api/transactions/${id}`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setTransactions(prev => prev.filter(t => t.id !== id));
            }
        } catch (err) {
            console.error("Error deleting transaction:", err);
        }
    };

    return (
        <DashboardContext.Provider value={{ transactions, loadingTransactions, addTransaction, deleteTransaction }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
