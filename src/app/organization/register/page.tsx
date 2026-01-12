"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * @feature ORGANIZATION_REGISTRATION
 * @aiNote Allows new organizations to self-register and create their tenant workspace.
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
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

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
                    role: formData.role
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            setSuccess(true);

            // Auto-login after registration
            setTimeout(() => {
                router.push("/organization/login");
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-indigo-950/50 backdrop-blur-xl p-8 rounded-3xl border border-indigo-700/30 text-center shadow-xl">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
                    <p className="text-indigo-200 mb-4">
                        Your organization has been created. Check your email to verify your account.
                    </p>
                    <p className="text-sm text-indigo-300">Redirecting to login...</p>
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
                                Creating...
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
                        href="/login"
                        className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
                    >
                        ← Back to Main Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}
