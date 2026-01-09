"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface AuthFormProps {
    mode: "login" | "register";
}

/**
 * @feature auth:login-register
 * @aiNote This component handles both login and registration. It uses the Supabase client for authentication.
 * @businessRule Users are assigned to a default tenant on registration for this bootcamp session.
 */
export default function AuthForm({ mode }: AuthFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === "register") {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            // Default to TalentHub Solutions for the bootcamp
                            tenant_id: "talenthub",
                        },
                    },
                });
                if (signUpError) throw signUpError;
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
            }
            router.push("/products");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-none">
            <div className="flex flex-col gap-2 mb-4">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {mode === "login" ? "Welcome back" : "Create an account"}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {mode === "login"
                        ? "Enter your credentials to access your dashboard"
                        : "Join the TalentHub network today"}
                </p>
            </div>

            {error && (
                <div className="p-3 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Email</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-all font-medium"
                    placeholder="name@company.com"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Password</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-all font-medium"
                    placeholder="••••••••"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="mt-4 h-12 w-full rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-zinc-900/20 dark:shadow-none flex items-center justify-center gap-2"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    mode === "login" ? "Sign In" : "Get Started"
                )}
            </button>

            <p className="mt-4 text-center text-sm text-zinc-500">
                {mode === "login" ? (
                    <>
                        Don't have an account?{" "}
                        <a href="/register" className="font-bold text-zinc-900 dark:text-zinc-50 hover:underline underline-offset-4">Sign Up</a>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <a href="/login" className="font-bold text-zinc-900 dark:text-zinc-50 hover:underline underline-offset-4">Sign In</a>
                    </>
                )}
            </p>
        </form>
    );
}
