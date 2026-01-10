"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/**
 * @feature ADMIN_ANALYTICS
 * @aiNote Revenue analytics and reporting for admin dashboard.
 */
export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalPlacements: 0,
        totalEngineers: 0,
        tenantStats: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [ordersRes, matchesRes, profilesRes, tenantsRes] = await Promise.all([
                supabase.from("orders").select("total, status, tenant_id"),
                supabase.from("matches").select("status, tenant_id"),
                supabase.from("profiles").select("tenant_id"),
                supabase.from("tenants").select("id, name, slug")
            ]);

            const orders = ordersRes.data || [];
            const matches = matchesRes.data || [];
            const profiles = profilesRes.data || [];
            const tenants = tenantsRes.data || [];

            // Calculate totals
            const totalRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total, 0);
            const totalPlacements = matches.filter(m => m.status === 'hired').length;

            // Per-tenant stats
            const tenantStats = tenants.map(t => ({
                id: t.id,
                name: t.name,
                slug: t.slug,
                revenue: orders.filter(o => o.tenant_id === t.id && o.status === 'paid').reduce((sum, o) => sum + o.total, 0),
                orders: orders.filter(o => o.tenant_id === t.id).length,
                placements: matches.filter(m => m.tenant_id === t.id && m.status === 'hired').length,
                engineers: profiles.filter(p => p.tenant_id === t.id).length
            }));

            setStats({
                totalRevenue,
                totalOrders: orders.length,
                totalPlacements,
                totalEngineers: profiles.length,
                tenantStats
            });
        } catch (err) {
            console.error("Error fetching analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        const headers = ["Tenant", "Revenue", "Orders", "Placements", "Engineers"];
        const rows = stats.tenantStats.map(t => [
            t.name,
            (t.revenue / 100).toFixed(2),
            t.orders,
            t.placements,
            t.engineers
        ]);

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `talenthub-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
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
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Analytics & Reports</h1>
                        <p className="text-zinc-500 mt-1">Platform-wide performance metrics</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportCSV}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                            📥 Export CSV
                        </button>
                        <Link
                            href="/admin"
                            className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                {/* Platform Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl p-6 text-white">
                        <p className="text-red-100 text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold mt-1">₹{(stats.totalRevenue / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                        <p className="text-zinc-500 text-sm">Total Orders</p>
                        <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{stats.totalOrders}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                        <p className="text-zinc-500 text-sm">Placements</p>
                        <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.totalPlacements}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                        <p className="text-zinc-500 text-sm">Engineers</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalEngineers}</p>
                    </div>
                </div>

                {/* Per-Tenant Breakdown */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Per-Tenant Performance</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50 dark:bg-zinc-800">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Tenant</th>
                                    <th className="text-right px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Revenue</th>
                                    <th className="text-right px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Orders</th>
                                    <th className="text-right px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Placements</th>
                                    <th className="text-right px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Engineers</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {stats.tenantStats.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-zinc-900 dark:text-zinc-50">{tenant.name}</p>
                                            <p className="text-xs text-zinc-400 font-mono">{tenant.slug}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{(tenant.revenue / 100).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-zinc-500">{tenant.orders}</td>
                                        <td className="px-6 py-4 text-right text-zinc-500">{tenant.placements}</td>
                                        <td className="px-6 py-4 text-right text-zinc-500">{tenant.engineers}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
