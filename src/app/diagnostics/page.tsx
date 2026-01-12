"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UserRecord {
    id: string;
    role: string;
    email: string;
    tenant_id: string;
}

interface TenantRecord {
    id: string;
    name: string;
    is_active: boolean;
    slug: string;
}

/**
 * @feature PLATFORM_DIAGNOSTICS
 * @aiNote Tool for users to verify their registration and tenant status without browser agent assistance.
 */
export default function DiagnosticsPage() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const runDiagnostics = async () => {
        setLoading(true);
        const checks = [];

        // 1. Auth Session
        const { data: { session } } = await supabase.auth.getSession();
        checks.push({
            name: "Auth Session",
            status: session ? "Active" : "None",
            detail: session ? `Logged in as ${session.user.email}` : "Not logged in"
        });

        if (session) {
            // 2. Metadata Check
            const metadata = session.user.user_metadata;
            checks.push({
                name: "User Metadata",
                status: metadata.tenant_id ? "Valid" : "Incomplete",
                detail: `Tenant ID: ${metadata.tenant_id || "MISSING"}, Role: ${metadata.role || "MISSING"}`
            });

            // 3. User Table Sync
            const { data: userRecord } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .maybeSingle() as { data: UserRecord | null };

            checks.push({
                name: "Public User Table Sync",
                status: userRecord ? "Synced" : "Missing",
                detail: userRecord ? `Role: ${userRecord.role}` : "No record found in public.users"
            });

            // 4. Tenant Verification
            if (metadata.tenant_id) {
                const { data: tenant } = await supabase
                    .from("tenants")
                    .select("*")
                    .eq("id", metadata.tenant_id)
                    .maybeSingle() as { data: TenantRecord | null };

                checks.push({
                    name: "Tenant Existence",
                    status: tenant ? "Found" : "Not Found",
                    detail: tenant ? `Name: ${tenant.name}, Active: ${tenant.is_active}` : `Tenant ${metadata.tenant_id} not in DB`
                });
            }
        }

        setResults(checks);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <h1 className="text-2xl font-bold mb-4 text-emerald-400">TalentHub System Diagnostics</h1>
            <p className="text-zinc-500 mb-8">Run this to identify why organization login might be failing.</p>

            <button
                onClick={runDiagnostics}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold mb-8 transition-all"
            >
                {loading ? "Running..." : "Run Diagnostics"}
            </button>

            <div className="space-y-4">
                {results.map((res, i) => (
                    <div key={i} className="border border-zinc-800 p-4 rounded-xl bg-zinc-900/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold">{res.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${res.status === "Valid" || res.status === "Active" || res.status === "Synced" || res.status === "Found"
                                ? "bg-emerald-900/30 text-emerald-400"
                                : "bg-red-900/30 text-red-400"
                                }`}>{res.status}</span>
                        </div>
                        <p className="text-xs text-zinc-400">{res.detail}</p>
                    </div>
                ))}
            </div>

            {results.length > 0 && !loading && (
                <div className="mt-12 p-6 border border-emerald-900/30 bg-emerald-950/20 rounded-2xl">
                    <h2 className="text-lg font-bold text-emerald-400 mb-2">Instructions</h2>
                    <ul className="text-sm list-disc list-inside text-zinc-300 space-y-2">
                        <li>If "Public User Table" is Missing: Run <code className="text-emerald-300">05_users_sync.sql</code> in SQL Editor.</li>
                        <li>If "Tenant Existence" is Not Found: You must create the tenant manually or via registration.</li>
                        <li>If "Role" is Developer: Login via <code className="text-emerald-300">/engineer/login</code> instead.</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
