"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EliteUpgrade from "@/components/organization/EliteUpgrade";
import { useRealtime } from "@/providers/RealtimeProvider";

/**
 * @feature ORGANIZATION_DASHBOARD
 * @aiNote Premium, high-performance dashboard for organizations.
 */
export default function OrganizationDashboard() {
    const [stats, setStats] = useState({
        engineers: 0,
        requirements: 0,
        matches: 0,
        placements: 0,
        interviews: 0,
        messages: 0
    });
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<{ name: string, slug: string } | null>(null);
    const [user, setUser] = useState<any>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const router = useRouter();
    const { subscribeToGlobalChanges, lastUpdate } = useRealtime();

    // Initial load
    useEffect(() => {
        fetchData();
    }, []);

    // Re-fetch when global realtime events occur
    useEffect(() => {
        if (lastUpdate > 0 && tenantId) {
            console.log('[Dashboard] 🔄 Realtime update detected, refreshing stats');
            fetchData();
        }
    }, [lastUpdate]);

    // Subscribe to global changes
    useEffect(() => {
        if (!tenantId) return;

        const cleanup = subscribeToGlobalChanges({
            tenantId,
            tables: ['matches', 'interviews', 'requirements', 'messages', 'profiles'],
            onAnyChange: () => {
                console.log('[Dashboard] 📊 Data changed, will refresh on next render');
            }
        });

        return cleanup;
    }, [tenantId, subscribeToGlobalChanges]);

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/organization/login");
                return;
            }

            const userData = session.user;
            setUser(userData);

            // Role & Tenant checks are now handled by middleware.ts protection.
            // We just need to extract the tenantId for data fetching.
            const tenantId = userData.user_metadata?.tenant_id || userData.app_metadata?.tenant_id;

            // Safety fallback if middleware somehow let a non-tenant user through
            if (!tenantId) {
                console.error("No tenant ID found despite middleware protection");
                return;
            }

            setTenantId(tenantId);

            // Fetch Tenant and Stats
            const [tenantRes, engineersRes, reqsRes, matchesRes, interviewsRes, messagesRes] = await Promise.all([
                supabase.from("tenants").select("name, slug").eq("id", tenantId).single(),
                supabase.from("profiles").select("id", { count: 'exact', head: true }).eq("tenant_id", tenantId),
                supabase.from("requirements").select("id", { count: 'exact', head: true }).eq("tenant_id", tenantId),
                supabase.from("matches").select("id", { count: 'exact', head: true }).eq("tenant_id", tenantId),
                supabase.from("interviews").select("id", { count: 'exact', head: true }).eq("tenant_id", tenantId),
                supabase.from("messages").select("id", { count: 'exact', head: true }).eq("tenant_id", tenantId)
            ]);

            setTenant(tenantRes.data);
            setStats({
                engineers: engineersRes.count || 0,
                requirements: reqsRes.count || 0,
                matches: matchesRes.count || 0,
                placements: 0, // Placeholder for now
                interviews: interviewsRes.count || 0,
                messages: messagesRes.count || 0
            });

        } catch (e: unknown) {
            const error = e as Error;
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
        }
    };


    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto">
                {/* Top Nav/Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] font-black text-indigo-400 uppercase tracking-widest">Enterprise</div>
                            <span className="text-zinc-500 text-xs font-medium">{tenant?.name || "TalentHub Partner"}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                            Org Command Center
                        </h1>
                    </div>
                    <div className="flex gap-4">
                        {/* Logout moved to profile menu or relying on other navigation */}
                    </div>
                </header>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
                    <DashboardCard title="Talent Pool" value={stats.engineers} icon="👥" color="indigo" link="/organization/engineers" />
                    <DashboardCard title="Active Reqs" value={stats.requirements} icon="📋" color="purple" link="/organization/requirements" />
                    <DashboardCard title="Live Matches" value={stats.matches} icon="🎯" color="emerald" link="/organization/matching" />
                    <DashboardCard title="Communications" value="Live" icon="💬" color="blue" link="/organization/messages" />
                    <DashboardCard title="Interviews" value={stats.interviews} icon="📅" color="indigo" link="/organization/interviews" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 backdrop-blur-3xl">
                            <h2 className="text-2xl font-bold mb-8">Strategic Overview</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <QuickAction icon="💬" title="Message Center" desc="Chat with engineers" href="/organization/messages" />
                                <QuickAction icon="📹" title="Video Portal" desc="Join scheduled interviews" href="/organization/interviews" />
                                <QuickAction icon="🏢" title="Company Profile" desc="Update brand presence" href="/organization/settings" />
                                <QuickAction icon="💰" title="Invoice Center" desc="Manage payments & billing" href="/organization/invoices" />
                            </div>
                        </section>

                        <section className="p-8 rounded-[2.5rem] bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/20">🚀</div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Scale your recruitment</h3>
                                    <p className="text-zinc-500 text-sm">You have <span className="text-indigo-400 font-bold">{stats.requirements}</span> open requirements. Consider auto-matching to speed up sourcing.</p>
                                </div>
                                <Link href="/organization/matching" className="ml-auto px-6 py-3 bg-indigo-500 text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all">
                                    Start Matching
                                </Link>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <section className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all"></div>
                            <h3 className="text-xl font-black mb-1 relative z-10">TalentHub Elite</h3>
                            <p className="text-xs font-bold text-indigo-200/60 mb-6 uppercase tracking-widest relative z-10">Premium Recruitment</p>
                            <ul className="space-y-3 mb-8 relative z-10">
                                <li className="flex items-center gap-2 text-sm font-bold"><span>✦</span> Curated Talent Pipeline</li>
                                <li className="flex items-center gap-2 text-sm font-bold"><span>✦</span> Direct Source Integration</li>
                                <li className="flex items-center gap-2 text-sm font-bold"><span>✦</span> Priority Support</li>
                            </ul>
                            <EliteUpgrade />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardCard({ title, value, icon, color, link }: any) {
    const colors: any = {
        indigo: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400",
        purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20 hover:border-purple-500/40 text-purple-400",
        emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400",
        blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40 text-blue-400"
    };

    return (
        <Link href={link} className={`p-6 rounded-[2rem] bg-gradient-to-br border transition-all hover:scale-[1.03] group ${colors[color]}`}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">{icon}</span>
                <span className="text-white/20 group-hover:text-white/40 transition-colors">→</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60 group-hover:opacity-100 transition-opacity">{title}</p>
            <p className="text-3xl font-black text-white group-hover:translate-x-1 transition-transform">{value}</p>
        </Link>
    );
}

function QuickAction({ icon, title, desc, href }: any) {
    return (
        <Link href={href} className="p-5 rounded-2xl bg-zinc-800/20 border border-white/5 hover:border-white/10 transition-colors flex items-center gap-5 cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">{icon}</div>
            <div>
                <h4 className="font-bold text-sm tracking-tight">{title}</h4>
                <p className="text-xs text-zinc-600 font-medium">{desc}</p>
            </div>
        </Link>
    );
}

function StatusItem({ label, status, color }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 font-medium">{label}</span>
            <span className={`text-xs font-bold ${color}`}>{status}</span>
        </div>
    );
}
