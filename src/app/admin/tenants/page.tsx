"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/lib/types";
import Link from "next/link";

type Tenant = Tables<"tenants">;

/**
 * @feature ADMIN_TENANT_MANAGEMENT
 * @aiNote Dedicated page for super admins to manage tenants (approve, deactivate, monitor).
 */
export default function AdminTenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        const { data } = await (supabase
            .from("tenants") as any)
            .select("*")
            .order("created_at", { ascending: false });

        if (data) setTenants(data as Tenant[]);
        setLoading(false);
    };

    const toggleTenantStatus = async (tenantId: string, currentStatus: boolean) => {
        const { error } = await (supabase
            .from("tenants") as any)
            .update({ is_active: !currentStatus })
            .eq("id", tenantId);

        if (!error) {
            setTenants(prev => prev.map(t =>
                t.id === tenantId ? { ...t, is_active: !currentStatus } : t
            ));
        }
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm mb-2 inline-block">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Tenant Management</h1>
                        <p className="text-zinc-500 mt-1">Control access and monitor organization accounts</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all outline-none w-64"
                        />
                        <button className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm">
                            + New Tenant
                        </button>
                    </div>
                </header>

                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/50">
                                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Organization</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Slug</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Created</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8 h-16 bg-zinc-50/20 dark:bg-zinc-800/20"></td>
                                    </tr>
                                ))
                            ) : filteredTenants.length > 0 ? (
                                filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-900 dark:text-zinc-50">{tenant.name}</div>
                                            <div className="text-xs text-zinc-400 font-mono mt-0.5">{tenant.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 font-medium">/{tenant.slug}</td>
                                        <td className="px-6 py-4 text-sm text-zinc-500">
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${tenant.is_active
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {tenant.is_active ? 'Active' : 'Deactivated'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => toggleTenantStatus(tenant.id, tenant.is_active)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tenant.is_active
                                                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                                                    : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                                                    }`}
                                            >
                                                {tenant.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                                Settings
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 italic">
                                        No tenants found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
