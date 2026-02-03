"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * @feature ORGANIZATION_REGISTRATION
 * @aiNote Enhanced registration with email confirmation flow and resend functionality.
 */
export default function OrganizationRegisterPage() {
    const [formData, setFormData] = useState({
        organizationName: "",
        adminEmail: "",
        password: "",
        confirmPassword: "",
        role: "admin",
        industry: "IT"
    });
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

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            // Call registration API
            const response = await fetch("/api/organization/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationName: formData.organizationName,
                    slug: generateSlug(formData.organizationName),
                    adminEmail: formData.adminEmail,
                    password: formData.password,
                    industry: formData.industry,
                    role: formData.role,
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            setRegisteredEmail(formData.adminEmail);
            setSuccess(true);
            setResendCooldown(60);

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
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6">
                <div className="w-full max-w-md p-8 rounded-3xl border border-indigo-700/30 bg-indigo-950/50 backdrop-blur shadow-xl text-center">
                    {/* Email Icon */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Check Your Email!</h2>
                    <p className="text-indigo-200 mb-6">
                        We sent a confirmation link to:
                    </p>
                    <p className="text-indigo-100 font-semibold bg-indigo-800/50 px-4 py-2 rounded-xl mb-6">
                        {registeredEmail}
                    </p>
                    <p className="text-indigo-300 text-sm mb-6">
                        Click the link in your email to verify your account and access your organization dashboard.
                    </p>

                    {/* Organization Info */}
                    <div className="bg-indigo-800/30 rounded-xl p-4 mb-6 text-left">
                        <p className="text-indigo-400 text-xs uppercase tracking-widest mb-2">Your Organization</p>
                        <p className="text-white font-semibold">{formData.organizationName}</p>
                    </div>

                    {/* Resend Section */}
                    <div className="border-t border-indigo-700/30 pt-6 mt-6">
                        <p className="text-indigo-400 text-xs mb-3">Didn't receive the email?</p>
                        <button
                            onClick={handleResendEmail}
                            disabled={resendLoading || resendCooldown > 0}
                            className="px-6 py-3 rounded-xl bg-indigo-800/50 border border-indigo-600/30 text-indigo-200 font-medium hover:bg-indigo-700/50 disabled:opacity-50 transition-all text-sm"
                        >
                            {resendLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
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
                            href="/organization/login"
                            className="text-indigo-300 text-sm hover:text-white transition-colors"
                        >
                            Already confirmed? Sign In →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/30 mb-4">
                        🏢
                    </div>
                    <h1 className="font-bold text-2xl text-white tracking-tighter">Register Your Organization</h1>
                    <p className="text-indigo-300 text-sm mt-2">Create your workspace on TalentHub</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 rounded-3xl border border-indigo-700/30 bg-indigo-950/50 backdrop-blur shadow-xl">
                    {error && (
                        <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-2xl text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-1 mb-4">
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest px-1">
                            Organization Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.organizationName}
                            onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                            className="h-12 w-full rounded-2xl bg-indigo-900/50 border border-indigo-700/50 px-4 text-sm text-white placeholder-indigo-400/50 focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                            placeholder="Acme Staffing Solutions"
                        />
                        <p className="text-xs text-indigo-400 px-1 mt-1">
                            Slug: {generateSlug(formData.organizationName) || 'your-organization'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest px-1">
                            Admin Email <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.adminEmail}
                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                            className="h-12 w-full rounded-2xl bg-indigo-900/50 border border-indigo-700/50 px-4 text-sm text-white placeholder-indigo-400/50 focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                            placeholder="admin@yourcompany.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest px-1">Your Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="h-12 w-full rounded-2xl bg-indigo-900/50 border border-indigo-700/50 px-4 text-sm text-white focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                            >
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest px-1">Industry</label>
                            <select
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="h-12 w-full rounded-2xl bg-indigo-900/50 border border-indigo-700/50 px-4 text-sm text-white focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                            >
                                <option value="IT">IT / Technology</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Education">Education</option>
                                <option value="Finance">Finance</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest px-1">
                            Password <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="h-12 w-full rounded-2xl bg-indigo-900/50 border border-indigo-700/50 px-4 text-sm text-white placeholder-indigo-400/50 focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-indigo-400 px-1 mt-1">Minimum 6 characters</p>
                    </div>

                    <div className="flex flex-col gap-1 mb-6">
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest px-1">
                            Confirm Password <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="h-12 w-full rounded-2xl bg-indigo-900/50 border border-indigo-700/50 px-4 text-sm text-white placeholder-indigo-400/50 focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="h-12 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating Organization...
                            </>
                        ) : (
                            "Create Organization"
                        )}
                    </button>

                    <div className="mt-6 text-center">
                        <Link href="/organization/login" className="text-indigo-300 hover:text-indigo-100 text-sm transition-colors">
                            Already have an organization? Sign in
                        </Link>
                    </div>
                </form>

                {/* Info Box */}
                <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <p className="text-indigo-300 text-xs font-medium mb-2">✨ What You Get</p>
                    <ul className="text-indigo-400/90 text-xs space-y-1">
                        <li>• Post unlimited job requirements</li>
                        <li>• Access to matched engineers pool</li>
                        <li>• Schedule video interviews</li>
                        <li>• Send offer letters & track placements</li>
                        <li>• Integrated payment processing</li>
                    </ul>
                </div>

                <div className="mt-6 text-center">
                    <Link
                        href="/engineer/register"
                        className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
                    >
                        ← Register as Engineer instead
                    </Link>
                </div>
            </div>
        </div>
    );
}
