"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/**
 * @feature ADMIN_USERS
 * @aiNote User management for admin - create users, assign roles, deactivate.
 */
export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState<"admin" | "provider" | "subscriber" | "super_admin">("subscriber");
    const [newTenant, setNewTenant] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, tenantsRes] = await Promise.all([
                (supabase.from("users") as any).select("*, tenants(name)").order("created_at", { ascending: false }),
                (supabase.from("tenants") as any).select("id, name, slug").eq("is_active", true)
            ]);

            if (usersRes.data) setUsers(usersRes.data);
            if (tenantsRes.data) {
                setTenants(tenantsRes.data);
                if (tenantsRes.data.length > 0) setNewTenant(tenantsRes.data[0].id);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail || !newTenant) return;

        setCreating(true);
        try {
            const response = await fetch("/api/admin/invite-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newEmail,
                    password: newPassword,
                    role: newRole,
                    tenant_id: newTenant
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to invite user");

            setShowCreateModal(false);
            setNewEmail("");
            setNewPassword("");
            setNewRole("subscriber");
            fetchData();
        } catch (err: any) {
            console.error("Error creating user:", err);
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const updateRole = async (userId: string, newRole: string) => {
        try {
            const { error } = await (supabase
                .from("users") as any)
                .update({ role: newRole })
                .eq("id", userId);

            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error("Error updating role:", err);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'super_admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'provider': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'subscriber': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">User Management</h1>
                        <p className="text-zinc-500 mt-1">Create and manage platform users</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors"
                        >
                            + New User
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Total Users</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{users.length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Admins</p>
                        <p className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Engineers</p>
                        <p className="text-2xl font-bold text-emerald-600">{users.filter(u => u.role === 'provider').length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Clients</p>
                        <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'subscriber').length}</p>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-50">All Users</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50 dark:bg-zinc-800">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Organization</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Role</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Joined</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{user.email}</td>
                                        <td className="px-6 py-4 text-zinc-500">{user.tenants?.name || "-"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.role}
                                                onChange={(e) => updateRole(user.id, e.target.value)}
                                                className="text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-2 py-1"
                                            >
                                                <option value="subscriber">Client</option>
                                                <option value="provider">Engineer</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Create New User</h2>
                            <form onSubmit={createUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                        required
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Password (Optional)</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                        placeholder="Leave blank for auto-gen"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Organization</label>
                                    <select
                                        value={newTenant}
                                        onChange={(e) => setNewTenant(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                        required
                                    >
                                        {tenants.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Role</label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value as any)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                    >
                                        <option value="subscriber">Client (Subscriber)</option>
                                        <option value="provider">Engineer (Provider)</option>
                                        <option value="admin">Administrator</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
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
                                        {creating ? "Creating..." : "Create User"}
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
