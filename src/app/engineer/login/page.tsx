"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { logAuthEvent } from "@/lib/audit";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * @feature ENGINEER_LOGIN_PORTAL
 * @aiNote Dedicated login portal for service providers (engineers/contractors).
 * Has distinct emerald/teal branding. Routes to /engineer/profile after login.
 */
export default function EngineerLoginPage() {
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
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) throw signInError;

            await logAuthEvent("login", { email, portal: "engineer" });
            router.push("/engineer/profile");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            await logAuthEvent("auth_failure", { email, reason: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Engineer Branding */}
                <div className="flex flex-col items-center mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-emerald-500/30 mb-4">
                        👷
                    </div>
                    <h1 className="font-bold text-2xl text-white tracking-tighter">Engineer Portal</h1>
                    <p className="text-emerald-300 text-sm mt-2">Service Provider Access</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-8 rounded-3xl border border-emerald-700/30 bg-emerald-950/50 backdrop-blur shadow-xl">
                    {error && (
                        <div className="p-3 text-xs font-medium text-red-400 bg-red-900/20 rounded-xl border border-red-900/30">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest px-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 w-full rounded-2xl bg-emerald-900/50 border border-emerald-700/50 px-4 text-sm text-white placeholder-emerald-400/50 focus:ring-2 focus:ring-emerald-400 transition-all font-medium"
                            placeholder="name@company.com"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest px-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 w-full rounded-2xl bg-emerald-900/50 border border-emerald-700/50 px-4 text-sm text-white placeholder-emerald-400/50 focus:ring-2 focus:ring-emerald-400 transition-all font-medium"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Sign In as Provider"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-emerald-400 text-xs">
                        Find placement opportunities and manage your profile.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/register"
                            className="text-emerald-300 text-sm hover:text-white transition-colors"
                        >
                            Register as Provider →
                        </Link>
                        <Link
                            href="/login"
                            className="text-emerald-400/60 text-sm hover:text-emerald-300 transition-colors"
                        >
                            ← Back to Client Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
