"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { logAuthEvent } from "@/lib/audit";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Tenant {
    id: string;
    name: string;
    slug: string;
}

/**
 * @feature MULTI_TENANT_LOGIN
 * @aiNote Organization login with registration check.
 * Users must be pre-registered by admin before they can log in.
 * Select Company Name → Role → Password flow.
 */
export default function TenantLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedTenant, setSelectedTenant] = useState<string>("");
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(false);
    const [checkingRegistration, setCheckingRegistration] = useState(false);
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Fetch available tenants
    useEffect(() => {
        const fetchTenants = async () => {
            const { data, error } = await supabase
                .from("tenants")
                .select("id, name, slug")
                .eq("is_active", true)
                .order("name");

            if (!error && data) {
                setTenants(data as Tenant[]);
                if (data.length > 0) {
                    setSelectedTenant((data as Tenant[])[0].slug);
                }
            }
        };
        fetchTenants();
    }, []);

    // Check if user is registered when email changes
    const checkRegistration = async () => {
        if (!email || !email.includes("@")) {
            setIsRegistered(null);
            return;
        }

        setCheckingRegistration(true);
        try {
            // Check if user exists in auth.users by attempting to lookup
            // We can't directly query auth.users, so we check our users table
            const { data, error } = await supabase
                .from("users")
                .select("id, role")
                .eq("email", email)
                .maybeSingle();

            if (error) {
                console.error("Registration check error:", error);
                setIsRegistered(null);
            } else {
                setIsRegistered(!!data);
            }
        } catch (err) {
            console.error("Registration check failed:", err);
            setIsRegistered(null);
        } finally {
            setCheckingRegistration(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // First check registration
        if (isRegistered === false) {
            setError("You are not registered. Please contact your organization admin to create your account.");
            setLoading(false);
            return;
        }

        try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) throw signInError;

            await logAuthEvent("login", { email, tenant: selectedTenant, portal: "organization" });

            // Store selected tenant
            localStorage.setItem("selected_tenant", selectedTenant);

            // Route based on role
            const role = signInData.user?.user_metadata?.role || signInData.user?.app_metadata?.role;
            if (role === "admin") {
                router.push("/admin");
            } else if (role === "provider") {
                router.push("/engineer/profile");
            } else {
                // Default to client dashboard for recruiters/subscribers
                router.push("/client/dashboard");
            }
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            await logAuthEvent("auth_failure", { email, reason: err.message });
        } finally {
            setLoading(false);
        }
    };

    const selectedTenantData = tenants.find(t => t.slug === selectedTenant);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Organization Branding */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/30 mb-4">
                        🏢
                    </div>
                    <h1 className="font-bold text-2xl text-white tracking-tighter">Organization Login</h1>
                    <p className="text-indigo-300 text-sm mt-2">Recruiter & Client Access</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-8 rounded-3xl border border-indigo-700/30 bg-indigo-950/50 backdrop-blur shadow-xl">
                    {error && (
                        <div className="p-3 text-xs font-medium text-red-400 bg-red-900/20 rounded-xl border border-red-900/30">
                            {error}
                        </div>
                    )}

                    {/* Tenant Selection */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest px-1">
                            Organization
                        </label>
                        <select
                            value={selectedTenant}
                            onChange={(e) => setSelectedTenant(e.target.value)}
                            className="h-12 w-full rounded-2xl bg-indigo-900/50 border border-indigo-700/50 px-4 text-sm text-white focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                        >
                            {tenants.map((tenant) => (
                                <option key={tenant.id} value={tenant.slug} className="bg-indigo-900">
                                    {tenant.name}
                                </option>
                            ))}
                        </select>
                        {selectedTenantData && (
                            <p className="text-xs text-indigo-400 mt-1 px-1">
                                Logging into: {selectedTenantData.name}
                            </p>
                        )}
                    </div>

                    {/* Email with Registration Check */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest px-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setIsRegistered(null);
                            }}
                            onBlur={checkRegistration}
                            className="h-12 w-full rounded-2xl bg-indigo-900/50 border border-indigo-700/50 px-4 text-sm text-white placeholder-indigo-400/50 focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                            placeholder="name@company.com"
                        />
                        {/* Registration Status */}
                        {checkingRegistration && (
                            <p className="text-xs text-indigo-400 mt-1 px-1 flex items-center gap-2">
                                <span className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></span>
                                Checking registration...
                            </p>
                        )}
                        {isRegistered === true && (
                            <p className="text-xs text-emerald-400 mt-1 px-1 flex items-center gap-1">
                                ✓ Registered user found
                            </p>
                        )}
                        {isRegistered === false && (
                            <p className="text-xs text-red-400 mt-1 px-1 flex items-center gap-1">
                                ✗ Not registered. Contact your admin.
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest px-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 w-full rounded-2xl bg-indigo-900/50 border border-indigo-700/50 px-4 text-sm text-white placeholder-indigo-400/50 focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || isRegistered === false}
                        className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Sign In to Organization"
                        )}
                    </button>
                </form>

                {/* Info Box */}
                <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <p className="text-indigo-300 text-xs font-medium mb-2">📋 Before You Login</p>
                    <p className="text-indigo-400/70 text-xs">
                        You must be registered by your organization admin before you can log in.
                        If you don&apos;t have an account, please contact your admin.
                    </p>
                </div>

                <div className="mt-6 text-center space-y-3">
                    <Link
                        href="/login"
                        className="text-indigo-400 text-sm hover:text-white transition-colors block"
                    >
                        ← Back to Login Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}
