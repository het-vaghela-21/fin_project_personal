"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    userRole: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, phone: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── helper: sync user to MongoDB ───────────────────────────────────────────
async function syncToMongo(payload: {
    uid: string; name: string; email: string;
    phone: string; provider: string; role: string; password?: string;
}) {
    try {
        await fetch("/api/users/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch (e) {
        console.warn("[syncToMongo] failed:", e);
    }
}

// ── helper: record login event ─────────────────────────────────────────────
async function recordLoginEvent(uid: string) {
    // Fire-and-forget: don't block auth flow for login event recording
    try {
        // Get device string
        const device = navigator.userAgent.split(")")[0].replace("(", "").trim() || "Unknown";

        // Get IP in the background — don't let it block
        const ipPromise = fetch("https://api.ipify.org?format=json")
            .then(r => r.json())
            .then(d => d.ip || "Unknown")
            .catch(() => "Unknown");

        const ip = await ipPromise;

        fetch("/api/users/login-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, ip, device }),
        }).catch(() => { /* ignore */ });
    } catch (e) {
        console.warn("[recordLoginEvent] failed:", e);
    }
}

// ── helper: update Firestore last login ────────────────────────────────────
async function updateLastLogin(uid: string) {
    await setDoc(doc(db, "users", uid), { lastLogin: serverTimestamp() }, { merge: true });
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const token = await firebaseUser.getIdToken();
                document.cookie = `auth-token=${token}; path=/; max-age=3600; SameSite=Strict`;
                try {
                    const r = await fetch(`/api/users/profile?uid=${firebaseUser.uid}&email=${encodeURIComponent(firebaseUser.email || "")}`);
                    if (r.ok) {
                        const data = await r.json();
                        setUserRole(data.role || "user");
                        document.cookie = `user-role=${data.role || "user"}; path=/; max-age=3600; SameSite=Strict`;
                    } else {
                        setUserRole("user");
                        document.cookie = `user-role=user; path=/; max-age=3600; SameSite=Strict`;
                    }
                } catch (e) {
                    setUserRole("user");
                }
            } else {
                document.cookie = "auth-token=; path=/; max-age=0";
                document.cookie = "user-role=; path=/; max-age=0";
                setUserRole(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const signIn = async (email: string, password: string) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);

        let role = "user";
        try {
            const r = await fetch(`/api/users/profile?uid=${cred.user.uid}&email=${encodeURIComponent(email)}`);
            if (r.ok) {
                const d = await r.json();
                role = d.role || "user";
            }
        } catch { /* ignore */ }

        // Always sync returning users to Mongo
        await syncToMongo({
            uid: cred.user.uid,
            name: cred.user.displayName || "User",
            email,
            phone: cred.user.phoneNumber || "",
            provider: "email",
            role,
            password,
        });

        // Async — don't block UI
        recordLoginEvent(cred.user.uid);

        if (role === "admin") {
            router.push("/admin");
        } else {
            router.push("/dashboard");
        }
    };

    const signUp = async (email: string, password: string, name: string, phone: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });

        // Save to MongoDB (with encrypted password)
        await syncToMongo({
            uid: cred.user.uid, name, email, phone,
            provider: "email", role: "user", password,
        });
        recordLoginEvent(cred.user.uid);
        router.push("/dashboard");
    };

    const signInWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        const u = result.user;

        let role = "user";
        try {
            const r = await fetch(`/api/users/profile?uid=${u.uid}&email=${encodeURIComponent(u.email || "")}`);
            if (r.ok) {
                const d = await r.json();
                role = d.role || "user";
            }
        } catch { /* ignore */ }

        // ALWAYS execute syncToMongo. If this is a legacy user, they will be upserted to Mongo!
        await syncToMongo({
            uid: u.uid,
            name: u.displayName ?? "",
            email: u.email ?? "",
            phone: u.phoneNumber ?? "",
            provider: "google",
            role,
        });

        recordLoginEvent(u.uid);

        if (role === "admin") {
            router.push("/admin");
        } else {
            router.push("/dashboard");
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.push("/auth/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, userRole, signIn, signUp, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
