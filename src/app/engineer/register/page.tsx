"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { logAuthEvent } from "@/lib/audit";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * @feature ENGINEER_REGISTER_PORTAL
 * @aiNote Enhanced registration page for engineers/contractors.
 * Includes email confirmation flow with resend functionality.
 */
export default function EngineerRegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for error from callback
    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
        }
    }, [searchParams]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            // Fetch default tenant for engineers
            const { data: defaultTenant } = await supabase
                .from("tenants")
                .select("id")
                .eq("is_active", true)
                .limit(1)
                .single();

            const tenantId = (defaultTenant as any)?.id || null;

            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: fullName,
                        tenant_id: tenantId,
                        role: "provider"
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Create profile record for the engineer
            if (signUpData.user) {
                const { error: profileError } = await supabase
                    .from("profiles")
                    .upsert({
                        id: signUpData.user.id,
                        user_id: signUpData.user.id,
                        full_name: fullName,
                        email: email,
                        role: "provider",
                        tenant_id: tenantId
                    } as any, { onConflict: 'id' });

                if (profileError) {
                    console.error("Profile creation error:", JSON.stringify(profileError));
                }
            }

            await logAuthEvent("registration", { email, role: "provider", portal: "engineer" });
            setRegisteredEmail(email);
            setSuccess(true);
            setResendCooldown(60); // 60 second cooldown

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        if (resendCooldown > 0) return;
        setResendLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: registeredEmail,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                }
            });

            if (error) throw error;
            setResendCooldown(60);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setResendLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 flex items-center justify-center p-6">
                <div className="w-full max-w-md p-8 rounded-3xl border border-emerald-700/30 bg-emerald-950/50 backdrop-blur shadow-xl text-center">
                    {/* Email Icon */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Check Your Email!</h2>
                    <p className="text-emerald-200 mb-6">
                        We sent a confirmation link to:
                    </p>
                    <p className="text-emerald-100 font-semibold bg-emerald-800/50 px-4 py-2 rounded-xl mb-6">
                        {registeredEmail}
                    </p>
                    <p className="text-emerald-300 text-sm mb-6">
                        Click the link in your email to verify your account and complete registration.
                    </p>

                    {/* Resend Section */}
                    <div className="border-t border-emerald-700/30 pt-6 mt-6">
                        <p className="text-emerald-400 text-xs mb-3">Didn't receive the email?</p>
                        <button
                            onClick={handleResendEmail}
                            disabled={resendLoading || resendCooldown > 0}
                            className="px-6 py-3 rounded-xl bg-emerald-800/50 border border-emerald-600/30 text-emerald-200 font-medium hover:bg-emerald-700/50 disabled:opacity-50 transition-all text-sm"
                        >
                            {resendLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin" />
                                    Sending...
                                </span>
                            ) : resendCooldown > 0 ? (
                                `Resend in ${resendCooldown}s`
                            ) : (
                                "Resend Confirmation Email"
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 text-xs font-medium text-red-400 bg-red-900/20 rounded-xl border border-red-900/30">
                            {error}
                        </div>
                    )}

                    {/* Alternative Actions */}
                    <div className="mt-8 flex flex-col gap-2">
                        <Link
                            href="/engineer/login"
                            className="text-emerald-300 text-sm hover:text-white transition-colors"
                        >
                            Already confirmed? Sign In →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Engineer Branding */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-emerald-500/30 mb-4">
                        👷
                    </div>
                    <h1 className="font-bold text-2xl text-white tracking-tighter">Join as Engineer</h1>
                    <p className="text-emerald-300 text-sm mt-2">Create your provider account</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-8 rounded-3xl border border-emerald-700/30 bg-emerald-950/50 backdrop-blur shadow-xl">
                    {error && (
                        <div className="p-3 text-xs font-medium text-red-400 bg-red-900/20 rounded-xl border border-red-900/30">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest px-1">
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="h-12 w-full rounded-2xl bg-emerald-900/50 border border-emerald-700/50 px-4 text-sm text-white placeholder-emerald-400/50 focus:ring-2 focus:ring-emerald-400 transition-all font-medium"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest px-1">
                            Email <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 w-full rounded-2xl bg-emerald-900/50 border border-emerald-700/50 px-4 text-sm text-white placeholder-emerald-400/50 focus:ring-2 focus:ring-emerald-400 transition-all font-medium"
                            placeholder="name@email.com"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest px-1">
                            Password <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 w-full rounded-2xl bg-emerald-900/50 border border-emerald-700/50 px-4 text-sm text-white placeholder-emerald-400/50 focus:ring-2 focus:ring-emerald-400 transition-all font-medium"
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-emerald-500 px-1 mt-1">Minimum 6 characters</p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest px-1">
                            Confirm Password <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-emerald-400 text-xs">
                        Start finding opportunities and showcase your skills.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/engineer/login"
                            className="text-emerald-300 text-sm hover:text-white transition-colors"
                        >
                            Already have an account? Sign In →
                        </Link>
                        <Link
                            href="/organization/register"
                            className="text-emerald-400/60 text-sm hover:text-emerald-300 transition-colors"
                        >
                            ← Register as Organization
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
