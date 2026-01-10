"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { logAuthEvent } from "@/lib/audit";
import { useRouter } from "next/navigation";

// Hardcoded admin credentials as specified
const ADMIN_EMAIL = "davidkuriyan20@gmail.com";
const ADMIN_PASSWORD = "David@123";

/**
 * @feature SUPER_ADMIN_LOGIN
 * @aiNote Separate login portal for super admins only.
 * Super admins have cross-tenant access and platform management capabilities.
 * This login supports both direct hardcoded credentials AND regular Supabase auth.
 */
export default function SuperAdminLoginPage() {
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
            // Check for direct admin credentials first
            if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                // For hardcoded admin, we still try Supabase auth to maintain session
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) {
                    // If Supabase auth fails for hardcoded credentials, 
                    // the admin may need to be created in Supabase first
                    // For now, we'll show a helpful message
                    setError("Admin account not found in database. Please register this email in Supabase first.");
                    await logAuthEvent("admin_login_attempt", { email, method: "hardcoded", status: "account_not_found" });
                    setLoading(false);
                    return;
                }

                await logAuthEvent("admin_login", { email, method: "hardcoded", portal: "super_admin" });
                router.push("/admin");
                router.refresh();
                return;
            }

            // Regular Supabase auth for other admin accounts
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            // Verify admin role
            const role = signInData.user?.user_metadata?.role || signInData.user?.app_metadata?.role;
            if (role !== "admin") {
                await supabase.auth.signOut();
                throw new Error("Access denied. Admin privileges required.");
            }

            await logAuthEvent("admin_login", { email, method: "supabase", portal: "super_admin" });
            router.push("/admin");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            await logAuthEvent("admin_auth_failure", { email, reason: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Super Admin Branding */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-red-500/30 mb-4">
                        🛡️
                    </div>
                    <h1 className="font-bold text-2xl text-white tracking-tighter">Super Admin Portal</h1>
                    <p className="text-zinc-400 text-sm mt-2">Platform Management Access</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-8 rounded-3xl border border-zinc-700/50 bg-zinc-800/50 backdrop-blur shadow-xl">
                    {error && (
                        <div className="p-3 text-xs font-medium text-red-400 bg-red-900/20 rounded-xl border border-red-900/30">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Admin Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 w-full rounded-2xl bg-zinc-900/50 border border-zinc-700/50 px-4 text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-500 transition-all font-medium"
                            placeholder="admin@company.com"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 w-full rounded-2xl bg-zinc-900/50 border border-zinc-700/50 px-4 text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-500 transition-all font-medium"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Access Admin Panel"
                        )}
                    </button>
                </form>

                {/* Warning Box */}
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-red-400 text-xs font-medium mb-2">⚠️ Restricted Access</p>
                    <p className="text-zinc-500 text-xs">
                        This portal is for authorized platform administrators only.
                        All access attempts are logged and monitored.
                    </p>
                </div>

                <div className="mt-8 text-center">
                    <a
                        href="/login"
                        className="text-zinc-500 text-sm hover:text-white transition-colors"
                    >
                        ← Back to User Login
                    </a>
                </div>
            </div>
        </div>
    );
}
