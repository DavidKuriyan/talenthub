"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/**
 * @feature ADMIN_TENANTS
 * @aiNote Tenant management for super admin - create, configure, activate/deactivate tenants.
 */
export default function AdminTenantsPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTenantName, setNewTenantName] = useState("");
    const [newTenantSlug, setNewTenantSlug] = useState("");

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const { data, error } = await supabase
                .from("tenants")
                .select("*")
                .order("name");

            if (error) throw error;
            if (data) setTenants(data);
        } catch (err) {
            console.error("Error fetching tenants:", err);
        } finally {
            setLoading(false);
        }
    };

    const createTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTenantName || !newTenantSlug) return;

        setCreating(true);
        try {
            const { error } = await supabase
                .from("tenants")
                .insert({
                    name: newTenantName,
                    slug: newTenantSlug.toLowerCase().replace(/\s+/g, '-'),
                    is_active: true
                });

            if (error) throw error;

            setShowCreateModal(false);
            setNewTenantName("");
            setNewTenantSlug("");
            fetchTenants();
        } catch (err: any) {
            console.error("Error creating tenant:", err);
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const toggleTenantStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("tenants")
                .update({ is_active: !currentStatus })
                .eq("id", id);

            if (error) throw error;
            fetchTenants();
        } catch (err) {
            console.error("Error updating tenant:", err);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Tenant Management</h1>
                        <p className="text-zinc-500 mt-1">Create and manage organization tenants</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors"
                        >
                            + New Tenant
                        </button>
                        <Link
                            href="/admin"
                            className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Total Tenants</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{tenants.length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Active</p>
                        <p className="text-2xl font-bold text-emerald-600">{tenants.filter(t => t.is_active).length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Inactive</p>
                        <p className="text-2xl font-bold text-red-600">{tenants.filter(t => !t.is_active).length}</p>
                    </div>
                </div>

                {/* Tenants Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-50">All Tenants</h2>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {tenants.map((tenant) => (
                            <div key={tenant.id} className="p-6 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{tenant.name}</p>
                                    <p className="text-sm text-zinc-400 font-mono">{tenant.slug}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tenant.is_active
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {tenant.is_active ? "Active" : "Inactive"}
                                    </span>
                                    <button
                                        onClick={() => toggleTenantStatus(tenant.id, tenant.is_active)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tenant.is_active
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            }`}
                                    >
                                        {tenant.is_active ? "Deactivate" : "Activate"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Create New Tenant</h2>
                            <form onSubmit={createTenant} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Organization Name</label>
                                    <input
                                        type="text"
                                        value={newTenantName}
                                        onChange={(e) => {
                                            setNewTenantName(e.target.value);
                                            setNewTenantSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                        placeholder="e.g., Acme Corporation"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Slug (URL-friendly)</label>
                                    <input
                                        type="text"
                                        value={newTenantSlug}
                                        onChange={(e) => setNewTenantSlug(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-mono"
                                        placeholder="e.g., acme-corp"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {creating ? "Creating..." : "Create Tenant"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
