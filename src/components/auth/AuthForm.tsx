"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { logAuthEvent } from "@/lib/audit";
import { useRouter } from "next/navigation";

interface AuthFormProps {
    mode: "login" | "register";
    adminMode?: boolean;
    portalType?: "default" | "engineer" | "admin";
}

interface Tenant {
    id: string;
    name: string;
    slug: string;
}

/**
 * @feature auth:login-register
 * @aiNote Enhanced: Supports adminMode for super admin portal, tenant selection, 
 * and auto-creates user row in public.users table on registration.
 * @businessRule Users are assigned to selected tenant on registration.
 */
export default function AuthForm({ mode, adminMode = false, portalType = "default" }: AuthFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedTenant, setSelectedTenant] = useState<string>("");
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTenantSelect, setShowTenantSelect] = useState(false);
    const router = useRouter();

    // Fetch available tenants for selection
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
                    setSelectedTenant((data as Tenant[])[0].id);
                }
            }
        };
        fetchTenants();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === "register") {
                // Get the tenant ID from slug if needed
                const tenantId = selectedTenant;
                const role = adminMode ? "admin" : "subscriber";

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            tenant_id: tenantId,
                            role: role
                        },
                    },
                });
                if (signUpError) throw signUpError;

                // Auto-create row in public.users table
                if (signUpData.user) {
                    const { error: insertError } = await supabase
                        .from("users")
                        .insert({
                            id: signUpData.user.id,
                            tenant_id: tenantId,
                            email: email,
                            role: role
                        } as any); // Type assertion - Supabase types not generated

                    if (insertError) {
                        console.error("Failed to create user record:", insertError);
                        // Don't fail registration, just log the error
                    }
                }

                await logAuthEvent("registration", { email, tenant_id: tenantId, role });
                router.push("/organization/dashboard");
            } else {
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;

                await logAuthEvent("login", { email });

                // Check role for admin mode
                if (adminMode) {
                    const role = signInData.user?.user_metadata?.role;
                    if (role !== "admin" && role !== "super_admin") {
                        await supabase.auth.signOut();
                        throw new Error("Access denied. Admin privileges required.");
                    }
                    router.push("/admin");
                } else if (portalType === "engineer") {
                    // Engineer portal - route to engineer profile
                    router.push("/engineer/profile");
                } else {
                    // Route based on user role
                    const role = signInData.user?.user_metadata?.role;
                    if (role === "admin") {
                        router.push("/admin");
                    } else if (role === "provider") {
                        router.push("/engineer/profile");
                    } else {
                        router.push("/organization/dashboard");
                    }
                }
            }
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            if (mode === "login") {
                await logAuthEvent("auth_failure", { email, reason: err.message });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-4 w-full max-w-sm p-8 rounded-3xl border ${adminMode ? 'border-red-900/30 bg-zinc-900' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900'} shadow-xl shadow-zinc-200/50 dark:shadow-none`}>
            <div className="flex flex-col gap-2 mb-4">
                <h2 className={`text-2xl font-bold tracking-tight ${adminMode ? 'text-white' : 'text-zinc-900 dark:text-zinc-50'}`}>
                    {mode === "login"
                        ? (adminMode ? "Admin Sign In" : "Welcome back")
                        : "Create an account"}
                </h2>
                <p className={`text-sm ${adminMode ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {mode === "login"
                        ? (adminMode ? "Enter your admin credentials" : "Enter your credentials to access your dashboard")
                        : "Join the TalentHub network today"}
                </p>
            </div>

            {error && (
                <div className="p-3 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                    {error}
                </div>
            )}

            {/* Tenant Selection for Registration */}
            {mode === "register" && tenants.length > 1 && (
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                        Select Organization
                    </label>
                    <select
                        value={selectedTenant}
                        onChange={(e) => setSelectedTenant(e.target.value)}
                        className="h-12 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-all font-medium"
                    >
                        {tenants.map((tenant) => (
                            <option key={tenant.id} value={tenant.id}>
                                {tenant.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="flex flex-col gap-1">
                <label className={`text-xs font-bold uppercase tracking-widest px-1 ${adminMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Email</label>
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
                <label className={`text-xs font-bold uppercase tracking-widest px-1 ${adminMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Password</label>
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
                className={`mt-4 h-12 w-full rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2 ${adminMode
                    ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-red-500/20'
                    : 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-zinc-900/20 dark:shadow-none'
                    }`}
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    mode === "login" ? (adminMode ? "Access Admin Panel" : "Sign In") : "Get Started"
                )}
            </button>

            {!adminMode && (
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
            )}
        </form>
    );
}

